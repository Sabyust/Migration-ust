# Validate T1–T14 using the Figma REST API (no MCP)

This workflow **reads** the copied Figma file and compares its base template sections/components with the seed registry. It uses **no write permission** for Figma. It does not update the Figma file or publish extracted designs.

## Set up the GitHub Actions secret

1. **Revoke any personal token pasted in a chat or otherwise exposed**, and create a fresh read-only token at [Figma Settings](https://www.figma.com/settings).
2. Give it the smallest read-only scope needed to read design nodes (typically `file_content:read`). Your Figma user must have permission to view the copied file. Token creation and availability may be restricted by the enterprise administrator.
3. Open [repository Actions secrets](https://github.com/Sabyust/Migration-ust/settings/secrets/actions), select **New repository secret**.
4. Set **Name** to `FIGMA_ACCESS_TOKEN`; paste the replacement token into **Secret**; save.
5. **Never paste tokens into the repository, README, issue, chat, code, or a `VITE_` environment variable.**

GitHub encrypts repository secrets. The secret's value cannot be read back from GitHub after saving. This workflow passes it only to a short-running read-only Python process. It never prints the value.

## Run validation

Open [Actions](https://github.com/Sabyust/Migration-ust/actions) → **Validate Figma T1-T14 (read-only REST API)** → **Run workflow** → select `main` → **Run workflow**.

Once complete, open the workflow run:
- **Summary**: match/mismatch table by template.
- **Artifacts** → `figma-template-validation`: download the JSON and Markdown report. Retention: seven days.

If it fails:
- Missing secret: add it under the repository's Actions secrets and run again.
- HTTP 401/403: token scope, account authorization, or Figma file permissions.
- HTTP 404: copied Figma file or canvas node ID not available for the token.
- HTTP 429: seat/API rate limit. A REST token does **not** bypass those limits.
- Component mismatch: compare original reference registry against the copied template. The existing reference inventories are partial for several families.

## Security / limitations

- Workflow is **manual only** (`workflow_dispatch`), without scheduling.
- Figma request uses the `GET /v1/files/:file_key/nodes` endpoint with the copied file and canvas node.
- The script downloads in-memory design structure, but writes **only component IDs, frame dimensions and validation statuses** to the job artifact, not raw Figma JSON, customer copy or images.
- Repository has `contents: read` permission for this workflow; it **cannot push changes**.
- Artifacts are **not a secure location for confidential design details** in a public repository. Use only approved nonconfidential template metadata in the current pilot.
- The validator checks *structural consistency*, **not pixel-perfection**. Achieving exact layout requires authorized original images/fonts and browser-vs-Figma screenshots.
