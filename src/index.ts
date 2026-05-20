import dotenv from "dotenv";
import express from "express";
import authRouter from "./routes/authRoute.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

function startServer() {
  try {
    app.listen(port, () => console.log(`Server running... ${port}`));
  } catch (error) {
    console.error(`Start server failed ${error}`);
  }
}

startServer();
