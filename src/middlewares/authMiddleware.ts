import { type Request, type Response, type NextFunction } from "express";
import { type AccessPayload, verifyAccessToken } from "../libs/jwt.js";

export const authenticate = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader)
      return response.status(401).json({ message: "Unauthorized" });

    // authority input validation token
    if (!authHeader.startsWith("Bearer "))
      return response.status(401).json({ message: "Invalid token format" });

    // get token
    const token = authHeader.split(" ")[1];
    if (!token) return response.status(401).json({ message: "No token" });

    // verify token
    const payload: AccessPayload = verifyAccessToken(token);
    if (!payload)
      return response.status(401).json({ message: "Invalid token" });

    request.user = payload;

    next();
  } catch (error) {
    console.error(error);
    return response
      .status(401)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }

    next();
  };
};
