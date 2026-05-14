function sanitizeStudent(student = {}) {
  return {
    studentDatabaseId: String(student.studentDatabaseId || ""),
    sapId: String(student.sapId || "").trim(),
    rollNumber: String(student.rollNumber || "").trim(),
    fullName: String(student.fullName || "").trim(),
    email: String(student.email || "").trim(),
    phoneNumber: String(student.phoneNumber || "").trim(),
    branch: String(student.branch || "").trim(),
    status: String(student.status || "notStarted").trim(),
    venue: String(student.venue || "").trim(),
    groupNumber: String(student.groupNumber || "").trim(),
    score: String(student.score || "").trim(),
    remarks: String(student.remarks || "").trim(),
    roundMetadata:
      student.roundMetadata && typeof student.roundMetadata === "object"
        ? student.roundMetadata
        : {},
    metadata: student.metadata && typeof student.metadata === "object" ? student.metadata : {},
    updatedAt: student.updatedAt || null,
  };
}

function sanitizeColumn(column = {}, index = 0) {
  return {
    roundId: String(column.roundId || `round-${index}`),
    roundName: String(column.roundName || "Unnamed Round").trim(),
    roundType: String(column.roundType || "custom").trim(),
    order: Number(column.order || index + 1),
    metadataTemplate:
      column.metadataTemplate && typeof column.metadataTemplate === "object"
        ? column.metadataTemplate
        : {
            allowVenue: false,
            allowGroupNumber: false,
            customFields: [],
          },
    students: Array.isArray(column.students) ? column.students.map(sanitizeStudent) : [],
  };
}

export function ensureBoardShape(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((column, index) => sanitizeColumn(column, index));
}

export function ensureKanbanShape(payload) {
  return ensureBoardShape(payload);
}

export function flattenBoard(board) {
  return ensureBoardShape(board).flatMap((column) =>
    column.students.map((student) => ({
      ...student,
      roundId: column.roundId,
      roundName: column.roundName,
      roundType: column.roundType,
    }))
  );
}

export function getUniqueOptionsFromBoard(board, key) {
  const safeBoard = ensureBoardShape(board);

  if (key === "roundName") {
    return safeBoard
      .filter((column) => column.roundId !== "profile-pool")
      .map((column) => column.roundName)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  const students = flattenBoard(safeBoard);

  return [...new Set(students.map((student) => String(student?.[key] || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}
