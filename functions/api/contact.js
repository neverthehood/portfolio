// functions/api/contact.js

function json(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEmail(email = "") {
  // простая, но нормальная проверка
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";

  // Опционально: ограничить список доменов через env.ALLOWED_ORIGINS
  // пример: "https://onemotion.studio,https://www.onemotion.studio,http://localhost:5173"
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin =
    allowed.length === 0
      ? origin || "*" // если не задано — разрешаем текущий origin (или * если origin пустой)
      : allowed.includes(origin)
        ? origin
        : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export async function onRequestOptions(context) {
  const { request, env } = context;
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = corsHeaders(request, env);

  try {
    // 1) Проверим ключ
    const RESEND_API_KEY = env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return json(
        { ok: false, error: "Missing RESEND_API_KEY env var" },
        { status: 500, headers: cors }
      );
    }

    // 2) Парсим JSON
    let data;
    try {
      data = await request.json();
    } catch {
      return json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400, headers: cors }
      );
    }

    // 3) Достаём поля
    const name = String(data?.name || "").trim();
    const email = String(data?.email || "").trim();
    const details = String(data?.details || "").trim();

    // interest может прийти строкой или массивом
    const interestRaw = data?.interest;
    const interest = Array.isArray(interestRaw)
      ? interestRaw.map((x) => String(x).trim()).filter(Boolean)
      : typeof interestRaw === "string"
        ? interestRaw.split(",").map((x) => x.trim()).filter(Boolean)
        : [];

    // 4) Валидация
    if (name.length < 2 || name.length > 80) {
      return json(
        { ok: false, error: "Name must be 2–80 characters" },
        { status: 400, headers: cors }
      );
    }

    if (!isEmail(email)) {
      return json(
        { ok: false, error: "Invalid email" },
        { status: 400, headers: cors }
      );
    }

    if (details.length > 4000) {
      return json(
        { ok: false, error: "Details too long (max 4000 chars)" },
        { status: 400, headers: cors }
      );
    }

    // 5) Формируем письмо (экранируем HTML!)
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeDetails = escapeHtml(details || "-");
    const safeInterest = escapeHtml(interest.join(", ") || "-");

    const subject = `New contact: ${name}`;

    const html = `
      <h2>New request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Interested in:</strong> ${safeInterest}</p>
      <p><strong>Details:</strong></p>
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${safeDetails}</pre>
    `;

    const text =
`New request
Name: ${name}
Email: ${email}
Interested in: ${interest.join(", ") || "-"}
Details:
${details || "-"}`;

    // 6) Куда/откуда отправляем — лучше вынести в env (но можно и хардкодом)
    const TO_EMAIL = env.TO_EMAIL || "hello@onemotion.studio";
    const FROM_EMAIL = env.FROM_EMAIL || "One Motion <hello@onemotion.studio>";

    // 7) Отправка через Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject,
        html,
        text,
        // В REST у Resend встречается reply_to (в доках упоминается reply_to). :contentReference[oaicite:1]{index=1}
        reply_to: email,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return json(
        {
          ok: false,
          error: "Email failed",
          status: response.status,
          details: errText.slice(0, 2000),
        },
        { status: 502, headers: cors }
      );
    }

    const resJson = await response.json().catch(() => ({}));
    return json(
      { ok: true, id: resJson.id || null },
      { status: 200, headers: cors }
    );
  } catch (e) {
    return json(
      { ok: false, error: "Server error", details: String(e?.message || e) },
      { status: 500, headers: cors }
    );
  }
}
