# Five-component design fidelity pipeline — phase 2

## Objective
Implement B_025, B_037, B_053, B_099 and B_075 from the **actual nested Figma specifications**, without replacing them with screenshots or inventing styling.

## Phase 2A: Source contracts
[Run the full nested contract extractor](https://github.com/Sabyust/Migration-ust/actions/workflows/extract-five-figma-contracts.yml). It reads the already-approved instance IDs from `data/figma-components.json`, batches all ten desktop/mobile instances in **one GET /v1/files/:key/nodes** request, and outputs a bounded, sanitized design contract with nested layer geometry, Auto Layout, typography metadata, fills, strokes, effects and image reference IDs.

The workflow runs **manually** so Figma HTTP 429 quota warnings are respected. It uses an Actions secret and repository read-only permissions; the output remains a short-lived artifact, not a public commit. Artifacts may still expose design metadata: follow UST's approval requirements. This does not export original photo assets or licensed fonts.

## Phase 2B: Assets and implementation
Obtain design-approved original image/icon exports and rights-cleared font files through approved UST/Figma channels. Never check fonts or sensitive assets into a public repository. Then implement the nested structure from each extracted contract in its React `Block###` component, mapping child IDs to rendered `data-figma-layer` attributes. All required layers, actual design tokens, responsive variants, and controls must be represented. The existing five prototypes remain **provisional** until this is done.

## Phase 2C: Compliance
Retest component identity, frame size, nested child bounding boxes, CSS layout/padding/gap, typography, text colors/backgrounds, borders, effects, approved asset references, and interactions. Missing data or missing DOM nodes are **failures**, never passes. A claimed 98% should be based on a complete scope of approved required properties, with mandatory gates at 100%.

## Blocker
The last Figma REST image request returned HTTP 429 with a lengthy Retry-After. **This extractor has not been run and the contracts are not yet populated.** Do not hammer or bypass rate limits; use approved offline design exports if the read allowance is still unavailable.
