export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const FORM_URL = "https://forms.gle/ZpJv28ZYqySVSSKL9";

  try {
    const { message, messageCount } = req.body;

    if (messageCount >= 4) {
      return res.status(200).json({
        locked: true,
        reply: `Para valorar tu caso con rigor necesito datos técnicos, ficha y fotos. Rellena este formulario y seguimos desde ahí:\n\n${FORM_URL}`
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres Sergio B., ingeniero especializado en homologación de motos custom en España. Responde breve, claro y técnico. No des precios. Tras varias preguntas deriva al formulario."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || `Necesito más datos. Rellena el formulario: ${FORM_URL}`
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      reply: `Ahora mismo no puedo responder desde el chat. Rellena el formulario y seguimos con datos: ${FORM_URL}`
    });
  }
}
