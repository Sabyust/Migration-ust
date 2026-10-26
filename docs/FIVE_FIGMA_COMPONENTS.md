# Five Figma React component engineering prototypes

Live route after deployment: https://sabyust.github.io/Migration-ust/component-lab.html

Selected from five different design/component types:
- `B_025` – card collection (T1 Origins)
- `B_037` – text + media (T1 Origins)
- `B_053` – media (T11 Moments)
- `B_099` – statistics (T10 Blueprint)
- `B_075` – filter/table (T13 Anthology)

Source: `data/figma-components.json` derived from the Figma REST structural artifact. The engineering prototypes are stored in `src/figma/fiveComponents.jsx`, with layout CSS in `fiveComponents.css`. The page selector renders **actual React components** for desktop and mobile, and the filter prototype is interactive.

## Design accuracy

The workflow `.github/workflows/qa-five-figma-components.yml` uses Playwright to compare rendered DOM component identity, Figma node, width, height, frame padding, direction and spacing to the current approved component-map metadata. It tests desktop (1280px) and mobile (390px) and B_075 filter interaction.

**These are outer-frame geometry checks only, NOT full visual-fidelity certification.** Original nested Figma layers, exact fonts, colors, source images, icons, content and interactions still require approved high-fidelity design data. The reference artifact contained only the outer layout metadata. No placeholder image is a replacement for a Figma asset. Do not describe the components as 98% identical to Figma.

The workflow publishes a JSON property-by-property audit and Markdown summary. It has **no Figma API calls**, thus runs even when Figma quota is exhausted. Full validation awaits extraction of inner design layers.
