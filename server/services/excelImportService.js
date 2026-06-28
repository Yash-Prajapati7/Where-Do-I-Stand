import xlsx from "xlsx";

import { createHttpError } from "../utils/httpError.js";
import { normalizeSapId, normalizeText } from "../utils/slugify.js";

const HEADER_ALIASES = {
  sapId: [
    "sapid",
    "sap",
    "sapno",
    "sapnumber",
    "sapstudentid",
    "sapstudentnumber",
  ],
  fullName: ["name", "studentname", "fullname", "candidatename"],
  branch: ["branch", "department", "stream", "course", "dept", "branchname"],
};

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function resolveHeaderMap(headers) {
  const available = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  const map = {};

  Object.entries(HEADER_ALIASES).forEach(([targetKey, aliases]) => {
    const match = available.find((header) => aliases.includes(header.normalized));
    if (match) {
      map[targetKey] = match.original;
    }
  });

  return map;
}

export function parseStudentExcel(fileBuffer) {
  if (!fileBuffer || !(fileBuffer instanceof Buffer)) {
    throw createHttpError("A valid Excel file is required.", 400);
  }

  let workbook;

  try {
    workbook = xlsx.read(fileBuffer, { type: "buffer" });
  } catch (error) {
    throw createHttpError("Unable to parse the uploaded Excel file.", 400);
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw createHttpError("The uploaded workbook has no worksheet.", 400);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    throw createHttpError("The uploaded worksheet does not contain student rows.", 400);
  }

  const headers = Object.keys(rows[0] || {});
  const headerMap = resolveHeaderMap(headers);

  const resolvedSapHeader = headerMap.sapId;

  if (!resolvedSapHeader || !headerMap.fullName) {
    throw createHttpError(
      "Sheet must include SAP ID (aliases: SAP ID) and Full Name (aliases: Name / Full Name) columns.",
      400
    );
  }

  const warnings = [];
  const records = [];
  const seenSapIds = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const sapId = normalizeSapId(row[resolvedSapHeader]);
    const fullName = normalizeText(row[headerMap.fullName]);

    if (!sapId || !fullName) {
      warnings.push(`Row ${rowNumber}: skipped due to missing SAP ID or name.`);
      return;
    }

    const dedupeKey = sapId.toLowerCase();

    if (seenSapIds.has(dedupeKey)) {
      warnings.push(`Row ${rowNumber}: duplicate SAP ID ${sapId} ignored.`);
      return;
    }

    seenSapIds.add(dedupeKey);

    const branch = normalizeText(row[headerMap.branch] || "");

    records.push({
      sapId,
      fullName,
      branch,
    });
  });

  if (records.length === 0) {
    throw createHttpError("No valid student records were found in the uploaded file.", 400);
  }

  return {
    records,
    warnings,
    totalRows: rows.length,
    worksheetName: sheetName,
  };
}

