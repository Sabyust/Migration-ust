#!/usr/bin/env python3
"""Export Figma template instances to a sanitized code-component map.

Read-only. Never writes Figma API credentials, text contents or image URLs.
Design metadata is kept in a private-to-run Actions artifact (not committed).
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_figma_templates import fetch_design

REGISTRY = Path("data/figma-template-registry.json")
OUT = Path("component-map-output")
CODE_RE = re.compile(r"\b(B_\d{3})(?:-[DM])?\b")
TEMPLATE_RE = re.compile(r"\bT(1[0-4]|[1-9])\b")


def walk(node):
    yield node
    for ch in node.get("children", []):
        yield from walk(ch)


def rect(node, frame=None):
    b = node.get("absoluteBoundingBox") or {}
    if not b:
        return None
    x, y = b.get("x", 0), b.get("y", 0)
    if frame:
        fb = frame.get("absoluteBoundingBox") or {}
        x -= fb.get("x", 0)
        y -= fb.get("y", 0)
    return {k: round(v, 2) for k, v in {"x": x, "y": y, "width": b.get("width", 0), "height": b.get("height", 0)}.items()}


def layout(node):
    keys=("layoutMode","primaryAxisAlignItems","counterAxisAlignItems","itemSpacing","paddingTop","paddingRight","paddingBottom","paddingLeft","layoutSizingHorizontal","layoutSizingVertical")
    return {k:node[k] for k in keys if k in node and isinstance(node[k], (str,int,float,bool))}


def figma_get_nodes(file_key, ids, token, depth=7):
    query=urllib.parse.urlencode({"ids": ",".join(ids), "depth": str(depth)})
    req=urllib.request.Request(
        f"https://api.figma.com/v1/files/{file_key}/nodes?{query}",
        headers={"X-Figma-Token":token,"Accept":"application/json","User-Agent":"UST-Component-Mapper/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            raw=res.read(30*1024*1024+1)
            if len(raw)>30*1024*1024:
                raise RuntimeError("Response too large; reduce FIGMA_MAP_BATCH_SIZE")
            return json.loads(raw)
    except urllib.error.HTTPError as err:
        if err.code==429:
            raise RuntimeError("Figma API rate-limited (HTTP 429); retry within your plan limits") from None
        if err.code in (401,403,404):
            raise RuntimeError(f"Figma HTTP {err.code}: check token read scope and design access") from None
        raise RuntimeError(f"Figma HTTP {err.code}") from None


def family_sections(canvas):
    out={}
    for node in canvas.get("children",[]):
        if node.get("type")=="SECTION":
            match=TEMPLATE_RE.search(node.get("name",""))
            if match:
                out["T"+match.group(1)]=node
    return out


def template_frames(section):
    found=[]
    for node in section.get("children",[]):
        if node.get("type") in ("FRAME","INSTANCE","COMPONENT"):
            name=node.get("name","")
            if "Template" in name and ("Desktop" in name or "Mobile" in name):
                found.append((("mobile" if "Mobile" in name else "desktop"),node))
    return found


def collect_components(frame):
    components=[]
    seen=set()
    for node in walk(frame):
        if node.get("type") != "INSTANCE":
            continue
        match=CODE_RE.search(node.get("name",""))
        if not match:
            continue
        uid=node.get("id")
        if not uid or uid in seen:
            continue
        seen.add(uid)
        code=match.group(1)
        components.append({
            "code":code,
            "implementationKey":"Block"+code[2:],
            "instanceId":uid,
            "componentId":node.get("componentId"),
            "geometry":rect(node,frame),
            "layout":layout(node),
            "implementationStatus":"not_verified",
        })
    return components


def export(data):
    OUT.mkdir(parents=True,exist_ok=True)
    registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
    token=os.environ.get("FIGMA_ACCESS_TOKEN","")
    if not token:
        raise RuntimeError("Missing FIGMA_ACCESS_TOKEN Actions repository secret")
    copy=registry["figmaCopy"]
    canvas_json=fetch_design(copy["fileKey"],copy["canvasNode"],token)
    canvas=canvas_json.get("nodes",{}).get(copy["canvasNode"],{}).get("document")
    if not canvas:
        raise RuntimeError("Figma templates canvas could not be read")
    sections=family_sections(canvas)
    frames=[]
    for family in registry["templates"]:
        section=sections.get(family["id"])
        variants=template_frames(section) if section else []
        for variant,frame in variants:
            frames.append((family["id"],variant,frame["id"]))
    if len(frames)<28:
        raise RuntimeError(f"Only {len(frames)}/28 expected template frames identified. Cannot generate complete map.")

    # Fetch deep frame trees in batches; IDs from the authorized canvas response.
    # This avoids unintentionally scraping unrelated Figma pages.
    collected={}
    batch_size=max(1,min(int(os.getenv("FIGMA_MAP_BATCH_SIZE","7")),14))
    for off in range(0,len(frames),batch_size):
        batch=frames[off:off+batch_size]
        doc=figma_get_nodes(copy["fileKey"],[x[2] for x in batch],token,depth=7)
        for fam,variant,node_id in batch:
            frame=doc.get("nodes",{}).get(node_id,{}).get("document")
            if not frame:
                raise RuntimeError(f"Figma frame {fam} {variant} missing from response")
            comp=collect_components(frame)
            collected[(fam,variant)]={
                "frameId":node_id,"dimensions":rect(frame),"layout":layout(frame),
                "components":comp,
            }
    results=[]
    for family in registry["templates"]:
        fam=family["id"]
        variants={v:collected.get((fam,v)) for v in ("desktop","mobile")}
        expected=family.get("componentsOriginalSource",[])
        actual=set(x["code"] for v in variants.values() if v for x in v["components"])
        results.append({
            "id":fam,"name":family["name"],"variants":variants,
            "knownCodesMissing":[x for x in expected if x not in actual],
            "componentInventoryStatus":"extracted_not_visually_verified",
        })
    data={"schemaVersion":"1.0","source":"Figma REST API: copied templates canvas",
          "fileKey":copy["fileKey"],"canvasNode":copy["canvasNode"],
          "pixelPerfect":False,
          "note":"Frame-level component mapping only. Nested layers after depth 7, assets, CSS implementation and visual comparison remain to be audited.",
          "families":results}
    (OUT/"figma-component-map.json").write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
    codes=sorted({comp["code"] for fam in results for v in fam["variants"].values() if v for comp in v["components"]})
    # Generate a reusable JavaScript importable catalog with no source text/assets.
    catalog="export const figmaComponentCodes = "+json.dumps(codes,indent=2)+";\n"
    catalog+="export const figmaImplementationKey = (code) => /^B_\\d{3}$/.test(code) ? 'Block' + code.slice(2) : null;\n"
    (OUT/"figma-component-catalog.js").write_text(catalog,encoding="utf-8")
    lines=["# Figma T1–T14 component-to-code extraction","",
           f"Families: **{len(results)}** · Frames: **{len(frames)}** · Unique block codes: **{len(codes)}**","",
           "This is a Figma instance inventory, **not** evidence that matching React components are implemented or visually correct.","",
           "| Template | Desktop blocks | Mobile blocks | Missing previously known codes |",
           "|---|---:|---:|---|"]
    for fam in results:
        desktop=fam["variants"]["desktop"]
        mobile=fam["variants"]["mobile"]
        lines.append(f"| {fam['id']} {fam['name']} | {len(desktop['components']) if desktop else 0} | {len(mobile['components']) if mobile else 0} | {', '.join(fam['knownCodesMissing']) or '—'} |")
    lines+=["","## Next gate","Implement the mapped code blocks in React, import approved assets, then compare 1280px/390px render screenshots with Figma exports.","","**Security:** raw Figma JSON, layer text, image assets and API tokens are not included in this report."]
    summary="\n".join(lines)+"\n"
    (OUT/"figma-component-map.md").write_text(summary,encoding="utf-8")
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf-8") as f:
            f.write(summary)
    return results,codes


if __name__=="__main__":
    try:
        families,codes=export({})
        print(f"Mapped {len(families)} families and {len(codes)} unique Figma block codes; artifact is ready.")
    except Exception as err:
        OUT.mkdir(parents=True,exist_ok=True)
        # Avoid echoing API response payloads or token values.
        (OUT/"error.txt").write_text(str(err)+"\n",encoding="utf-8")
        print("Mapping stopped: "+str(err),file=sys.stderr)
        sys.exit(1)
