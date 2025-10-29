
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { JwtUser } from "../types.js";

export function signJwt(payload: JwtUser) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
}

export function verifyJwt<T>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}
