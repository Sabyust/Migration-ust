#!/usr/bin/env python3
"""Import a verified Figma component-map workflow artifact into the repository.
Only structural metadata is retained: no copy, image URLs, credentials, or exports.
"""
import json
import re
from pathlib import Path

source=Path("figma-artifact/figma-component-map.json")
target=Path("data/figma-components.json")
catalog=Path("src/figma/componentCatalog.js")
raw=json.loads(source.read_text(encoding="utf-8"))
registry=json.loads(Path("data/figma-template-registry.json").read_text(encoding="utf-8"))
expected={item["id"] for item in registry["templates"]}
assert raw["fileKey"]==registry["figmaCopy"]["fileKey"]
assert raw["canvasNode"]==registry["figmaCopy"]["canvasNode"]
assert len(raw["families"])==14
assert {x["id"] for x in raw["families"]}==expected
result={"schemaVersion":"1.0","sourceFigmaFile":raw["fileKey"],"sourceCanvasNode":raw["canvasNode"],
 "sourceWorkflowRun":40326521489,"status":"figma_rest_extracted_structural_metadata",
 "fidelity":"design implementation and nested styling NOT yet verified",
 "templates":{}}
codes=set()
placements=0
for family in raw["families"]:
    variants={}
    for variant in ("desktop","mobile"):
        item=family["variants"].get(variant)
        if not item:
            raise ValueError("Missing "+variant+" variant for "+family["id"])
        components=[]
        for component in item["components"]:
            code=component["code"]
            if not re.fullmatch(r"B_\d{3}",code):
                raise ValueError("Unexpected component code")
            coords=component.get("geometry") or {}
            geo={key:round(coords[key],2) for key in ("x","y","width","height") if isinstance(coords.get(key),(int,float))}
            if len(geo)!=4:
                raise ValueError("Missing component geometry")
            components.append({"code":code,"reactComponent":"Block"+code[-3:],
                "figmaInstanceId":component["instanceId"],"figmaComponentId":component.get("componentId"),
                "geometry":geo,"layout":component.get("layout",{})})
            codes.add(code)
            placements+=1
        variants[variant]={"frameId":item["frameId"],"dimensions":item.get("dimensions"),
            "components":components}
    result["templates"][family["id"]]={"name":family["name"],"variants":variants}
target.parent.mkdir(parents=True,exist_ok=True)
catalog.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(result,indent=2,ensure_ascii=True)+"\n",encoding="utf-8")
catalog.write_text("/* Generated from approved Figma REST structural metadata; not React implementations. */\n"+
 "export const figmaBlockCodes = Object.freeze("+json.dumps(sorted(codes),indent=2)+");\n"+
 "export const figmaImplementationKey = (code) => /^B_\\d{3}$/.test(code) ? 'Block' + code.slice(-3) : null;\n",
 encoding="utf-8")
print(f"Imported {len(result['templates'])} templates, {placements} placed instances, {len(codes)} unique blocks")
