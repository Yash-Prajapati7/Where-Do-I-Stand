import { normalizeKey, normalizeSapId } from "../utils/slugify.js";

function compareByRecentUpdate(a, b) {
  const aTime = Date.parse(a.updatedAt || "") || 0;
  const bTime = Date.parse(b.updatedAt || "") || 0;

  if (aTime !== bTime) {
    return bTime - aTime;
  }

  return String(a.fullName || "").localeCompare(String(b.fullName || ""));
}

function sortRounds(rounds = []) {
  return [...rounds].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.name.localeCompare(b.name);
  });
}

function matchesSearch(student, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    student.fullName,
    student.sapId || student.metadata?.sapId,
    student.rollNumber,
    student.email,
    student.phoneNumber,
  ]
    .map((value) => normalizeKey(value))
    .join(" ");

  return haystack.includes(searchTerm);
}

function matchesStatus(status, statusFilter) {
  if (!statusFilter || statusFilter === "all") {
    return true;
  }

  return normalizeKey(status) === statusFilter;
}

function matchesRound(round, roundFilter) {
  if (!roundFilter || roundFilter === "all") {
    return true;
  }

  return normalizeKey(round._id) === roundFilter || normalizeKey(round.name) === roundFilter;
}

function formatStudentProgress(student, result = null) {
  const sapId = normalizeSapId(student.sapId || student.metadata?.sapId || "");

  return {
    studentDatabaseId: String(student._id),
    sapId,
    rollNumber: student.rollNumber,
    fullName: student.fullName,
    email: student.email,
    phoneNumber: student.phoneNumber,
    branch: student.branch,
    metadata: student.metadata || {},
    roundResultId: result ? String(result._id) : null,
    status: result?.status || "notStarted",
    venue: result?.venue || "",
    groupNumber: result?.groupNumber || "",
    score: result?.score || "",
    remarks: result?.remarks || "",
    roundMetadata: result?.metadata || {},
    updatedAt: result?.updatedAt || student.updatedAt,
  };
}

function normalizeRound(round) {
  return {
    roundId: String(round._id),
    roundName: round.name,
    roundType: round.type,
    order: round.order,
    metadataTemplate: round.metadataTemplate || {
      allowVenue: false,
      allowGroupNumber: false,
      customFields: [],
    },
    isActive: round.isActive,
  };
}

export function buildProcessBoard({ processDoc, students, roundResults, filters }) {
  const searchTerm = normalizeKey(filters?.search || "");
  const statusFilter = normalizeKey(filters?.status || "all");
  const roundFilter = normalizeKey(filters?.round || "all");

  const sortedRounds = sortRounds(processDoc.rounds || []).filter((round) => round.isActive !== false);

  const columns = [
    {
      roundId: "profile-pool",
      roundName: "Profile Pool",
      roundType: "pool",
      order: 0,
      metadataTemplate: {
        allowVenue: false,
        allowGroupNumber: false,
        customFields: [],
      },
      students: [],
    },
    ...sortedRounds.map((round) => ({
      ...normalizeRound(round),
      students: [],
    })),
  ];

  const columnByRoundId = new Map(columns.map((column) => [column.roundId, column]));
  const studentsById = new Map(students.map((student) => [String(student._id), student]));
  const studentsWithAnyResult = new Set(roundResults.map((result) => String(result.studentId)));
  const visibleStudentIds = new Set();
  const waiting = [];

  roundResults.forEach((result) => {
    const studentId = String(result.studentId);
    const roundId = String(result.roundId);

    const student = studentsById.get(studentId);
    const round = sortedRounds.find((item) => String(item._id) === roundId);
    const column = columnByRoundId.get(roundId);

    if (!student || !round || !column) {
      return;
    }

    if (!matchesSearch(student, searchTerm)) {
      return;
    }

    if (!matchesRound(round, roundFilter)) {
      return;
    }

    if (!matchesStatus(result.status, statusFilter)) {
      return;
    }

    const card = formatStudentProgress(student, result);
    column.students.push(card);
    visibleStudentIds.add(studentId);

    if (card.status === "onHold") {
      waiting.push(card);
    }
  });

  students.forEach((student) => {
    const studentId = String(student._id);

    if (studentsWithAnyResult.has(studentId)) {
      return;
    }

    if (!matchesSearch(student, searchTerm)) {
      return;
    }

    if (roundFilter !== "all" && roundFilter !== "profile-pool") {
      return;
    }

    if (statusFilter !== "all" && statusFilter !== "notstarted") {
      return;
    }

    const pool = columnByRoundId.get("profile-pool");
    pool.students.push(formatStudentProgress(student));
    visibleStudentIds.add(studentId);
  });

  columns.forEach((column) => {
    column.students.sort(compareByRecentUpdate);
  });

  const filteredColumns =
    roundFilter === "all"
      ? columns
      : columns.filter(
          (column) =>
            normalizeKey(column.roundId) === roundFilter ||
            normalizeKey(column.roundName) === roundFilter
        );

  const lastRoundResultUpdate = roundResults
    .map((result) => Date.parse(result.updatedAt || "") || 0)
    .reduce((max, timestamp) => Math.max(max, timestamp), 0);

  const processUpdatedAt = Date.parse(processDoc.updatedAt || "") || 0;

  return {
    process: {
      id: String(processDoc._id),
      processName: processDoc.processName,
      processIdentifier: processDoc.processIdentifier,
      companyName: processDoc.companyName,
      description: processDoc.description,
      rounds: sortedRounds.map(normalizeRound),
    },
    board: filteredColumns,
    waiting,
    meta: {
      totalStudents: students.length,
      visibleStudents: visibleStudentIds.size,
      totalRoundResults: roundResults.length,
      lastUpdated: new Date(Math.max(processUpdatedAt, lastRoundResultUpdate) || Date.now()).toISOString(),
    },
  };
}
