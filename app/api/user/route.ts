import { inngest } from "@/inngest";
import { createClerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  const request = {
    firstName: name,
    emailAddress: [email],
    password: password,
    createdAt: new Date(),
  };

  const clerkClient = createClerkClient({secretKey: process.env.CLERK_SECRET_KEY});
  const message = await clerkClient.users.createUser(request);
  await inngest.send({
    name: "app/new.user",
    data: {
        id: message.id,
        name: message.firstName
    }
  })

  const response = {
    id: message.id,
    username: message.firstName,
  };

  return Response.json(response);
}
