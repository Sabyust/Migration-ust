/** Figma block naming adapter.
 * Import the generated catalog from the Actions artifact after verifying
 * the Figma design and obtaining approval to use its metadata in this repo.
 * No placeholder layouts are represented as pixel-perfect components.
 */
export function normalizeFigmaCode(value = '') {
  const match = String(value).match(/\\b(B_\\d{3})(?:-[DM])?\\b/);
  return match ? match[1] : null;
}

export function implementationKey(value) {
  const code = normalizeFigmaCode(value);
  return code ? 'Block' + code.slice(2) : null;
}

export function resolveTemplateComponents(mapping, templateId, variant = 'desktop') {
  const template = mapping?.families?.find((item) => item.id === templateId);
  if (!template) throw new Error('Unknown Figma template: ' + templateId);
  const frame = template.variants?.[variant];
  if (!frame) throw new Error('Missing ' + variant + ' frame for ' + templateId);
  return frame.components.map((entry, index) => ({
    index,
    figmaNodeId: entry.instanceId,
    code: normalizeFigmaCode(entry.code),
    implementationKey: implementationKey(entry.code),
    geometry: entry.geometry,
    status: entry.implementationStatus,
  }));
}

/** Enforces a deliberate implementation registry; never silently substitutes a block. */
export function assertImplemented(mapping, componentRegistry, templateId, variant = 'desktop') {
  const instances = resolveTemplateComponents(mapping, templateId, variant);
  const missing = [...new Set(instances.filter(({ implementationKey: key }) =>
    typeof componentRegistry[key] !== 'function').map(({ implementationKey: key }) => key))];
  return { ready: missing.length === 0, missing, instances };
}
