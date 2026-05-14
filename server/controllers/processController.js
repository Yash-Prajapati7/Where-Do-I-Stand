import Process from "../models/Process.js";
import RoundResult from "../models/RoundResult.js";
import Student from "../models/Student.js";
import { subscribeToProcessUpdates } from "../services/processEventService.js";
import { buildProcessBoard } from "../services/processBoardService.js";
import { createHttpError } from "../utils/httpError.js";
import { normalizeKey, normalizeText, slugify } from "../utils/slugify.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findProcessOrThrow(rawIdentifier) {
  const decodedIdentifier = decodeURIComponent(rawIdentifier || "");
  const normalizedIdentifier = slugify(decodedIdentifier);

  if (!normalizedIdentifier) {
    throw createHttpError("Process identifier is required.", 400);
  }

  const requestedName = normalizeText(decodedIdentifier);

  const processDoc = await Process.findOne({
    isArchived: false,
    $or: [
      { processIdentifier: normalizedIdentifier },
      { processName: new RegExp(`^${escapeRegExp(requestedName)}$`, "i") },
    ],
  }).lean();

  if (!processDoc) {
    throw createHttpError("Process not found.", 404);
  }

  return processDoc;
}

export async function getProcessData(req, res, next) {
  try {
    const processDoc = await findProcessOrThrow(req.params.processName);

    const [students, roundResults] = await Promise.all([
      Student.find({ processId: processDoc._id }).sort({ fullName: 1 }).lean(),
      RoundResult.find({ processId: processDoc._id }).lean(),
    ]);

    const responsePayload = buildProcessBoard({
      processDoc,
      students,
      roundResults,
      filters: {
        search: req.query.search,
        status: req.query.status,
        round: req.query.round,
      },
    });

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
}

export async function streamProcessUpdates(req, res, next) {
  try {
    const processDoc = await findProcessOrThrow(req.params.processName);
    const subscriptionKey = subscribeToProcessUpdates(
      processDoc.processIdentifier,
      res
    );

    if (!subscriptionKey) {
      throw createHttpError("Process identifier is required.", 400);
    }
  } catch (error) {
    next(error);
  }
}

export async function getProcesses(req, res, next) {
  try {
    const searchTerm = normalizeKey(req.query.search || "");

    const processDocs = await Process.find({ isArchived: false })
      .sort({ updatedAt: -1 })
      .lean();

    const filteredProcesses = processDocs.filter((processDoc) => {
      if (!searchTerm) {
        return true;
      }

      const searchable = [
        processDoc.processName,
        processDoc.processIdentifier,
        processDoc.companyName,
      ]
        .map((value) => normalizeKey(value))
        .join(" ");

      return searchable.includes(searchTerm);
    });

    const processIds = filteredProcesses.map((processDoc) => processDoc._id);

    const studentCounts = await Student.aggregate([
      {
        $match: {
          processId: { $in: processIds },
        },
      },
      {
        $group: {
          _id: "$processId",
          count: { $sum: 1 },
        },
      },
    ]);

    const studentCountByProcessId = new Map(
      studentCounts.map((item) => [String(item._id), item.count])
    );

    const processes = filteredProcesses.map((processDoc) => ({
      id: String(processDoc._id),
      processName: processDoc.processName,
      processIdentifier: processDoc.processIdentifier,
      companyName: processDoc.companyName,
      roundCount: (processDoc.rounds || []).filter((round) => round.isActive !== false).length,
      studentCount: studentCountByProcessId.get(String(processDoc._id)) || 0,
      updatedAt: processDoc.updatedAt,
    }));

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
