import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export const authMiddleware = async (c: Context, next: Next) => {
  const jwt = c.req.header("Authorization");
  if (!jwt) {
    c.status(401);
    return c.text("UnAuthorized");
  }

  const token = jwt.split(" ")[1];
  if (!token) {
    c.status(401);
    return c.text("Invalid or Expired Token");
  }

  const payload = await verify(token, c.env?.JWT_SECRET);
  if (!payload) {
    c.status(403);
    return c.text("Forbidden");
  }

  c.set("userId", payload.id);

  await next();
};
