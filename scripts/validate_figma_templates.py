#!/usr/bin/env python3
"""Read-only, evidence-labeled Figma template registry validation.
Does not emit raw design content or credentials. No repository mutations.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REGISTRY = Path("data/figma-template-registry.json")
OUTPUT = Path("validation-output")
API_ROOT = "https://api.figma.com/v1"


def fetch_design(file_key, canvas_id, token):
    params = urllib.parse.urlencode({"ids": canvas_id, "depth": 4})
    url = f"{API_ROOT}/files/{file_key}/nodes?{params}"
    req = urllib.request.Request(url, headers={"X-Figma-Token": token, "Accept": "application/json", "User-Agent": "UST-Template-Validator/1.0"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=75) as response:
                if response.status != 200:
                    raise RuntimeError(f"Figma returned HTTP {response.status}")
                raw = response.read(30 * 1024 * 1024 + 1)
                if len(raw) > 30 * 1024 * 1024:
                    raise RuntimeError("Figma design response exceeds 30MB safety cap")
                return json.loads(raw)
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                retry_after = exc.headers.get("Retry-After", "unavailable")
                raise RuntimeError(f"Figma API rate limit HTTP 429 (Retry-After: {retry_after}); token/seat limits apply") from None
            if exc.code in (401, 403, 404):
                raise RuntimeError(f"Figma returned HTTP {exc.code}: check token scope, file permissions and file key") from None
            if exc.code >= 500 and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            raise RuntimeError(f"Figma API returned HTTP {exc.code}") from None
        except urllib.error.URLError:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            raise RuntimeError("Figma API network request failed") from None
    raise RuntimeError("Figma API request could not complete")


def descendants(node):
    yield node
    for child in node.get("children", []):
        yield from descendants(child)


def codes(node):
    results = []
    for n in descendants(node):
        # Only count placed component instances, not text descriptions.
        if n.get("type") == "INSTANCE":
            m = re.search(r"\bB_\d{3}(?:-[DM])?\b", n.get("name", ""))
            if m:
                code = m.group(0)
                if code not in results:
                    results.append(code)
    return results


def normalized(code):
    return re.sub(r"-[DM]$", "", code)


def inspect(payload, registry):
    root = payload.get("nodes", {}).get(registry["figmaCopy"]["canvasNode"], {}).get("document")
    if not root:
        raise RuntimeError("Canvas node not found in returned file; check copied file ID and canvas node")
    sections = [n for n in root.get("children", []) if n.get("type") == "SECTION"]
    found = {}
    for sec in sections:
        m = re.search(r"\bT(1[0-4]|[1-9])\b", sec.get("name", ""))
        if m:
            found["T" + m.group(1)] = sec
    results = []
    for entry in registry["templates"]:
        sec = found.get(entry["id"])
        if not sec:
            results.append({"id":entry["id"],"family":entry["name"],"status":"missing_section","templateFrames":[],"componentCodes":[],"missingExpected":entry.get("componentsOriginalSource",[]),"unexpectedCodes":[]})
            continue
        frames = [n for n in sec.get("children", []) if n.get("type") in ("FRAME","COMPONENT","INSTANCE") and "Template" in n.get("name","")]
        if not frames:
            frames = [n for n in sec.get("children", []) if n.get("type") == "FRAME"]
        frame_details = []
        complete = []
        for fr in frames:
            c = codes(fr)
            if "Desktop" in fr.get("name", "") or "Mobile" in fr.get("name", ""):
                frame_details.append({"variant":"mobile" if "Mobile" in fr.get("name","") else "desktop","id":fr.get("id"),"width":round(fr.get("absoluteBoundingBox",{}).get("width",0),1),"height":round(fr.get("absoluteBoundingBox",{}).get("height",0),1),"componentCodes":c})
            complete.extend(normalized(x) for x in c)
        seen = list(dict.fromkeys(complete))
        expect = entry.get("componentsOriginalSource",[])
        missing = [x for x in expect if x not in seen]
        unexpected = [x for x in seen if x not in expect] if expect else []
        status = "matched_known_codes" if expect and not missing else ("requires_review" if not expect else "component_difference")
        if not frames:
            status = "frames_not_found"
        results.append({"id":entry["id"],"family":entry["name"],"status":status,"sectionNode":sec.get("id"),"templateFrames":frame_details,"componentCodes":seen,"missingExpected":missing,"unexpectedCodes":unexpected,"referenceCoverage":"partial" if expect else "not_available"})
    return results


def write_report(registry, results):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    problems = sum(1 for x in results if x["status"] in ("missing_section","component_difference","frames_not_found"))
    validated = sum(1 for x in results if x["status"]=="matched_known_codes")
    report = {"fileKey":registry["figmaCopy"]["fileKey"],"canvasNode":registry["figmaCopy"]["canvasNode"],"validationMethod":"REST read-only /nodes depth=4","registryFamilies":len(registry["templates"]),"matchedKnownCodes":validated,"flaggedDifferences":problems,"results":results,"limitations":["This checks template structure and component codes, not screenshot pixel fidelity, typography, assets or behavior.","Previously documented component inventories are partial for many families.","Depth-limited Figma response can omit deeper descendants; inspect any flagged differences before drawing conclusions."]}
    (OUTPUT/"template-validation.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    lines = ["# Figma template REST validation","",f"File: \`{report['fileKey']}\` · Canvas: \`{report['canvasNode']}\`","",f"Known-code match: **{validated}/{len(results)}**; structural differences requiring review: **{problems}**.","","| Family | Status | Desktop/mobile frames | Missing known codes |","|---|---|---:|---|"]
    for x in results:
        lines.append(f"| {x['id']} {x['family']} | {x['status']} | {len(x['templateFrames'])} | {', '.join(x['missingExpected']) or '—'} |")
    lines += ["","## Limitations","- This does not establish pixel-perfect design fidelity.","- All matches must be reviewed against the copied Figma file and screenshots.","- No confidential text, image bytes or Figma token is saved in the report."]
    md="\n".join(lines)+"\n"
    (OUTPUT/"template-validation.md").write_text(md,encoding="utf-8")
    return md, problems


def main():
    token = os.getenv("FIGMA_ACCESS_TOKEN","").strip()
    if not token:
        raise RuntimeError("FIGMA_ACCESS_TOKEN is missing; add the Actions repository secret first")
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    # Independent schema checks before network access.
    entries=registry.get("templates",[])
    assert len(entries)==14 and len({x["id"] for x in entries})==14, "Registry must contain T1–T14 exactly once"
    assert sum(int(x["pageCount"]) for x in entries)==registry["classifiedUrls"], "Page counts do not reconcile"
    payload=fetch_design(registry["figmaCopy"]["fileKey"],registry["figmaCopy"]["canvasNode"],token)
    results=inspect(payload,registry)
    report,problems=write_report(registry,results)
    print(f"Checked {len(results)} families; {problems} structure flags. Report written to validation-output/")
    summary=os.getenv("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary,"a",encoding="utf-8") as f:
            f.write(report)
    if problems:
        print("Structural discrepancies detected; see the uploaded report.")
        return 1
    return 0


if __name__=="__main__":
    try:
        sys.exit(main())
    except Exception as err:
        OUTPUT.mkdir(parents=True,exist_ok=True)
        # No token, design data or raw HTTP body in failure summary.
        msg=str(err)
        (OUTPUT/"validation-error.txt").write_text(msg+"\n",encoding="utf-8")
        summary=os.getenv("GITHUB_STEP_SUMMARY")
        if summary:
            with open(summary,"a",encoding="utf-8") as f:
                f.write("## Validation could not complete\n\n"+msg+"\n")
        print("Validation could not complete: "+msg,file=sys.stderr)
        sys.exit(1)
