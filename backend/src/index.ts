import express from "express";
import logger from "./utils/logger";
import httpLoggers from "./utils/logger/httpLogger";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./configs/db";
import { errorHandler } from "./middlewares/errorHandler";
import "./configs/firebaseAdmin";
import router from "./routes";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://demo.vidyamrit.in"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

httpLoggers.forEach((middleware) => app.use(middleware));

app.use("/api", router);

// Error handler should be AFTER routes
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});

export default app;
