# T1 Origins visual fidelity QA

## Run the new QA workflow

[GitHub Actions → T1 Origins visual QA against Figma](https://github.com/Sabyust/Migration-ust/actions/workflows/visual-qa-t1.yml) → Run workflow → main.

The job uses the already configured `FIGMA_ACCESS_TOKEN` secret and **read-only** Figma REST endpoints to export the T1 Origins **base Desktop and Mobile** frames from the copied Figma file. It builds the existing Our Approach preview locally, takes Playwright screenshots at 1280px and 390px, then creates overlays, highlighted diffs, JSON metrics and a summary.

### Read the report

Download the `t1-origins-visual-qa` workflow artifact from the finished run. It contains:
- `figma-desktop.png`, `figma-mobile.png`
- `browser-desktop.png`, `browser-mobile.png`
- `overlay-desktop.png`, `overlay-mobile.png`
- `diff-desktop.png`, `diff-mobile.png`
- `visual-metrics.json`, `visual-qa-summary.md`
- Section geometry and Figma reference metadata

## What the score means

This baseline is **diagnostic**, not an approval gate. The mapped Our Approach page uses different copy and illustrative imagery from the Figma base template, so the percentage **is not a meaningful 98% certification**. First align fonts, reference images, text, vertical rhythm and responsive sections with a like-for-like target. Then set an agreed threshold and require human sign-off for branding and behavior.

## Security

The workflow does not write to Figma, push commits or deploy a page. Repository permissions are `contents: read`. A token is supplied by GitHub Secrets and never included in the report. Figma export URLs are used transiently and not printed. **The PNGs and overlays may contain proprietary imagery**, so review artifact permissions and UST policy before running in this public GitHub repository. Artifacts expire after three days.
