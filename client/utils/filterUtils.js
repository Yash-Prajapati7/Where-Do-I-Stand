import {
  ensureBoardShape,
  flattenBoard,
  getUniqueOptionsFromBoard,
} from "@/utils/sheetDataTransformer";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function extractSapId(student) {
  if (!student || typeof student !== "object") {
    return "";
  }

  if (student.sapId || student.sapID || student.sapid) {
    return String(student.sapId || student.sapID || student.sapid || "").trim();
  }

  const metadata = student.metadata;
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const match = Object.entries(metadata).find(
    ([key]) => normalizeKey(key) === "sapid"
  );

  return match ? String(match[1] || "").trim() : "";
}

function filterStudents(students, criteria) {
  const searchTerm = normalizeKey(criteria.searchTerm);
  const statusFilter = normalize(criteria.statusFilter || "all");
  const roundFilter = normalize(criteria.roundFilter || "all");
  const sapId = normalizeKey(criteria.sapId);
  const sapFilterEnabled = Boolean(criteria.sapFilterEnabled);

  return students.filter((student) => {
    const status = normalize(student.status);
    const round = normalize(student.roundName);
    const roundId = normalize(student.roundId);
    const studentSapId = normalizeKey(extractSapId(student));

    const matchesSearch = !searchTerm || studentSapId.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || statusFilter === status;

    const matchesRound =
      roundFilter === "all" || roundFilter === round || roundFilter === roundId;

    const matchesSap = !sapFilterEnabled || !sapId || studentSapId === sapId;

    return matchesSearch && matchesStatus && matchesRound && matchesSap;
  });
}

export function applySearchAndFilters(boardInput, criteria) {
  const board = ensureBoardShape(boardInput);
  const roundFilter = normalize(criteria.roundFilter || "all");

  return board
    .filter((column) => {
      if (roundFilter === "all") {
        return true;
      }

      return (
        normalize(column.roundName) === roundFilter ||
        normalize(column.roundId) === roundFilter
      );
    })
    .map((column) => ({
      ...column,
      students: filterStudents(
        column.students.map((student) => ({
          ...student,
          roundName: column.roundName,
          roundId: column.roundId,
        })),
        criteria
      ),
    }));
}

export function extractFilterOptions(board) {
  return {
    rounds: getUniqueOptionsFromBoard(board, "roundName"),
    statuses: getUniqueOptionsFromBoard(board, "status"),
  };
}

export function extractWaitingStudents(board) {
  return flattenBoard(board).filter((student) => normalize(student.status) === "onhold");
}
