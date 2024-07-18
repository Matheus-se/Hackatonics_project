import { Inngest, InngestMiddleware } from "inngest";
import { PrismaClient } from "@prisma/client";

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
  middleware: [prismaMiddleware],
});