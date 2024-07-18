import { inngest } from "./client";

export const imageSent = inngest.createFunction(
  { id: "image-sent" },
  { event: "app/image.sent" },

  async ({ event, prisma}) => {
    return await prisma.scan.create({
      data: {
        image: event.data.imageUrl,
        name: event.data.name,
        text: event.data.text,
        position_x: event.data.position_x,
        position_y: event.data.position_y,
        is_pet: event.data.pet,
        author: {
          connect: {id: event.data.userId}
        }
      }
    })
  }
);

export const newUser = inngest.createFunction(
  { id: "new-user" },
  { event: "app/new.user" },

  async ({ event, prisma}) => {
    return await prisma.user.create({
      data: {
        id: event.data.userId,
        name: event.data.name
      }
    })
  }
);