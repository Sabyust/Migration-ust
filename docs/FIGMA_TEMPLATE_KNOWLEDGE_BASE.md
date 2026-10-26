# UST Migration — Figma Template Knowledge Base

> **Status:** Partial, evidence-labeled reference. This is a durable project knowledge base, **not** a complete read of the copied Figma file, and **not** a pixel-perfect design specification.

## Canonical references

- **Current Figma copy (target):** https://www.figma.com/design/Xl6Rsi8blrdansOtHc07vU/Template-Delivery--8th-Oct-2026---Copy-?node-id=6603-58363
- **Figma copy file key:** `Xl6Rsi8blrdansOtHc07vU`
- **Figma copy canvas node:** `6603:58363`, named `templates` in the earlier source file. **The copy's contents have not been independently read.**
- **Previously inspected source file:** https://www.figma.com/design/H2iWuvkVo8uPmO2sk1lDG9/Template-Delivery--8th-Oct-2026-?node-id=6603-58363
- **Classification workbook:** `ust-com-template-classification.xlsx` (provided separately in chat; not stored here).
- **GitHub implementation:** https://github.com/Sabyust/Migration-ust
- **Pilot review page:** https://sabyust.github.io/Migration-ust/our-approach-mapped/
- **Pixel-fidelity quality gate:** https://github.com/Sabyust/Migration-ust/issues/1

## Purpose and boundaries

This knowledge base powers the **UST.com → Figma template → content remapping → visual review → eventual Sanity handoff** workflow.

- The classification workbook supplies **current URL → T1–T14 template**.
- A design registry supplies **template → components in order → content slots**.
- Current source content must be extracted and fact-checked **before** rewriting for a component.
- Rewriting must preserve meaning, facts, claims, links, accessibility, and SEO intent. Never invent customer outcomes or metrics.
- Reviewers approve the mapped copy and fidelity separately.
- No automatic website/Figma publishing and no Figma write actions during the read-only pilot.
- Personal GitHub Pages demo is public. Do not publish unpublished UST content or secrets.
- This file contains **no Figma tokens**. Use approved secrets and read-only access.

## Template registry

Derived from the previously inspected classification workbook containing **2,424 URLs, 14 templates, 17 page categories**. Counts are URL classification counts, **not** Figma instance counts.

| ID | Family | Classified URLs | Current Figma copy verification |
|---|---|---:|---|
| T1 | Origins | 6 | Pending |
| T2 | Spotlight | 118 | Pending |
| T3 | Lens | 50 | Pending |
| T4 | Gateway | 1 | Pending |
| T5 | Arcane (Editorial) | 544 | Pending |
| T6 | Arcane (Case Study) | 466 | Pending |
| T7 | Anatomy | 12 | Pending |
| T8 | Manifesto | 118 | Pending |
| T9 | Voice | 125 | Pending |
| T10 | Blueprint | 18 | Pending |
| T11 | Moments | 57 | Pending |
| T12 | Signals | 758 | Pending |
| T13 | Anthology | 53 | Pending |
| T14 | Forms | 98 | Pending |
| **TOTAL** | | **2,424** | |

**Prior observation:** The earlier Figma **Templates & Pages** canvas contained Template/Desktop, Page/Desktop, Template/Mobile, and Page/Mobile variants for each family. The earlier **templates** canvas contained base template structures. Do not assume this copied Figma file has identical variants until inspected.

### Known components from previously inspected Figma source

The component codes below come from metadata previously obtained from the original file. Component codes and order are **not yet verified against the copied file**.

**T1 Origins — base Desktop sequence:**
`Main/Header` → `B_209-D` Secondary Banner → `B_025-D` Card Collection → `B_122-D` Timeline → `B_013-D` Card Collection → `B_037-D` Text + Media → `B_149-D` Card Collection → `B_151-D` Card Collection → `UST_Footer-D`.

**T1 Origins — Mobile sequence:**
`B_209-M` → `B_025-M` → `B_122-M` → `B_013-M` → `B_037-M` → `B_149-M` → `B_151-M` → `UST_Footer-M`. Mobile header separately present.

- Earlier source base Desktop frame: `6603:60753`, mobile frame `6603:60775` within the original file (node IDs must be revalidated in new copy).
- At source-frame level, Desktop hero height was specified as 820 px and the subsequent sections approximately 740 px each; Mobile was 390 px wide.
- The earlier **page-specific** T1 composition on the other canvas contained additional `B_200` and `B_124` blocks. Do **not** add these to the base template without an explicit page-variant requirement.

**T2 Spotlight — known component codes:** `B_209`, `B_112` editorial, `B_058` media, `B_147`, `B_148`, `B_003` cards, `B_118` portfolio, `B_019` cards, `B_138` gateway. Specific composition must be rechecked.

**T10 Blueprint — known codes:** `B_209`, `B_152` text+media, `B_153`, `B_154`, `B_197` cards, `B_099` statistics.

**T11 Moments — known codes:** `B_209`, `B_053` media, `B_195` testimonial.

**T12 Signals — previously observed template composition:** `B_209`, `B_203`, `B_204`, `B_205`, `B_206` editorial and `B_136` gateway. The earlier page composition omitted one editorial block; template/page parity is not guaranteed.

**T13 Anthology — known codes:** `B_209`, `B_199` gateway, `B_075` filter/table.

**T14 Forms — known code:** `B_059` (previously labeled “In Progress”). The earlier source had this on desktop and mobile and may not represent a complete approved form.

**T3–T9:** Family labels and URL counts are verified from classification, but **full component inventories are unverified** in this knowledge base.

## Per-template specification to complete after Figma access is restored

For **each of T1–T14**, record all of the following:
1. Template and page variant frame IDs in the **new copied file**, Desktop and Mobile.
2. Exact component order and per-instance IDs, including required/optional blocks.
3. Text slots: eyebrow, heading, body, card title, card body, CTA labels, SEO metadata; actual length constraints after measuring.
4. Figma images/icons (approved export files), fonts/weights, spacing, dimensions, colors, radii, hover states.
5. Responsive behavior: column stacking, visibility, reorder rules, cropping and interactive states.
6. Mapping rules: which source content fits each slot, whether the original content can be reused or rewritten, unsupported content and gaps.
7. Screenshot baselines and visual diffs for 1280 px Desktop and 390 px Mobile.
8. Sign-off state for **content accuracy** and **visual accuracy** independently.

## Review and acceptance rules

**Structural fidelity:** Components present in correct order, no extras, required variants intact.

**Visual fidelity:** Use original Figma assets and fonts with exact crops, geometry, type properties, styles, breakpoint behavior and component states. Compare screenshots at target viewport sizes and investigate all differences. Do not claim “pixel perfect” without evidence.

**Content fidelity:** Original source URL and content captured; traceable field-level mapping; no fabricated claims; brand/SEO approval before CMS handoff.

**Review studio:** The current GitHub Pages prototype saves edits and comments in browser local storage. It is not a multi-user shared review backend.

## Known access limitation

Figma MCP currently returns an Enterprise **View seat rate-limit** error for the **copied Figma file**. Adding a token name to the repository README does not make ChatGPT's Figma connector use the REST API. A Figma REST API workflow must be separately configured, executed server-side, and verified; a token does not bypass seat limits. Never commit a PAT to this public repository.

**Next refresh:** Once approved Figma read access or exported design/source assets are available, fill the registry, link assets, and update each template's verification state. Until then this file is a **seed knowledge base**, not a complete design memory.
