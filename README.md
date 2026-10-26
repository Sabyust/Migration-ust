# UST Content Review Studio

A public/synthetic-content pilot for mapping UST.com's **Our Approach** page to the Figma **T1 Origins** template.

- [Content review studio](https://sabyust.github.io/Migration-ust/)
- [Mapped Our Approach preview](https://sabyust.github.io/Migration-ust/our-approach-mapped/)
- [Original Figma template reference](https://sabyust.github.io/Migration-ust/origins-template/)
- [Figma T1 Origins design](https://www.figma.com/design/H2iWuvkVo8uPmO2sk1lDG9/Template-Delivery--8th-Oct-2026-?node-id=6603-60752)
- [Pixel-fidelity QA checklist](https://github.com/Sabyust/Migration-ust/issues/1)

## Local development

```sh
npm install
npm run dev
```

The GitHub Pages deployment workflow is at `.github/workflows/deploy.yml`. The deployment base path is `/Migration-ust/`.

## Secure Figma REST API configuration

**Never put a Figma personal access token in this README, frontend source, commits, Issues, or GitHub Pages files.** This repository is public, and publishing the token would expose the account credential.

1. **Revoke any token shared in a chat or other insecure location** in [Figma Settings](https://www.figma.com/settings) and generate a replacement with the minimum read-only scopes needed.
2. Open the repository's **Settings → Secrets and variables → Actions → New repository secret**.
3. Create a secret named `FIGMA_ACCESS_TOKEN` and paste the **new** token as its value. Do not put the token in a GitHub variable, or in a Vite environment variable with the `VITE_` prefix; those values can appear in public browser bundles.
4. Use this secret **only in a server-side or GitHub Actions step** that requests Figma data. Never expose it to JavaScript delivered to browser visitors.
5. Figma API access can still be subject to account/seat-based rate limits; a token is not a way to bypass those restrictions.

Reference Figma file key: `H2iWuvkVo8uPmO2sk1lDG9`

Desktop template node: `6603:60753`  
Mobile template node: `6603:60775`

Example endpoint (requires authorization; don't open the URL expecting public access):

```text
GET https://api.figma.com/v1/files/H2iWuvkVo8uPmO2sk1lDG9/nodes?ids=6603:60753
```

### Status

The current application is a **prototype, not a pixel-perfect implementation**. Original design assets, typography, desktop/mobile screenshot differences, and source copy remain under review. Browser-local edits and comments do not sync between reviewers.

> The secret name is documented here; **the secret value is intentionally not included**.
