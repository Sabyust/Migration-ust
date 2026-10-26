# T1-T14 Figma component map — committed source registry

The [component mapping workflow](https://github.com/Sabyust/Migration-ust/actions/runs/40326521489) completed successfully and produced a structurally scoped Figma REST artifact. The [import workflow](https://github.com/Sabyust/Migration-ust/actions/workflows/import-figma-component-map.yml) takes that exact approved artifact without making additional Figma REST calls.

Files populated by the import:
- `data/figma-components.json`: all 14 families, both desktop and mobile frame IDs, ordered B-series component instances, component source IDs, geometry, Auto Layout metadata and corresponding React component keys
- `src/figma/componentCatalog.js`: unique B-series code identifiers for use in React

The importer validates that every one of the 14 expected families has desktop and mobile frames, and rejects unexpected block identifiers and missing geometry. It explicitly does **not** import source text, Figma API tokens, asset URLs, raw Figma exports or private page contents.

**Important:** This is a structural source-of-truth mapping, not a working set of matching HTML/CSS components. `Block###` keys are implementation identifiers only. React implementations, complete nested styles, imagery/fonts and component contract verification are separate deliverables. Do not claim 98% fidelity merely because these IDs map.

## Next step

Build and register actual React `Block###` components, starting with T1 Origins. Use the registry to compose desktop/mobile page variants and test geometry/layout/style against the Figma specification. The copied file may diverge from a later Figma revision; update the registry only after an authorized change audit.

The import workflow has repository write permission **only** to commit its two generated structural files. It does not write to Figma. This repository is public, so the imported identifiers and structural metadata should be considered public once committed.
