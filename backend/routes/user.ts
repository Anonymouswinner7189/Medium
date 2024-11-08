import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { Env } from "../types/Env";
import { signinInput, signupInput } from "@yashwanthmendu/common-app";

const userRouter = new Hono<{ Bindings: Env }>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const validation = signupInput.safeParse(body);
  if (!validation.success) {
    c.status(400);
    return c.text("Invalid Input");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });
  if (existingUser) {
    c.status(409);
    return c.text("Email already in use");
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name ?? "Anonymous",
      password: hashedPassword,
    },
  });

  const jwt = await sign({ id: user.id }, c.env?.JWT_SECRET);
  return c.json({ jwt });
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const validation = signinInput.safeParse(body);
  if (!validation.success) {
    c.status(400);
    return c.text("Invalid Input");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });
  if (!user) {
    c.status(403);
    return c.text("Invalid Email");
  }

  const passwordMatch = await bcrypt.compare(body.password, user.password);
  if (!passwordMatch) {
    c.status(403);
    return c.text("Wrong Password");
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt });
});

export default userRouter;
