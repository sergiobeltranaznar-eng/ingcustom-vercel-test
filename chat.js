
const FORM_URL = "https://forms.gle/ZpJv28ZYqySVSSKL9";

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { messages = [] } = JSON.parse(event.body || "{}");
    const userTurns = messages.filter(m => m.role === "user").length;
    const shouldLock = userTurns >= 4;

    if (shouldLock) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locked: true,
          reply: `Para poder valorar tu caso con rigor necesito datos técnicos, ficha y fotos. Rellena este formulario y seguimos desde ahí:\n${FORM_URL}`
        })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const system = `
Eres Sergio B., ingeniero industrial especializado en homologación y reforma de motocicletas custom en España.
Responde directo, práctico y profesional.
No des precios.
Da solo orientación inicial. No sustituyes proyecto técnico, informe de conformidad ni ITV.
Pregunta por modelo, año, reforma, fotos, ficha técnica y marcado/homologación de piezas si falta.
Tras 3-4 intercambios o si faltan datos, deriva al formulario: ${FORM_URL}.
Una vez derivado al formulario, no sigas dando diagnóstico técnico.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: system },
          ...messages.slice(-8)
        ],
        max_output_tokens: 450
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt);
    }

    const data = await response.json();
    const reply =
      data.output_text ||
      data.output?.flatMap(o => o.content || []).map(c => c.text || "").join("") ||
      `Necesito más datos para valorar tu caso. Rellena el formulario: ${FORM_URL}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: false, reply })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locked: true,
        reply: `Para avanzar necesito que rellenes el formulario: ${FORM_URL}`
      })
    };
  }
};
