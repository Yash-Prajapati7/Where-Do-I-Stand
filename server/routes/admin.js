import { Router } from "express";
import multer from "multer";

import {
  addRoundToProcess,
  createProcess,
  deleteProcessRound,
  getAdminProcess,
  listAdminProcesses,
  listProcessStudents,
  updateProcessRound,
  uploadStudentsFromExcel,
  upsertStudentRoundResult,
  updateProcessMetadata,
  deleteProcess,
  deleteStudentFromProcess,
} from "../controllers/adminController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

router.get("/admin/processes", listAdminProcesses);
router.post("/admin/processes", createProcess);
router.get("/admin/processes/:processId", getAdminProcess);
router.patch("/admin/processes/:processId", updateProcessMetadata);
router.delete("/admin/processes/:processId", deleteProcess);
router.get("/admin/processes/:processId/students", listProcessStudents);
router.delete("/admin/processes/:processId/students/:sapId", deleteStudentFromProcess);
router.post("/admin/processes/:processId/rounds", addRoundToProcess);
router.patch("/admin/processes/:processId/rounds/:roundId", updateProcessRound);
router.delete("/admin/processes/:processId/rounds/:roundId", deleteProcessRound);
router.post(
  "/admin/processes/:processId/students/upload",
  upload.single("file"),
  uploadStudentsFromExcel
);
router.patch(
  "/admin/processes/:processId/students/:studentId/rounds/:roundId",
  upsertStudentRoundResult
);

export default router;
