import { createClerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const request = params.slug

  const clerkClient = createClerkClient({secretKey: process.env.CLERK_SECRET_KEY})
  const message = await clerkClient.users.getUser(request)

  const response = {
    id: message.id,
    username: message.firstName,
  };

  return Response.json(response)
}