export function normalizeRows(rows: any[]) {
  return rows
    .map(r => ({
      ...r,
      date: new Date(r.date),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
