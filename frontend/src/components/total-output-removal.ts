export function confirmTotalOutputRemoval(label: string, published: boolean | undefined, enabled: boolean): boolean {
  return enabled || !published || window.confirm(
    `${label} is enabled in the saved meter configuration. Turning it off removes it after installation and may affect Home Assistant dashboards, automations, or Energy settings. Continue?`,
  );
}
