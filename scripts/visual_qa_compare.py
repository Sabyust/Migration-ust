#!/usr/bin/env python3
"""Diagnostic visual similarity only: no false pixel-perfect certification."""
import json
import math
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageStat, ImageDraw

OUT=Path("visual-qa-output")
metrics={}
for variant in ("desktop","mobile"):
    reference=Image.open(OUT/f"figma-{variant}.png").convert("RGB")
    actual=Image.open(OUT/f"browser-{variant}.png").convert("RGB")
    rw,rh=reference.size
    aw,ah=actual.size
    width=max(rw,aw)
    height=max(rh,ah)
    a=Image.new("RGB",(width,height),(255,255,255))
    b=Image.new("RGB",(width,height),(255,255,255))
    a.paste(reference,(0,0))
    b.paste(actual,(0,0))
    diff=ImageChops.difference(a,b)
    stats=ImageStat.Stat(diff)
    mae=sum(stats.mean)/3
    threshold=25
    # Strict channel tolerance, including mismatched heights/widths.
    mismatch=diff.convert("L").point(lambda p: 255 if p>threshold else 0)
    # Histogram count avoids large expanded pixel arrays.
    histogram=mismatch.histogram()
    mismatched=histogram[255]
    count=width*height
    similarity=round(100*(1-mae/255),2)
    pixels_within=round(100*(1-mismatched/count),2)
    overlay=Image.blend(a,b,0.5)
    overlay.save(OUT/f"overlay-{variant}.png")
    ImageEnhance.Contrast(diff).enhance(3).save(OUT/f"diff-{variant}.png")
    metrics[variant]={
      "referencePixels":[rw,rh],"implementationPixels":[aw,ah],
      "sizeMatches":rw==aw and rh==ah,
      "meanAbsoluteRgbDifference":round(mae,2),
      "meanRgbSimilarityPct":similarity,
      "grayscalePixelsWithin25Pct":pixels_within,
      "acceptableForPixelPerfectSignoff":False
    }
(OUT/"visual-metrics.json").write_text(json.dumps(metrics,indent=2)+"\n")
lines=["# T1 Origins — Figma vs browser visual QA","","**Diagnostic only. This workflow never certifies pixel perfection automatically.**","",
       "| Viewport | Figma size | Browser size | Mean RGB similarity | Pixels within tolerance |",
       "|---|---|---|---:|---:|"]
for variant,item in metrics.items():
    lines.append(f"| {variant} | {'×'.join(map(str,item['referencePixels']))} | {'×'.join(map(str,item['implementationPixels']))} | {item['meanRgbSimilarityPct']}% | {item['grayscalePixelsWithin25Pct']}% |")
lines+=["","## Important interpretation","- The score compares the unchanged Figma **base template** with the **Our Approach mapped-content page**. Different text, imagery and heights will lower this score even if a component is correctly built.",
       "- Browser-only editing controls are hidden during capture to reduce preview-tool noise.",
       "- The score is NOT the 98% acceptance metric until reference and implementation use identical approved copy and assets.",
       "- Review `overlay-*.png` and `diff-*.png` to locate geometry, font and image mismatches.",
       "- The exact same visual reference, viewport, fonts, images and text are required for meaningful pixel-level sign-off."]
summary="\n".join(lines)+"\n"
(OUT/"visual-qa-summary.md").write_text(summary)
print(summary)
