export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

export function normalizeSapId(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}
