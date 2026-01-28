import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const body = JSON.parse(event.body);
    const userQuestion = body.message;

    // 🔍 Search iFixit
    const searchURL = `https://www.ifixit.com/api/2.0/search/${encodeURIComponent(userQuestion)}`;
    const ifixitRes = await fetch(searchURL);
    const ifixitData = await ifixitRes.json();

    let context = "iFixit results:\n";
    if (ifixitData?.results?.length) {
      ifixitData.results.slice(0, 5).forEach(item => {
        context += `- ${item.title}: ${item.summary}\n`;
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a repair assistant using iFixit guides." },
        { role: "user", content: `${userQuestion}\n\n${context}` }
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: completion.choices[0].message.content
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Server error" })
    };
  }
}
