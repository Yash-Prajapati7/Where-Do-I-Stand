import { Router } from "express";

import {
	getProcessData,
	getProcesses,
	streamProcessUpdates,
} from "../controllers/processController.js";

const router = Router();

router.get("/processes", getProcesses);
router.get("/process/:processName/events", streamProcessUpdates);
router.get("/process/:processName", getProcessData);

export default router;
