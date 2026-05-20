import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../libs/jwt";

export const authenticate = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const auth = request.headers.authorization;
    if (!auth) return response.status(401).json({ message: "Unauthorized" });

    // authority input validation token
    if (!auth.startsWith("Bearer "))
      return response.status(401).json({ message: "Invalid token" });

    // get token
    const token = auth.split(" ")[1];
    if (!token) return response.status(401).json({ message: "No token" });

    // verify token
    const payload = verifyAccessToken(token);
    request.user = payload;
    next();
  } catch (error) {
    console.error(error);
    return response
      .status(401)
      .json({ message: error instanceof Error ? error.message : error });
  }
};
