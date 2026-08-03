import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

/**
 * Must run after requireAuth (relies on req.userId). Looks the role up
 * fresh from the database rather than trusting the JWT, so a role
 * change takes effect immediately instead of waiting for token expiry.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const userId = req.userId as string;

  prisma.user
    .findUnique({ where: { id: userId }, select: { role: true } })
    .then((user) => {
      if (!user) {
        throw new AppError("User not found.", 404);
      }
      if (user.role !== "ADMIN") {
        throw new AppError("Admin access required.", 403);
      }
      next();
    })
    .catch(next);
}
