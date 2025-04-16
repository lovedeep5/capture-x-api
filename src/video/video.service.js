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

  try {
    const S3_fileName = `${userId}/${fileName}/video.webm`;
    const videoPath = path.join(
      process.cwd(),
      "uploads",
      fileName,
      "video.webm"
    );
    const fileStream = fs.createReadStream(videoPath);

    fileStream.on("error", (err) => {
      console.error("File Error", err);
    });
    // Check if the file exists before uploading

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
    insertOne({
      userId,
      s3_key: S3_fileName,
      uuid: fileName,
      title: "Your Recoording!!",
      createdAt: date,
      updatedAt: date,
    });

    const directoryPath = path.join(process.cwd(), "uploads", fileName);
    await rm(directoryPath, { recursive: true, force: true });

    return result;
  } catch (error) {
    console.log("Error uploading to S3:", error);
    throw new Error("Error uploading to S3");
  }
};
