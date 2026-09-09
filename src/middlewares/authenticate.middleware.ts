import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ENV } from "../config/env.js";

// ─── Augment Express Request ───────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract token from signed cookie or Authorization header
    let token: string | undefined =
      req.signedCookies && req.signedCookies["auth_token"];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    }

    // 2. Verify JWT
    let payload: any;
    try {
      payload = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      throw new ApiError(401, "Invalid or expired token", "TOKEN_INVALID");
    }

    // 3. Load user
    const userId = payload.sub || payload.userId;
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, "User not found", "USER_NOT_FOUND");
    }

    // 4. Attach to request
    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/** Middleware that tries to authenticate but does not fail if no token */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authenticate(req, res, () => {});
  } catch {
    // Not authenticated — continue anyway
  }
  next();
}
