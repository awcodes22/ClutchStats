// season usually tips off around Oct 19-24, request NBA stats for the new year on Oct 22nd
export function getCurrentSeason() {
  const now = new Date();
  const cutover = new Date(now.getFullYear(), 9, 22);
  const year = now >= cutover ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}
