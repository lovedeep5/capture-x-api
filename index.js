import express from "express";
import cors from "cors";
import videoRouter from "./src/video/video.router.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", videoRouter);

app.listen(process.env.PORT || 3002, () => {
  console.log("Server is running on port 3002");
});
