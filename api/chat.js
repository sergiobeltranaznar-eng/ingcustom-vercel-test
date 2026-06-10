import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FORM_URL = "/presupuesto.html";

const CIERRE_HTML = `
Para revisar tu caso concreto y prepararte presupuesto, rellena el formulario aquí:<br><br>
<a href="${FORM_URL}" target="_blank" rel="noopener noreferrer" style="color:#f6b51d;font-weight:900;text-decoration:none;">
solicitar presupuesto
</a>.
`;

function limpiarDerivacionesDuplicadas(texto = "") {
  return texto
    .replace(/Para revisar tu caso concreto[\s\S]*$/i, "")
    .replace(/Para prepararte presupuesto[\s\S]*$/i, "")
    .replace(/Solicita presupuesto[\s\S]*$/i, "")
    .replace(/Rellena el formulario[\s\S]*$/i, "")
    .replace(/<a[\s\S]*?forms\.gle[\s\S]*?<\/a>\.?/gi, "")
    .trim();
}

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
      temperature: 0.35,
      max_tokens: 360,
      messages: [
        {
          role: "system",
          content: `
Eres Ingeniero Custom, un asistente especializado en homologación de reformas en motos custom en España.

Responde una única duda inicial del usuario de forma profesional, clara, breve y cercana.

No hagas presupuestos.
No pidas todos los datos por chat.
No alargues la conversación.
No sustituyas la revisión técnica de un ingeniero.
No des una valoración definitiva sin fotos, ficha técnica y datos completos.
No incluyas enlaces.
No incluyas llamadas a la acción.
No escribas frases como "solicita presupuesto", "rellena el formulario" o "para revisar tu caso concreto".

Responde con orientación inicial y, como máximo, dos preguntas útiles si realmente ayudan a encuadrar el caso.
          `,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    let reply = completion.choices[0].message.content || "";

    reply = limpiarDerivacionesDuplicadas(reply);
    reply = `${reply}\n\n${CIERRE_HTML}`;

    return res.status(200).json({
      reply,
      locked: true,
    });

  } catch (error) {
    console.error("Error en /api/chat:", error);

    return res.status(500).json({
      error: "Error interno del servidor",
      reply: CIERRE_HTML,
      locked: true,
    });
  }
}
