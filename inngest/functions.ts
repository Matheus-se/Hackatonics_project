import { NonRetriableError } from "inngest";
import { inngest } from "./client";

export const messageSent = inngest.createFunction(
  { id: "message-sent" },
  { event: "app/message.sent" },

  async ({ event, step, prisma, openAi }) => {
    const message = await prisma.messages.findUnique({
      where: {
        xata_id: event.data.messageId,
      },
    });

    if (!message) return;

    const reply = await step.run("create-reply", async () => {
      if (openAi) {
        const completion = await openAi.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Create a funny reply to my message:",
            },
            { role: "user", content: message?.text },
          ],
          model: "gpt-3.5-turbo",
        });
        return (
          completion.choices[0]?.message.content ?? "Unexpected OpenAI response"
        );
      } else {
        throw new NonRetriableError("Missing environment variable: OPENAI_API_KEY.");
      }
    });

    const newMessage = await step.run("add-reply-to-message", async () => {
      return await prisma.messages.create({
        data: { text: reply, author: "AI" },
      });
    });

    return { event, body: `Here's your last message: ${newMessage?.text}!` };
  }
);

export const imageSent = inngest.createFunction(
  { id: "image-sent" },
  { event: "app/image.sent" },

  async ({ event, step, openAi}) => {
    if (!event.data.imageURL) return;
    if (openAi) {
      const json_response = '{animal: {type: "<inser_the_animal_type_here>", specie: "<insert_the_animal_specie_here>", family: "<insert_the_animal_family_here>", breed: "<insert_the_animal_breed_here>"}, hasAnimalOnTheImage: <true/false>}'
      const identify = await step.run("identify-image", async () => {
        const completion = await openAi.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                'Your job is to simply to return this json object populated pricesily no more details. If there is no animal, simply mark the hasAnimalOnTheImage as false and the animal data as null: ' + json_response,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "which breed is this animal?" },
                {
                  type: "image_url",
                  image_url: { url: event.data.imageURL },
                },
              ],
            },
          ],
          model: "gpt-4o",
        });
        console.log(completion.choices[0]);
        return (
          completion.choices[0].message.content ??
          "Sorry, I couldn't generate a response right know"
        );
      });

      const reply = await step.run("reply-image", async () => {
        const comment = await openAi.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "Ayra is a female, cute, animal lover. Your job is to identify the breed or specie of the animal the user shows you on the prompt with precision and give a warm and engaging response. If there is no animal or the user does not know, return this: 'I coundn't identify any animal in this image please try again.'.",
            },
            {
              role: "user",
              content: identify,
            },
          ],
          model: "ft:gpt-3.5-turbo-0125:personal:ayra-bot:9l4Sf6LP",
        });
        console.log(comment.choices[0].message.content);
        return (
          comment.choices[0].message.content ??
          "Sorry, I couldn't generate a response right know"
        );
      });
    } else {
      throw new NonRetriableError("Missing environment variable: OPENAI_API_KEY.");
    }
  }
);

export const createUser = inngest.createFunction(
  { id: "create-user" },
  { event: "app/create.user" },

  async ({ event, clerkClient }) => {
    const message = await clerkClient.users.createUser({
      firstName: event.data.name,
      emailAddress: [event.data.email],
      password: event.data.password,
      createdAt: new Date(),
    });

    return {
      body: {
        id: message.id,
        username: message.firstName,
        photo: message.imageUrl,
      },
    };
  }
);

export const getUser = inngest.createFunction(
  { id: "get-user" },
  { event: "app/get.user" },

  async ({ event, clerkClient }) => {
    const message = await clerkClient.users.getUser(event.data.userId);

    return {
      body: {
        id: message.id,
        username: message.firstName,
        photo: message.imageUrl,
      },
    };
  }
);

export const login = inngest.createFunction(
  { id: "login-user" },
  { event: "app/login.user" },

  async ({ event, clerkClient }) => {
    const message = await clerkClient.users.verifyPassword({
      userId: event.data.userId,
      password: event.data.password,
    });

    return message.verified;
  }
);
