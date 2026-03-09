import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { comparePassword, hashPassword } from "../utils/hashPassword.js";

type ErrorWithStatus = Error & { statusCode?: number };

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      const error = new Error("Name, email and password are required") as ErrorWithStatus;
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      const error = new Error("Email already registered") as ErrorWithStatus;
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await hashPassword(password)
    });

    res.status(201).json({
      token: generateToken(user._id.toString()),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      const error = new Error("Email and password are required") as ErrorWithStatus;
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const error = new Error("Invalid credentials") as ErrorWithStatus;
      error.statusCode = 401;
      throw error;
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      const error = new Error("Invalid credentials") as ErrorWithStatus;
      error.statusCode = 401;
      throw error;
    }

    res.json({
      token: generateToken(user._id.toString()),
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.json({ user: req.user });
};
