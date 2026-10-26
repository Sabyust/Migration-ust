# Figma-driven build and component validation — primary architecture

## What we're building

This is **not** screenshot-based replication. The primary source of truth is the copied Figma file, its T1–T14 template structure, `B_###` component instances and inspectable design properties.

1. **Extract** component trees and validated styling data through approved Figma REST access.
2. **Normalize** each instance to a typed design contract: template, variant, Figma node, component ID, geometry, text slots, spacing, typography, colors, assets and states.
3. **Implement** each block with a reusable React component (`Block209`, `Block025`, etc.) consuming approved content, images and design tokens.
4. **Compose** pages from the component manifest and publish them through GitHub Pages.
5. **Validate** live rendered DOM components against Figma contracts. Screenshots are supporting diagnostic evidence only, not the acceptance definition.

## What is implemented today

- `src/figma/componentResolver.js`: Maps Figma B-series codes to React implementation keys.
- `scripts/export_figma_component_map.py`: Exports frame/component metadata when rate limits allow. Generated mapping stays in a GitHub Actions artifact; it is not yet committed as a design specification.
- `scripts/validate_component_contract.mjs`: Compares the actual GitHub page's `data-component` blocks with the current T1 registry and captures DOM computed styles at desktop and mobile widths. Optionally accepts a fuller mapping via `FIGMA_COMPONENT_SPEC` environment variable.
- `.github/workflows/component-contract.yml`: Independent manual QA workflow; requires no Figma API calls or screenshot exports.
- `visual-qa-t1.yml`: Optional screenshot diagnostic; no longer the primary acceptance workflow.

## Current implementation gap

Our Approach is still a hand-written HTML prototype, not a page composed from the actual React `Block###` library. No such library has been built yet. The first contract validator **cannot certify pixel perfection**, because it has only partial metadata. It reports checks it genuinely performs; absence of full design properties is not counted as a pass.

## Definition of 98% fidelity

Agree and enforce requirements at two levels:

**Mandatory gates (100%):** Correct template, all required components in correct order, approved actual design assets/fonts, accurate content claims, responsiveness, and functioning controls.

**Measured properties (target ≥98%):** For applicable components, compare dimensions, X/Y offsets relative to their parent, flex/grid layout, spacing/padding, font family/weight/size/line height, colors, borders and image box geometry with explicit tolerances. Weighted percentage must count all required properties and must not silently exclude unavailable specifications.

This percentage is a *component-property compliance measure*, not an image similarity score. Report desktop and mobile independently. Do not claim 98% until the Figma contract extraction and React implementations are complete.

## Next engineering work

- Extend REST extraction to yield **complete typed component contracts**, including nested layers and all required style tokens; respect API limits and approval to store this metadata.
- Implement a reusable `src/components/figma/Block###` collection with proper desktop/mobile variants and approved assets.
- Replace the T1 static preview with a manifest-composed React page, preserving content review/edit functionality.
- Add DOM contract verification at both base-template and mapped-page levels. Make missing data or components block design sign-off.
- Repeat for all 14 template families and automate the mapping from approved URL classifications.

### Run current validation
[GitHub Actions: Validate Figma components against GitHub page](https://github.com/Sabyust/Migration-ust/actions/workflows/component-contract.yml).
