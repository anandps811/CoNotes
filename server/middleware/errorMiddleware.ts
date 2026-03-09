import { NextFunction, Request, Response } from "express";

type ErrorWithStatus = Error & { statusCode?: number };

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new Error(`Route not found: ${req.originalUrl}`) as ErrorWithStatus;
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error"
  });
};
