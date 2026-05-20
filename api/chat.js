
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const FORM_URL = "https://forms.gle/ZpJv28ZYqySVSSKL9";

  try {

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const message = body.message || "";
    const messageCount = body.messageCount || 0;

    if (messageCount >= 4) {
      return res.status(200).json({
        locked: true,
        reply:
          `Para valorar tu proyecto necesito fotos y datos técnicos.\n\n${FORM_URL}`
      });
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Eres Sergio B., ingeniero experto en homologación de motos custom en España. Responde breve, técnico y claro. No des precios."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await openaiResponse.json();

    console.log(data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Necesito más datos técnicos.";

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message,
      reply:
        `Ahora mismo no puedo responder desde el chat.\n\n${FORM_URL}`
    });
  }
}
