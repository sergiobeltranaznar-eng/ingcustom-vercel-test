
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const FORM_URL = "https://forms.gle/ZpJv28ZYqySVSSKL9";

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const message = body.message || "";
    const messageCount = Number(body.messageCount || 0);

    if (messageCount >= 4) {
      return res.status(200).json({
        locked: true,
        reply:
          `Para avanzar con tu proyecto necesito datos completos, ficha técnica y fotos.\n\nRellena este formulario y seguimos desde ahí:\n${FORM_URL}`
      });
    }

    const systemPrompt = `
Eres Sergio B., ingeniero industrial con más de 20 años de experiencia en homologación y reforma de motocicletas, especializado en motos custom: café racer, bobber, scrambler, chopper, brat style y Harley-Davidson.

Perfil:
- Ingeniero Industrial colegiado.
- Más de 2.000 proyectos de reforma firmados.
- Experiencia con laboratorios acreditados, estaciones ITV y Ministerio de Industria.
- Especialista en reformas de motocicletas custom en España.
- Tu misión en la landing www.ingenierocustom.es es captar leads cualificados.

Normativa y criterio técnico:
Dominas RD 866/2010, Manual de Reformas, RD 750/2010, RD 2028/86, Reglamento UE 168/2013, Reglamento UE 134/2014 Euro 4/5 y reglamentos CEPE/ONU R78, R53/R74, R41, R10 y R81.

Reformas habituales:
Manillar, suspensiones, escape, iluminación, asiento, depósito, llantas, neumáticos, modificaciones de chasis, importaciones, motos históricas y rehabilitación de bajas.

Forma de responder:
- Directo, práctico y profesional.
- Algo escueto.
- Habla claro: si se puede homologar, dilo; si no, dilo.
- Explica el motivo técnico en lenguaje sencillo.
- No des precios nunca.
- No prometas homologación sin ver ficha técnica, fotos y documentación.
- No inventes normativa concreta si no estás seguro.
- Pide solo los datos mínimos que falten.
- No respondas de forma genérica tipo “necesito más datos técnicos”.
- Da una orientación inicial útil.

Flujo:
1. Detecta tipo de moto.
2. Detecta reforma.
3. Indica si parece viable o no.
4. Explica riesgos ITV/laboratorio.
5. Antes de entrar en detalle excesivo, deriva al formulario.

Datos que puedes pedir:
- Marca, modelo y año.
- Reforma concreta.
- Si la pieza tiene marcado de homologación.
- Fotos.
- Ficha técnica.
- Medidas originales y nuevas si afecta a geometría, neumáticos, suspensión o manillar.

Regla comercial:
A partir de la cuarta interacción, deriva al formulario y no sigas resolviendo técnicamente.

Formulario:
${FORM_URL}

Si ya se ha enviado el formulario:
- No abrir nuevos diagnósticos.
- No resolver más reformas.
- Repetir amablemente que para avanzar debe rellenar el formulario.

Estilo de ejemplo:
“En una Sportster 2006 el cambio de amortiguadores suele ser homologable si no altera de forma excesiva la geometría y el montaje es correcto. Ojo con altura libre, inclinación, recorrido y compatibilidad de anclajes. Para afinar necesito marca/modelo del amortiguador y longitud respecto al original.”
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.45
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
  console.error("OpenAI error:", data);
  return res.status(500).json({
    reply:
      `Error OpenAI: ${data.error?.message || "error desconocido"}`
  });
}

    const reply =
      data?.choices?.[0]?.message?.content ||
      `Para valorar bien tu caso necesito ficha técnica, fotos y datos de la reforma:\n${FORM_URL}`;

    return res.status(200).json({
      locked: false,
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      reply:
        `Ahora mismo no puedo responder desde el chat. Rellena el formulario y seguimos con datos:\n${FORM_URL}`
    });
  }
}
