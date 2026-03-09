import rateLimit from "express-rate-limit";

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const RATE_LIMIT_WINDOW_MS = toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const RATE_LIMIT_MAX = toPositiveInt(process.env.RATE_LIMIT_MAX, 100);
const AUTH_RATE_LIMIT_WINDOW_MS = toPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const AUTH_RATE_LIMIT_MAX = toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 10);

const buildLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(options.message);
    }
  });

export const apiRateLimiter = buildLimiter(
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  "Too many requests, please try again later."
);

export const authRateLimiter = buildLimiter(
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX,
  "Too many auth attempts, please try again later."
);
