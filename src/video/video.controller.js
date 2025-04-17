import fs from "fs";
import path from "path";
import { S3_upload } from "./video.service.js";
import { verifyClerkJwt } from "../middleware/auth.js";
import { rm } from "fs/promises";

const __dirname = path.resolve(
  path.dirname(decodeURI(new URL(import.meta.url).pathname).substring(1))
);

const cleanupUploadDir = async (recordingId) => {
  try {
    const uploadDir = path.join(process.cwd(), "uploads", recordingId);
    if (fs.existsSync(uploadDir)) {
      await rm(uploadDir, { recursive: true, force: true });
      console.log(`Cleaned up directory for recording ${recordingId}`);
    }
  } catch (error) {
    console.error(
      `Error cleaning up directory for recording ${recordingId}:`,
      error
    );
  }
};

export const videoChunk = async (req, res) => {
  const recordingId = req.body.recording_id;
  const requestEvent = req.body.event;
  const userId = req.body.userId;

  try {
    if (requestEvent === "end_recording") {
      await S3_upload(recordingId, userId);
    }

    if (requestEvent !== "upload_chunk") {
      return res
        .status(201)
        .json({ message: `Request event ${requestEvent} is recieved.` });
    }

    const uploadDir = path.join(process.cwd(), "uploads", recordingId);

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Define the file path
    const filePath = path.join(uploadDir, req.file.originalname);

    // Append to the file if it exists, otherwise create a new file
    await new Promise((resolve, reject) => {
      fs.appendFile(filePath, req.file.buffer, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("Video chunk saved:", filePath);
        resolve();
      });
    });

    res.json({
      message: "Video chunk received and saved",
      recordingId,
    });
  } catch (error) {
    console.error("Error in video chunk processing:", error);
    // Cleanup on error
    await cleanupUploadDir(recordingId);
    res.status(500).json({
      message: "Error processing video chunk",
      error: error.message,
    });
  }
};
