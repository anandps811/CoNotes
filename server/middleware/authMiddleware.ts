import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

type JwtPayload = { id: string };

const authMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Not authorized, token missing") as Error & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const error = new Error("Not authorized, user not found") as Error & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (err) {
    const typedErr = err as Error & { statusCode?: number };
    if (!typedErr.statusCode) {
      typedErr.statusCode = 401;
      typedErr.message = "Not authorized";
    }
    next(typedErr);
  }
};

export default authMiddleware;
