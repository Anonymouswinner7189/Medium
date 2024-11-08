import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware";
import { Env } from "../types/Env";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createPostInput, updatePostInput } from "@yashwanthmendu/common-app";

const blogRouter = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

blogRouter.use("*", authMiddleware);

blogRouter.post("/", async (c) => {
  const userId = c.get("userId");

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const validation = createPostInput.safeParse(body);
  if (!validation.success) {
    c.status(400);
    return c.text("Invalid Input");
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: userId,
    },
  });

  if (!post) {
    c.status(500);
    return c.text("Error Creating the Post");
  }

  return c.json({
    id: post.id,
  });
});

blogRouter.put("/", async (c) => {
  const userId = c.get("userId");

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const validation = updatePostInput.safeParse(body);
  if (!validation.success) {
    c.status(400);
    return c.text("Invalid Input");
  }

  const updated = await prisma.post.update({
    where: {
      id: body.id,
      authorId: userId,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  if (!updated) {
    c.status(500);
    return c.text("Error Updating the Post");
  }

  return c.text("Post Updated Successfully.");
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany({});

  return c.json(posts);
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const postId = c.req.param("id");

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  return c.json(post);
});

export default blogRouter;
