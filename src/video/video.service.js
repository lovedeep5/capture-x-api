import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { rm } from "fs/promises";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { insertOne } from "../lib/monogo.js";
dotenv.config();

const Bucket = process.env.AMPLIFY_BUCKET;
const S3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_upload = async (fileName, userId) => {
  if (!fileName) {
    throw new Error("Invalid video path or file name");
  }

  if (!userId) {
    throw new Error("Invalid user id");
  }

  const directoryPath = path.join(process.cwd(), "uploads", fileName);

  try {
    const S3_fileName = `${userId}/${fileName}/video.webm`;
    const videoPath = path.join(
      process.cwd(),
      "uploads",
      fileName,
      "video.webm"
    );

    // Check if file exists before proceeding
    if (!fs.existsSync(videoPath)) {
      throw new Error("Video file not found");
    }

    const fileStream = fs.createReadStream(videoPath);

    fileStream.on("error", (err) => {
      console.error("File Error", err);
      throw err;
    });

    // Get file stats for Content-Length
    const stats = fs.statSync(videoPath);

    const upload = new Upload({
      client: S3,
      params: {
        Bucket,
        Key: S3_fileName,
        Body: fileStream,
        ContentType: "video/webm",
      },
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
    });

    const result = await upload.done();
    console.log("Upload complete:", result);

    const date = new Date();
    await insertOne({
      userId,
      s3_key: S3_fileName,
      uuid: fileName,
      title: "Your Recording!!",
      createdAt: date,
      updatedAt: date,
    });

    // Only delete after successful upload and database insertion
    await rm(directoryPath, { recursive: true, force: true });
    console.log("Local files cleaned up successfully");

    return result;
  } catch (error) {
    console.error("Error in S3 upload process:", error);
    // Attempt cleanup on error
    try {
      await rm(directoryPath, { recursive: true, force: true });
      console.log("Cleaned up local files after error");
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    throw error;
  }
};
