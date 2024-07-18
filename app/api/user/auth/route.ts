import { createClerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    const { userId, password } = await req.json()
    const request = {
        userId: userId,
        password: password,
    }

    const clerkClient = createClerkClient({secretKey: process.env.CLERK_SECRET_KEY})
    const message = await clerkClient.users.verifyPassword(request);

    return Response.json(message.verified);
}