import mongoose from "mongoose";

import Process from "../models/Process.js";
import RoundResult, { roundResultStatuses } from "../models/RoundResult.js";
import { parseStudentExcel } from "../services/excelImportService.js";
import { publishProcessUpdate } from "../services/processEventService.js";
import { assert, createHttpError } from "../utils/httpError.js";
import { normalizeKey, normalizeSapId, normalizeText, slugify } from "../utils/slugify.js";

const allowedRoundTypes = new Set([
  "groupDiscussion",
  "technicalInterview",
  "hrInterview",
  "aptitude",
  "codingTest",
  "custom",
]);

function serializeRound(round) {
  return {
    id: String(round._id),
    name: round.name,
    type: round.type,
    order: round.order,
    isActive: round.isActive,
    predefinedVenues: Array.isArray(round.predefinedVenues) ? round.predefinedVenues : [],
    metadataTemplate: {
      allowVenue: Boolean(round.metadataTemplate?.allowVenue),
      allowGroupNumber: Boolean(round.metadataTemplate?.allowGroupNumber),
      customFields: Array.isArray(round.metadataTemplate?.customFields)
        ? round.metadataTemplate.customFields
        : [],
    },
    createdAt: round.createdAt,
    updatedAt: round.updatedAt,
  };
}

function serializeProcess(processDoc) {
  const sortedRounds = [...(processDoc.rounds || [])].sort((a, b) => a.order - b.order);

  return {
    id: String(processDoc._id),
    processName: processDoc.processName,
    processIdentifier: processDoc.processIdentifier,
    companyName: processDoc.companyName,
    description: processDoc.description,
    rounds: sortedRounds.map(serializeRound),
    statusColors: processDoc.statusColors instanceof Map
      ? Object.fromEntries(processDoc.statusColors)
      : processDoc.statusColors || {
          notStarted: "#f3f4f6",
          scheduled: "#dbeafe",
          inProgress: "#fef3c7",
          qualified: "#d1fae5",
          rejected: "#fee2e2",
          onHold: "#f3e8ff",
        },
    isArchived: processDoc.isArchived,
    createdAt: processDoc.createdAt,
    updatedAt: processDoc.updatedAt,
  };
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function normalizeCustomFields(customFields) {
  if (!Array.isArray(customFields)) {
    return [];
  }

  return customFields
    .map((field) => ({
      key: normalizeText(field?.key),
      label: normalizeText(field?.label),
      valueType: normalizeKey(field?.valueType) === "number" ? "number" : "text",
      required: Boolean(field?.required),
    }))
    .filter((field) => field.key && field.label);
}

function normalizeRoundMetadataTemplate(roundType, metadataTemplate = {}) {
  const isInterviewType =
    roundType === "technicalInterview" || roundType === "hrInterview";

  const defaultAllowGroupNumber = roundType === "groupDiscussion";
  const defaultAllowVenue = isInterviewType;

  return {
    allowGroupNumber: toBoolean(
      metadataTemplate.allowGroupNumber,
      defaultAllowGroupNumber
    ),
    allowVenue: toBoolean(metadataTemplate.allowVenue, defaultAllowVenue),
    customFields: normalizeCustomFields(metadataTemplate.customFields),
  };
}

function resolveRoundType(rawType) {
  const normalized = normalizeKey(rawType).replace(/[^a-z]/g, "");

  if (!normalized) {
    return "custom";
  }

  const aliasMap = {
    groupdiscussion: "groupDiscussion",
    technicalinterview: "technicalInterview",
    hrinterview: "hrInterview",
    aptitude: "aptitude",
    codingtest: "codingTest",
    custom: "custom",
  };

  const resolved = aliasMap[normalized] || "custom";

  return allowedRoundTypes.has(resolved) ? resolved : "custom";
}

async function findProcessById(processId) {
  if (!mongoose.isValidObjectId(processId)) {
    throw createHttpError("Invalid process ID.", 400);
  }

  const processDoc = await Process.findById(processId);

  if (!processDoc || processDoc.isArchived) {
    throw createHttpError("Process not found.", 404);
  }

  return processDoc;
}

function notifyProcessUpdate(processDoc, reason) {
  publishProcessUpdate(processDoc?.processIdentifier, {
    reason,
  });
}

export async function listAdminProcesses(req, res, next) {
  try {
    const processDocs = await Process.find({ isArchived: false })
      .sort({ updatedAt: -1 })
      .lean();

    const processes = processDocs.map((processDoc) => {
      const roundCount = (processDoc.rounds || []).filter((round) => round.isActive !== false).length;

      return {
        id: String(processDoc._id),
        processName: processDoc.processName,
        processIdentifier: processDoc.processIdentifier,
        companyName: processDoc.companyName,
        description: processDoc.description,
        roundCount,
        studentCount: (processDoc.students || []).length,
        updatedAt: processDoc.updatedAt,
      };
    });

    res.status(200).json({
      processes,
      meta: {
        total: processes.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProcess(req, res, next) {
  try {
    const processName = normalizeText(req.body.processName);
    const companyName = normalizeText(req.body.companyName || processName);
    const description = normalizeText(req.body.description);

    assert(processName, "Process name is required.", 400);

    const processIdentifier =
      slugify(req.body.processIdentifier) || slugify(processName);

    assert(processIdentifier, "Unable to derive a valid process identifier.", 400);

    const existing = await Process.findOne({ processIdentifier });

    assert(!existing, "A process with this identifier already exists.", 409);

    const processDoc = await Process.create({
      processName,
      processIdentifier,
      companyName,
      description,
      rounds: [],
      students: [],
      isArchived: false,
    });

    notifyProcessUpdate(processDoc, "processCreated");

    res.status(201).json({
      process: serializeProcess(processDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProcess(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);
    const studentCount = (processDoc.students || []).length;

    res.status(200).json({
      process: {
        ...serializeProcess(processDoc),
        studentCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addRoundToProcess(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);

    const name = normalizeText(req.body.name);
    assert(name, "Round name is required.", 400);

    const type = resolveRoundType(req.body.type);
    const metadataTemplate = normalizeRoundMetadataTemplate(
      type,
      req.body.metadataTemplate || {}
    );

    const currentMaxOrder = (processDoc.rounds || []).reduce(
      (maxOrder, round) => Math.max(maxOrder, Number(round.order || 0)),
      0
    );

    const requestedOrder = Number(req.body.order);
    const order = Number.isFinite(requestedOrder) && requestedOrder > 0
      ? requestedOrder
      : currentMaxOrder + 1;

    processDoc.rounds.push({
      name,
      type,
      order,
      metadataTemplate,
      predefinedVenues: Array.isArray(req.body.predefinedVenues)
        ? req.body.predefinedVenues.map(v => normalizeText(v)).filter(Boolean)
        : [],
      isActive: true,
    });

    processDoc.rounds.sort((a, b) => a.order - b.order);

    await processDoc.save();
    notifyProcessUpdate(processDoc, "roundAdded");

    res.status(201).json({
      process: serializeProcess(processDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProcessRound(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);
    const round = processDoc.rounds.id(req.params.roundId);

    if (!round) {
      throw createHttpError("Round not found.", 404);
    }

    if (typeof req.body.name !== "undefined") {
      const name = normalizeText(req.body.name);
      assert(name, "Round name cannot be empty.", 400);
      round.name = name;
    }

    if (typeof req.body.type !== "undefined") {
      round.type = resolveRoundType(req.body.type);
    }

    if (typeof req.body.order !== "undefined") {
      const order = Number(req.body.order);
      assert(Number.isFinite(order) && order > 0, "Round order must be a positive number.", 400);
      round.order = order;
    }

    if (typeof req.body.isActive !== "undefined") {
      round.isActive = Boolean(req.body.isActive);
    }

    if (typeof req.body.metadataTemplate !== "undefined") {
      round.metadataTemplate = normalizeRoundMetadataTemplate(
        round.type,
        req.body.metadataTemplate
      );
    }

    if (typeof req.body.predefinedVenues !== "undefined") {
      assert(Array.isArray(req.body.predefinedVenues), "Predefined venues must be an array.", 400);
      round.predefinedVenues = req.body.predefinedVenues.map(v => normalizeText(v)).filter(Boolean);
    }

    processDoc.rounds.sort((a, b) => a.order - b.order);
    await processDoc.save();
    notifyProcessUpdate(processDoc, "roundUpdated");

    res.status(200).json({
      process: serializeProcess(processDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProcessRound(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);
    const round = processDoc.rounds.id(req.params.roundId);

    if (!round) {
      throw createHttpError("Round not found.", 404);
    }

    const roundObjectId = round._id;
    round.deleteOne();

    await processDoc.save();

    await RoundResult.deleteMany({
      processId: processDoc._id,
      roundId: roundObjectId,
    });

    notifyProcessUpdate(processDoc, "roundDeleted");

    res.status(200).json({
      process: serializeProcess(processDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadStudentsFromExcel(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);

    if (!req.file?.buffer) {
      throw createHttpError("Excel file is required.", 400);
    }

    const parsed = parseStudentExcel(req.file.buffer);

    const records = parsed.records.map((record) => ({
      ...record,
      sapId: normalizeSapId(record.sapId),
    }));

    let insertedCount = 0;
    let modifiedCount = 0;
    let matchedCount = 0;

    if (!processDoc.students) {
      processDoc.students = [];
    }

    for (const record of records) {
      const existingStudent = processDoc.students.find(
        (s) => s.sapId === record.sapId
      );

      if (existingStudent) {
        if (existingStudent.fullName !== record.fullName || existingStudent.branch !== record.branch) {
          existingStudent.fullName = record.fullName;
          existingStudent.branch = record.branch;
          modifiedCount++;
        } else {
          matchedCount++;
        }
      } else {
        processDoc.students.push(record);
        insertedCount++;
      }
    }

    await processDoc.save();

    notifyProcessUpdate(processDoc, "studentsUploaded");

    res.status(201).json({
      processId: String(processDoc._id),
      processIdentifier: processDoc.processIdentifier,
      worksheetName: parsed.worksheetName,
      stats: {
        totalRows: parsed.totalRows,
        validRows: parsed.records.length,
        inserted: insertedCount,
        updated: modifiedCount,
        matched: matchedCount,
      },
      warnings: parsed.warnings,
    });
  } catch (error) {
    next(error);
  }
}

export async function listProcessStudents(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);
    const search = normalizeKey(req.query.search || "");

    const students = [...(processDoc.students || [])].sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );

    const roundResults = await RoundResult.find({ processId: processDoc._id }).lean();

    const progressByKey = new Map(
      roundResults.map((result) => [
        `${String(result.studentId)}:${String(result.roundId)}`,
        {
          roundResultId: String(result._id),
          status: result.status,
          venue: result.venue || "",
          groupNumber: result.groupNumber || "",
          score: result.score || "",
          remarks: result.remarks || "",
          metadata: result.metadata || {},
          updatedAt: result.updatedAt,
        },
      ])
    );

    const rounds = [...(processDoc.rounds || [])].sort((a, b) => a.order - b.order);

    const payload = students
      .filter((student) => {
        if (!search) {
          return true;
        }

        const derivedSapId = normalizeSapId(student.sapId);

        const searchable = [student.fullName, derivedSapId]
          .map((value) => normalizeKey(value))
          .join(" ");

        return searchable.includes(search);
      })
      .map((student) => {
        const derivedSapId = normalizeSapId(student.sapId);

        const progress = rounds.map((round) => {
          const progressKey = `${String(student._id)}:${String(round._id)}`;
          const progressEntry = progressByKey.get(progressKey);

          return {
            roundId: String(round._id),
            roundName: round.name,
            roundType: round.type,
            ...(progressEntry || {
              roundResultId: null,
              status: "notStarted",
              venue: "",
              groupNumber: "",
              score: "",
              remarks: "",
              metadata: {},
              updatedAt: null,
            }),
          };
        });

        return {
          id: derivedSapId || String(student._id),
          studentDatabaseId: String(student._id),
          sapId: derivedSapId,
          rollNumber: "",
          fullName: student.fullName,
          email: "",
          phoneNumber: "",
          branch: student.branch,
          metadata: {},
          roundProgress: progress,
          updatedAt: student.updatedAt,
        };
      });

    res.status(200).json({
      process: serializeProcess(processDoc),
      students: payload,
      meta: {
        total: payload.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function upsertStudentRoundResult(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);

    const studentKey = normalizeText(req.params.studentId);
    assert(studentKey, "Student identifier is required.", 400);

    let studentObj = null;

    if (mongoose.isValidObjectId(studentKey)) {
      studentObj = processDoc.students.find((s) => String(s._id) === studentKey);
    }

    if (!studentObj) {
      const sapId = normalizeSapId(studentKey);
      studentObj = processDoc.students.find((s) => s.sapId === sapId);
    }

    if (!studentObj) {
      throw createHttpError("Student not found for this process.", 404);
    }

    const round = processDoc.rounds.id(req.params.roundId);

    if (!round) {
      throw createHttpError("Round not found for this process.", 404);
    }

    const requestedStatus = normalizeText(req.body.status || "scheduled");
    assert(
      roundResultStatuses.includes(requestedStatus),
      `Invalid status. Allowed values: ${roundResultStatuses.join(", ")}`,
      400
    );

    const allowVenue =
      round.metadataTemplate?.allowVenue ||
      round.type === "technicalInterview" ||
      round.type === "hrInterview";

    const allowGroupNumber =
      round.metadataTemplate?.allowGroupNumber ||
      round.type === "groupDiscussion";

    const payload = {
      status: requestedStatus,
      remarks: normalizeText(req.body.remarks || ""),
      score: normalizeText(req.body.score || ""),
      metadata: req.body.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {},
    };

    if (allowVenue) {
      payload.venue = normalizeText(req.body.venue || "");
    }

    if (allowGroupNumber) {
      payload.groupNumber = normalizeText(req.body.groupNumber || "");
    }

    const roundResult = await RoundResult.findOneAndUpdate(
      {
        processId: processDoc._id,
        studentId: studentObj._id,
        roundId: round._id,
      },
      {
        $set: payload,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    notifyProcessUpdate(processDoc, "roundResultUpdated");

    res.status(200).json({
      processId: String(processDoc._id),
      studentId: normalizeSapId(studentObj.sapId),
      studentDatabaseId: String(studentObj._id),
      roundId: String(round._id),
      roundResult: {
        id: String(roundResult._id),
        status: roundResult.status,
        venue: roundResult.venue || "",
        groupNumber: roundResult.groupNumber || "",
        score: roundResult.score || "",
        remarks: roundResult.remarks || "",
        metadata: roundResult.metadata || {},
        updatedAt: roundResult.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProcessMetadata(req, res, next) {
  try {
    const processDoc = await findProcessById(req.params.processId);

    if (typeof req.body.processName !== "undefined") {
      const processName = normalizeText(req.body.processName);
      assert(processName, "Process name cannot be empty.", 400);
      processDoc.processName = processName;
    }

    if (typeof req.body.companyName !== "undefined") {
      processDoc.companyName = normalizeText(req.body.companyName);
    }

    if (typeof req.body.description !== "undefined") {
      processDoc.description = normalizeText(req.body.description);
    }

    if (typeof req.body.statusColors !== "undefined") {
      processDoc.statusColors = req.body.statusColors;
    }

    await processDoc.save();
    notifyProcessUpdate(processDoc, "processUpdated");

    res.status(200).json({
      process: serializeProcess(processDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProcess(req, res, next) {
  try {
    const processId = req.params.processId;
    if (!mongoose.isValidObjectId(processId)) {
      throw createHttpError("Invalid process ID.", 400);
    }

    const processDoc = await Process.findById(processId);
    if (!processDoc) {
      throw createHttpError("Process not found.", 404);
    }

    await Process.deleteOne({ _id: processId });
    await RoundResult.deleteMany({ processId });

    notifyProcessUpdate(processDoc, "processDeleted");

    res.status(200).json({
      message: "Process and all associated records deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteStudentFromProcess(req, res, next) {
  try {
    const { processId, sapId } = req.params;
    const processDoc = await findProcessById(processId);

    const studentIndex = processDoc.students.findIndex(
      (s) => s.sapId === sapId || String(s._id) === sapId
    );

    if (studentIndex === -1) {
      throw createHttpError("Student not found.", 404);
    }

    const studentId = processDoc.students[studentIndex]._id;

    processDoc.students.splice(studentIndex, 1);
    await processDoc.save();

    await RoundResult.deleteMany({
      processId: processDoc._id,
      studentId: studentId,
    });

    notifyProcessUpdate(processDoc, "studentDeleted");

    res.status(200).json({
      message: "Student and their progress records deleted successfully.",
      process: serializeProcess(processDoc),
    });
  } catch (error) {
    next(error);
  }
}
