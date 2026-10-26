#!/usr/bin/env python3
"""Fetch approved Figma reference frames for local screenshot comparison.
Requires FIGMA_ACCESS_TOKEN in a short-lived GitHub Actions environment.
Do not store credentials or temporary render URLs in reports.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_figma_templates import fetch_design

OUT=Path("visual-qa-output")
OUT.mkdir(parents=True,exist_ok=True)

def get_json(url, token):
    req=urllib.request.Request(url,headers={"X-Figma-Token":token,"Accept":"application/json","User-Agent":"UST-Visual-QA/1.0"})
    try:
        with urllib.request.urlopen(req,timeout=90) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError("Figma REST endpoint returned HTTP "+str(exc.code)) from None

def download_image(url, path):
    if not url or not url.startswith("https://"):
        raise RuntimeError("Figma did not return an HTTPS image URL")
    # URLs are never logged; prevent unbounded response sizes.
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"UST-Visual-QA/1.0"}), timeout=120) as response:
        image=response.read(25*1024*1024+1)
    if len(image)>25*1024*1024 or not image.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError("Reference export is not a valid bounded PNG")
    path.write_bytes(image)

def main():
    token=os.environ.get("FIGMA_ACCESS_TOKEN","").strip()
    if not token:
        raise RuntimeError("FIGMA_ACCESS_TOKEN repository secret is missing")
    registry=json.loads(Path("data/figma-template-registry.json").read_text())
    key=registry["figmaCopy"]["fileKey"]
    canvas=registry["figmaCopy"]["canvasNode"]
    raw=fetch_design(key,canvas,token)
    doc=raw.get("nodes",{}).get(canvas,{}).get("document")
    if not doc:
        raise RuntimeError("Copied Figma templates canvas not accessible")
    target=None
    for n in doc.get("children",[]):
        if n.get("type")=="SECTION" and "T1" in n.get("name","").split():
            target=n
            break
    if target is None:
        import re
        for n in doc.get("children",[]):
            if n.get("type")=="SECTION" and re.search(r"\bT1\b",n.get("name","")):
                target=n
                break
    if target is None:
        raise RuntimeError("T1 Origins section not found on copied canvas")
    frames={}
    for child in target.get("children",[]):
        name=child.get("name","")
        if "Template" in name and "Desktop" in name:
            frames["desktop"]=child
        if "Template" in name and "Mobile" in name:
            frames["mobile"]=child
    if set(frames)!={"desktop","mobile"}:
        raise RuntimeError("Expected T1 Origins Desktop and Mobile template frames")
    ids=",".join(frames[v]["id"] for v in ("desktop","mobile"))
    query=urllib.parse.urlencode({"ids":ids,"format":"png","scale":"1"})
    response=get_json(f"https://api.figma.com/v1/images/{key}?{query}",token)
    if response.get("err"):
        raise RuntimeError("Figma images API returned an export error")
    result={}
    for variant,frame in frames.items():
        render_url=(response.get("images") or {}).get(frame["id"])
        if not render_url:
            raise RuntimeError("Missing Figma "+variant+" frame export")
        download_image(render_url,OUT/("figma-"+variant+".png"))
        box=frame.get("absoluteBoundingBox",{})
        result[variant]={"nodeId":frame["id"],"width":box.get("width"),"height":box.get("height")}
    (OUT/"reference-metadata.json").write_text(json.dumps(result,indent=2)+"\n")
    print("Figma T1 Origins desktop/mobile references captured. No access token or temporary URL recorded.")

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print("Figma reference extraction failed: "+str(exc),file=sys.stderr)
        sys.exit(1)
