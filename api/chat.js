import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { messages } = req.body || {};

    const userMessage = messages?.[messages.length - 1]?.content || "";

    if (!userMessage.trim()) {
      return res.status(400).json({ error: "Mensaje vacío" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content: `
Eres Ingeniero Custom, un asistente especializado en homologación de reformas en motos custom en España.

Tu función es responder UNA única duda inicial del usuario de forma profesional, clara y breve, para generar confianza.

No hagas presupuestos completos.
No pidas todos los datos por chat.
No alargues la conversación.
No sustituyas la revisión técnica de un ingeniero.
No des una valoración definitiva sin fotos, ficha técnica y datos completos.

Responde con criterio técnico, pero de forma sencilla.

Después de responder la primera pregunta, deriva SIEMPRE al formulario.

Mensaje final obligatorio:
Para revisar tu caso concreto y prepararte presupuesto, rellena este formulario:
<a href="https://forms.gle/4Qh3goXjeUHZA7MD9" target="_blank" rel="noopener noreferrer">Abrir formulario</a>
          `,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    return res.status(200).json({
      reply,
      locked: true,
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      reply:
  'Ahora mismo no puedo responder desde el chat. Para revisar tu caso concreto y prepararte presupuesto, <a href="https://forms.gle/4Qh3goXjeUHZA7MD9" target="_blank" rel="noopener noreferrer">rellena este formulario</a>.',
      locked: true,
    });
  }
}
