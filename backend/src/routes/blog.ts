import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;

  };
  Variables:{
    userId:string
  }
}>();
blogRouter.get("/bulk", async(c) => {
  const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
   const blogs =  await prisma.blog.findMany()
return c.json({blogs});
});
blogRouter.use("/*", async (c, next) => {
  const token = c.req.header("Authorization") || "";
  try {
    const user = await verify(token,c.env.JWT_SECRET);
    if (user) {
      c.set("userId",user.id)
     await  next();
     c.status(403);
     return c.json({ error: "Unauthorized" });
   }
  } catch (error) {
    console.log(error);
    c.status(403);
    return c.json({ error: "Unauthorized" });
  }

  
   
});
blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const userId = c.get("userId")
  const body = await c.req.json();
  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(userId)
    },
  });
  return c.json({ id: blog.id });
});
blogRouter.get("/:id", async (c) => {
    const id = c.req.param("id")
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const blog = await prisma.blog.findFirst({
    where: {
      id: Number(id),
    },
  });
  return c.json({ blog });
});
blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const blog = await prisma.blog.update({
    where: { id: body.id },
    data: {
      title: body.title,
      content: body.content,
    },
  });
  return c.json({ id: blog.id });
});

//@ts-ignore