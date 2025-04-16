import { Router } from "express";
import multer from "multer";

import { videoChunk } from "./video.controller.js";
import { verifyClerkJwt } from "../middleware/auth.js";
const router = Router();
const upload = multer(); // memory storage by default

router.post("/video-chunk", upload.single("video"), verifyClerkJwt, videoChunk);

export default router;
