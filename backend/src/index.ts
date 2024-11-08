import { Hono } from "hono";
import rootRouter from "../routes";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

app.route("/api/v1", rootRouter);

export default app;
