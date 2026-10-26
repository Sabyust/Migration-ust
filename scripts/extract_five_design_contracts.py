#!/usr/bin/env python3
"""Read-only full Figma component-contract extractor for five pilot components.

Only structural and style metadata is serialized, never text contents, raw
Figma JSON, image bytes, tokens, URLs, or private comments.
"""
import json, os, re, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

REGISTRY = Path("data/figma-components.json")
OUT = Path("figma-spec-output")
PILOTS = [("T1","B_025"),("T1","B_037"),("T11","B_053"),("T10","B_099"),("T13","B_075")]
LAYOUT = ("layoutMode","primaryAxisAlignItems","counterAxisAlignItems","layoutWrap",
          "itemSpacing","counterAxisSpacing","paddingTop","paddingRight","paddingBottom",
          "paddingLeft","layoutSizingHorizontal","layoutSizingVertical",
          "layoutAlign","layoutGrow","constraints","clipsContent","opacity",
          "cornerRadius","rectangleCornerRadii","rotation","blendMode","visible")
TEXT = ("fontFamily","fontPostScriptName","fontWeight","fontSize","lineHeightPx",
        "lineHeightPercent","lineHeightUnit","letterSpacing","textAlignHorizontal",
        "textAlignVertical","textCase","textDecoration","paragraphSpacing",
        "paragraphIndent","fills")
PAINT = ("type","color","opacity","blendMode","gradientStops","gradientHandlePositions",
         "scaleMode","imageRef","imageTransform","rotation","visible")
EFFECT = ("type","radius","spread","offset","color","visible","blendMode")

def scalars(obj, fields):
    if not isinstance(obj,dict):return {}
    return {k:obj[k] for k in fields if k in obj}

def paint(p):
    data=scalars(p,PAINT)
    if isinstance(data.get("gradientStops"),list):
        data["gradientStops"]=[scalars(s,("position","color")) for s in data["gradientStops"]]
    return data

def box(node, parent_origin):
    b=node.get("absoluteBoundingBox") or {}
    if not b: return None
    return {k:round(v,3) for k,v in {
        "x":b.get("x",0)-parent_origin[0],"y":b.get("y",0)-parent_origin[1],
        "width":b.get("width",0),"height":b.get("height",0)}.items()}

def clean_node(n, origin, depth=0):
    if depth>80:raise ValueError("Figma node nesting exceeds approved depth")
    bounds=n.get("absoluteBoundingBox") or {}
    own_origin=(bounds.get("x",origin[0]),bounds.get("y",origin[1]))
    out={"id":n.get("id"),"name":n.get("name","")[:150],"type":n.get("type"),
         "geometry":box(n,origin),"layout":scalars(n,LAYOUT)}
    if "componentId" in n:out["componentId"]=n["componentId"]
    if n.get("fills"):out["fills"]=[paint(v) for v in n["fills"] if v.get("visible",True)]
    if n.get("strokes"):out["strokes"]=[paint(v) for v in n["strokes"] if v.get("visible",True)]
    if "strokeWeight" in n:out["strokeWeight"]=n["strokeWeight"]
    if n.get("effects"):out["effects"]=[scalars(v,EFFECT) for v in n["effects"] if v.get("visible",True)]
    if n.get("type")=="TEXT":
        style=n.get("style") or {}
        out["typography"]=scalars(style,TEXT)
        if out["typography"].get("fills"):
            out["typography"]["fills"]=[paint(v) for v in out["typography"]["fills"]]
        # Explicitly don't include text characters, copy, or styleOverrideTable
        out["hasText"]=bool(n.get("characters"))
    children=n.get("children") or []
    if children:out["children"]=[clean_node(c,own_origin,depth+1) for c in children]
    return out

def fetch(ids,file_key,token,depth):
    query=urllib.parse.urlencode({"ids":",".join(ids),"depth":str(depth)})
    url=f"https://api.figma.com/v1/files/{file_key}/nodes?{query}"
    req=urllib.request.Request(url,headers={"X-Figma-Token":token,
                                           "Accept":"application/json",
                                           "User-Agent":"UST-Design-Contract/1.0"})
    try:
        with urllib.request.urlopen(req,timeout=120) as response:
            raw=response.read(40*1024*1024+1)
            if len(raw)>40*1024*1024:raise RuntimeError("Figma response exceeds the 40MB safety limit")
            return json.loads(raw)
    except urllib.error.HTTPError as err:
        if err.code==429:
            wait=err.headers.get("Retry-After","not supplied")
            raise RuntimeError(f"Figma HTTP 429 — rate-limited; Retry-After: {wait}. Stop and retry only after allowance resets.") from None
        if err.code in (401,403,404):
            raise RuntimeError(f"Figma HTTP {err.code}: verify read-only token permissions and access") from None
        raise RuntimeError(f"Figma HTTP {err.code}") from None

def main():
    token=os.environ.get("FIGMA_ACCESS_TOKEN","").strip()
    if not token:raise RuntimeError("Missing FIGMA_ACCESS_TOKEN repository secret")
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    pairs=[]
    for family,code in PILOTS:
        for variant in ("desktop","mobile"):
            found=[x for x in registry["templates"][family]["variants"][variant]["components"] if x["code"]==code]
            if len(found)!=1:raise ValueError(f"Expected one instance of {family}/{code}/{variant}")
            pairs.append((family,code,variant,found[0]))
    selected_code=os.getenv("FIGMA_COMPONENT","B_025").strip()
    selected_variant=os.getenv("FIGMA_VARIANT","desktop").strip()
    depth=int(os.getenv("FIGMA_DEPTH","3"))
    if selected_code not in {x[1] for x in PILOTS}:
        raise ValueError("Unsupported Figma component selection")
    if selected_variant not in ("desktop","mobile","both"):
        raise ValueError("Invalid Figma variant")
    if depth not in (2,3,4,5,6):
        raise ValueError("Depth must be between 2 and 6")
    pairs=[x for x in pairs if x[1]==selected_code and
           (selected_variant=="both" or x[2]==selected_variant)]
    ids=[item["figmaInstanceId"] for _,_,_,item in pairs]
    payload=fetch(ids,registry["sourceFigmaFile"],token,depth)
    collected=[]
    for family,code,variant,entry in pairs:
        key=entry["figmaInstanceId"]
        doc=(payload.get("nodes") or {}).get(key,{}).get("document")
        if not doc:raise ValueError(f"Missing Figma node {key}; no partial certification")
        rect=doc.get("absoluteBoundingBox") or {}
        root=clean_node(doc,(rect.get("x",0),rect.get("y",0)))
        all_nodes=[]
        def visit(n):
            all_nodes.append(n)
            for ch in n.get("children",[]):visit(ch)
        visit(root)
        collected.append({"template":family,"code":code,"variant":variant,"figmaInstanceId":key,
                          "expectedFrame":entry["geometry"],"nodeCount":len(all_nodes),
                          "textLayers":sum(x["type"]=="TEXT" for x in all_nodes),
                          "imagePaints":sum(p.get("type")=="IMAGE" for n in all_nodes for p in n.get("fills",[])),
                          "contract":root})
    OUT.mkdir(parents=True,exist_ok=True)
    result={"schemaVersion":"1.0","fileKey":registry["sourceFigmaFile"],
            "verificationStatus":"extracted_from_figma_not_implemented",
            "contentIncluded":False,"pixelPerfectCertified":False,
            "extractionScope":{"component":selected_code,"variant":selected_variant,
                               "depth":depth,"completeNestedHierarchy":False},
            "components":collected}
    (OUT/"five-full-design-contracts.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    summary=["# Figma component extraction (bounded scope)","",
        f"Component: {selected_code}; variant: {selected_variant}; depth: {depth}.",
        "**Partial nested hierarchy; not eligible for design accuracy certification.**","",
        "| Component | Variant | Nested layers | Text layers | Image paints |",
        "|---|---|---:|---:|---:|"]
    for x in collected:
        summary.append(f"| {x['code']} | {x['variant']} | {x['nodeCount']} | {x['textLayers']} | {x['imagePaints']} |")
    summary+=["","**Scope:** Nested layer hierarchy, geometry, Auto Layout, text style properties, fills, strokes, effects and image references only.",
              "**Excluded:** Original copy, bitmap/vector asset bytes, token values, API URLs, approval of React fidelity.",
              "Full component accuracy requires implementing every required layer and approved assets, then comparing DOM contracts."]
    md="\n".join(summary)+"\n"
    (OUT/"extraction-summary.md").write_text(md,encoding="utf-8")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf-8") as out:out.write(md)
    print(f"Extracted {len(collected)} partial component contract(s), depth {depth}, in one REST request.")
if __name__=="__main__":
    try:main()
    except Exception as e:
        OUT.mkdir(parents=True,exist_ok=True)
        (OUT/"extraction-error.txt").write_text(str(e)+"\n",encoding="utf-8")
        print("Contract extraction unavailable: "+str(e),file=sys.stderr)
        sys.exit(1)
