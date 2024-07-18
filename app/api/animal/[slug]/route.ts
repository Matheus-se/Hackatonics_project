import { prisma } from "@/prisma/client";

export async function GET( req: Request, { params }: { params: { slug: string } }) {
  const userId = params.slug;

  let response = [];
  try {
    response = await prisma.scan.findMany({
      where: {
        authorId: userId,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
  return Response.json(response);
}
