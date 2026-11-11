export function computePanelShift(panel) {
  if (!panel) return 0;
  const margin = 8;
  const rect = panel.getBoundingClientRect();
  let shift = 0;

  const boundaryEl = panel.closest('[data-popover-boundary]') || panel.closest('.db-content');
  if (boundaryEl) {
    const boundaryRect = boundaryEl.getBoundingClientRect();
    const style = getComputedStyle(boundaryEl);
    const paddingRight = Number.parseFloat(style.paddingRight) || 0;
    const targetRight = boundaryRect.right - paddingRight;
    if (rect.right > targetRight) {
      shift = targetRight - rect.right;
    }
  }

  const shiftedRight = rect.right + shift;
  const shiftedLeft = rect.left + shift;

  if (shiftedRight > window.innerWidth - margin) {
    return shift + window.innerWidth - margin - shiftedRight;
  }
  if (shiftedLeft < margin) {
    return shift + margin - shiftedLeft;
  }
  return shift;
}
