import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const openAi = new OpenAI();
    const { imageUrl } = await req.json();

    const json_response =
      '{animal: {type: "<inser_the_animal_type_here>", specie: "<insert_the_animal_specie_here>", family: "<insert_the_animal_family_here>", breed: "<insert_the_animal_breed_here>"}, hasAnimalOnTheImage: <true/false>}';
    const completion = await openAi.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Your job is to simply to return this json object populated pricesily no more details. If there is no animal, simply mark the hasAnimalOnTheImage as false and the animal data as null: " +
            json_response,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "which breed is this animal?" },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      model: "gpt-4o",
    });
    const result = completion.choices[0].message.content;
    console.log(result);
    const { hasAnimalOnTheImage, animal } = JSON.parse(
      completion.choices[0].message.content?.replace("```json", "").replace("```", "") ??
        JSON.stringify({ hasAnimalOnTheImage: false, animal: null })
    );

    if (!hasAnimalOnTheImage || animal == null || !result)
      return Response.json({
        hasAnimalOnTheImage: false,
        text: "",
        name: "",
        image: "",
      });

    const comment = await openAi.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Ayra is a female, cute, animal lover. Your job is to identify the breed or specie of the animal the user shows you on the prompt with precision and give a warm and engaging response. If there is no animal or the user does not know, return this: 'I coundn't identify any animal in this image please try again.'.",
        },
        {
          role: "user",
          content: result,
        },
      ],
      model: "ft:gpt-3.5-turbo-0125:personal:ayra-bot:9l4Sf6LP",
    });
    console.log(comment.choices[0].message.content);
    let name = animal.breed || animal.specie || animal.family;

    return Response.json(
      {
        hasAnimalOnTheImage: true,
        text: comment.choices[0].message.content,
        name: name,
        image: imageUrl,
      } ?? { hasAnimalOnTheImage: false, text: "", name: "", image: "" }
    );
  } catch {
    return Response.json({
      hasAnimalOnTheImage: false,
      text: "",
      name: "",
      image: "",
    });
  }
}