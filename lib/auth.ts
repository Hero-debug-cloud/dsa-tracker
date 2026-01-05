import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set in environment variables");
  process.exit(1);
}

// Generate JWT token
export const generateToken = (user: { id: number; name: string }) => {
  return jwt.sign(
    { id: user.id, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};