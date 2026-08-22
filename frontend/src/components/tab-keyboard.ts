export const moveTab = (event: KeyboardEvent, index: number) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const tab = event.currentTarget as HTMLButtonElement;
  const tabs = [...(tab.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])];
  const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
    : (index + (forward ? 1 : tabs.length - 1)) % tabs.length;
  tabs[next]?.click();
  tabs[next]?.focus();
};
