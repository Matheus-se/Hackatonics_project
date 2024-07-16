import { inngest } from "./client";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Functions exported from this file are exposed to Inngest
// See: @/app/api/inngest/route.ts

export const messageSent = inngest.createFunction(
  { id: "message-sent" }, // Each function should have a unique ID
  { event: "app/message.sent" }, // When an event by this name received, this function will run

  async ({ event, step, prisma }) => {
    // Fetch data from the database
    const message = await prisma.messages.findUnique({
      where: {
        xata_id: event.data.messageId,
      },
    });

    if (!message) {
      return;
    }

    // You can execute code that interacts with external services
    // All code is retried automatically on failure
    // Read more about Inngest steps: https://www.inngest.com/docs/learn/inngest-steps
    const reply = await step.run("create-reply", async () => {
      if (OPENAI_API_KEY) {
        const openai = new OpenAI();
        const completion = await openai.chat.completions.create({
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
        return "Add OPENAI_API_KEY environment variable to get AI responses.";
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
  { id: "image-sent" }, // Each function should have a unique ID
  { event: "app/image.sent" }, // When an event by this name received, this function will run

  async ({ event, step }) => {
    // You can execute code that interacts with external services
    // All code is retried automatically on failure
    // Read more about Inngest steps: https://www.inngest.com/docs/learn/inngest-steps
    if (!event.data.imageURL) return
    if (OPENAI_API_KEY) {
      const openai = new OpenAI();
      const identify = await step.run("identify-image", async () => {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Your job is to simply to give information about: name, type, breed, specie and familly of the animal if exists, nothing else, no more details, as concise as possible, just all the names. If there is no animal, simply respond that there is no animal on the image. If you dont know, just say you dont know'
            },
            {
              role: "user",
              content: [
                { type: "text", text: "which breed is this animal?" },
                {
                  type: "image_url",
                  image_url: {url: event.data.imageURL}
                },
              ],
            },
          ],
          model: "gpt-4o",
        });
        console.log(completion.choices[0])
        return completion.choices[0].message.content ?? "Sorry, I couldn't generate a response right know";
      });

      const reply = await step.run("reply-image", async () => {
        const comment = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: "Ayra is a female, cute, animal lover. Your job is to identify the breed or specie of the animal the user shows you on the prompt with precision and give a warm and engaging response with interesting facts. If there is no animal, simply respond that there is no animal on the image."
            },
            {
              role: "user",
              content: identify
            },
          ],
          model: "ft:gpt-3.5-turbo-0125:personal:ayra-bot:9l4Sf6LP",
        });
        console.log(comment.choices[0].message.content)
        return comment.choices[0].message.content ?? "Sorry, I couldn't generate a response right know";
      });
    } else {
      return "Add OPENAI_API_KEY environment variable to get AI responses.";
    }
  }
);
