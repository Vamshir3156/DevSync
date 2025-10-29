
import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT || 5000);
export const JWT_SECRET = process.env.JWT_SECRET || "supersecret_dev_only_change_me";
export const DATABASE_URL = process.env.DATABASE_URL || "";
