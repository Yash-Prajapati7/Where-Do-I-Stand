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
  rollNumber: [
    "studentid",
    "studentroll",
    "rollnumber",
    "rollno",
    "registrationnumber",
    "regno",
    "studentnumber",
  ],
  fullName: ["name", "studentname", "fullname", "candidatename"],
  email: ["email", "emailid", "mail"],
  phoneNumber: ["phone", "mobilenumber", "mobile", "contactnumber", "contact"],
  branch: ["branch", "department", "stream", "course"],
};

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toCamelCase(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
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

  const resolvedSapHeader = headerMap.sapId || headerMap.rollNumber;

  if (!resolvedSapHeader || !headerMap.fullName) {
    throw createHttpError(
      "Sheet must include SAP ID (aliases: SAP ID / StudentID / RollNumber) and Name columns.",
      400
    );
  }

  const warnings = [];
  const records = [];
  const seenSapIds = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const sapId = normalizeSapId(row[resolvedSapHeader]);
    const rollNumber = headerMap.rollNumber
      ? normalizeText(row[headerMap.rollNumber])
      : "";
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

    const email = normalizeText(row[headerMap.email] || "").toLowerCase();
    const phoneNumber = normalizeText(row[headerMap.phoneNumber] || "");
    const branch = normalizeText(row[headerMap.branch] || "");

    const metadata = {};

    Object.entries(row).forEach(([columnName, value]) => {
      if (
        columnName === resolvedSapHeader ||
        columnName === headerMap.rollNumber ||
        columnName === headerMap.fullName ||
        columnName === headerMap.email ||
        columnName === headerMap.phoneNumber ||
        columnName === headerMap.branch
      ) {
        return;
      }

      const cleaned = normalizeText(value);
      if (!cleaned) {
        return;
      }

      const key = toCamelCase(columnName);
      if (!key) {
        return;
      }

      metadata[key] = cleaned;
    });

    records.push({
      sapId,
      rollNumber,
      fullName,
      email,
      phoneNumber,
      branch,
      metadata,
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
