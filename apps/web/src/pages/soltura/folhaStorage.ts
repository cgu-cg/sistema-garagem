export function normalizeLinhaETabela(str?: string | null): string {
  if (!str) return "";
  return str.replace(/[_-]/g, "/").replace(/\s*\/\s*/g, "/").trim();
}
