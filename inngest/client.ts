import { Inngest, InngestMiddleware } from "inngest";
import { PrismaClient } from "@prisma/client";
import { createClerkClient } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openAiMiddleware = new InngestMiddleware({
  name: "OpenAi Middleware",
  init() {
    let openAi = null;
    if (process.env.OPENAI_API_KEY) {
      openAi = new OpenAI();
    }
    return {
      onFunctionRun(ctx) {
        return {
          transformInput(ctx) {
            return {
              ctx: {
                openAi,
              },
            };
          },
        };
      },
    };
  },
});

const clerkMiddleware = new InngestMiddleware({
  name: "Clerk Middleware",
  init() {
    const clerkClient = createClerkClient({secretKey: process.env.CLERK_SECRET_KEY});

    return {
      onFunctionRun(ctx) {
        return {
          transformInput(ctx) {
            return {
              ctx: {
                clerkClient,
              },
            };
          },
        };
      },
    };
  },
});

const prismaMiddleware = new InngestMiddleware({
  name: "Prisma Middleware",
  init() {
    const prisma = new PrismaClient();

    return {
      onFunctionRun(ctx) {
        return {
          transformInput(ctx) {
            return {
              ctx: {
                prisma,
              },
            };
          },
        };
      },
    };
  },
});

export const inngest = new Inngest({
  id: "next-pxci-starter",
  middleware: [prismaMiddleware, clerkMiddleware, openAiMiddleware],
});