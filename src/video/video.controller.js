import fs from "fs";
import path from "path";
import { S3_upload } from "./video.service.js";
import { verifyClerkJwt } from "../middleware/auth.js";

const __dirname = path.resolve(
  path.dirname(decodeURI(new URL(import.meta.url).pathname).substring(1))
);

export const videoChunk = async (req, res) => {
  const recordingId = req.body.recording_id;
  const requestEvent = req.body.event;
  const userId = req.body.userId;

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
  fs.appendFile(filePath, req.file.buffer, (err) => {
    if (err) {
      console.error("Error saving video chunk:", err);
      return res.status(500).json({ message: "Error saving video chunk" });
    }

    console.log("Video chunk saved:", filePath);
    res.json({
      message: "Video chunk received and saved",
      recordingId,
    });
  });
};
