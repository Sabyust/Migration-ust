# Full Figma component-to-code mapping

The existing `validate-figma.yml` validated the 14 families and 28 desktop/mobile template frames.
Use **[Map all Figma template components](https://github.com/Sabyust/Migration-ust/actions/workflows/map-figma-components.yml)** to extract the actual instance-to-code mapping, without MCP.

## Run
1. In GitHub Actions, select **Map all Figma template components**.
2. Press **Run workflow** on `main`. It uses the existing `FIGMA_ACCESS_TOKEN` Actions secret.
3. Download the **figma-t1-t14-component-map** artifact from the completed run. It contains:
   - `figma-component-map.json` — for T1–T14 desktop/mobile frame IDs, dimensions, ordered component instance IDs, normalized B_### codes and code keys.
   - `figma-component-catalog.js` — deduplicated code identifiers for frontend use.
   - `figma-component-map.md` — coverage and missing-known-code comparison.
4. Inspect the mapping for accuracy before putting any metadata into the public repository.

## Code usage

`src/figma/componentResolver.js` provides:
- `normalizeFigmaCode('B_209-D') // 'B_209'`
- `implementationKey('B_209') // 'Block209'`
- `resolveTemplateComponents(mapping, 'T1', 'desktop')`
- `assertImplemented(mapping, componentRegistry, 'T1', 'mobile')`

**Important:** These utilities **do not create pixel-perfect React code**. They deterministically match each Figma instance to the implementation key that developers must supply. Unknown implementations are reported, never silently replaced.

## Validation limitations

- The REST API extracts nested frame metadata to a bounded depth. Some instances may require deeper targeted inspection.
- Figma's component IDs do not themselves contain HTML/CSS, component state behavior, content mappings or design asset files.
- Pixel perfection requires independent visual QA with original assets, exact fonts, and desktop/mobile screenshot comparison.
- The generated mapping is a 7-day GitHub artifact rather than an automatic public commit, preventing accidental publication of design metadata.
- Only read-only API access and `contents: read` are used. No secrets or raw layer text are written to the artifact.
