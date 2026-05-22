import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/authRoute.js";
import attendanceRouter from "./routes/attendanceRoute.js";
import adminRouter from "./routes/adminRoute.js";

dotenv.config();
const app = express();
const port = Number(process.env.PORT?.trim()) || 8888;
const clientOrigin = process.env.CLIENT_ORIGIN?.trim() || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  return res.status(200).json({
    message: "Mini HCM API is running",
  });
});

app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
  });
});

app.use("/api/admin/employees", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/attendance", attendanceRouter);

function startServer() {
  try {
    app.listen(port, () => console.log(`Server running... ${port}`));
  } catch (error) {
    console.error(`Start server failed ${error}`);
  }
}

startServer();
