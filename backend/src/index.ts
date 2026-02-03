import express from "express";
import logger from "./utils/logger";
import httpLoggers from "./utils/logger/httpLogger";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
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
      "https://vidyamrit.in",
      "https://vidyamrit.synquic.in",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

httpLoggers.forEach((middleware) => app.use(middleware));

app.use("/api", router);

// Serve static files from the frontend build (in production)
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "..", "public");
  logger.info(`Serving frontend from: ${publicPath}`);
  app.use(express.static(publicPath));

  // Serve index.html for all non-API routes (for client-side routing)
  // Using regex to match all routes except /api/*
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
} else {
  logger.warn(`NODE_ENV is '${process.env.NODE_ENV}' - not serving frontend static files`);
}

// Error handler should be AFTER routes
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});

export default app;
