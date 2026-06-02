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
  // simple but effective check
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";

  // Optional: limit domain list via env.ALLOWED_ORIGINS
  // example: "https://onemotion.studio,https://www.onemotion.studio,http://localhost:5173"
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin =
    allowed.length === 0
      ? origin || "*" // if not set — allow current origin (or * if origin is empty)
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
  console.log("Received request", request);

  try {
    // Log environment
    const RESEND_API_KEY = env.RESEND_API_KEY;
    console.log("RESEND_API_KEY:", RESEND_API_KEY);

    if (!RESEND_API_KEY) {
      return json({ ok: false, error: "Missing RESEND_API_KEY env var" }, { status: 500 });
    }

    let data;
    try {
      data = await request.json();
      console.log("Parsed data:", data);
    } catch (err) {
      console.log("Error parsing JSON:", err);
      return json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const name = String(data?.name || "").trim();
    const email = String(data?.email || "").trim();
    const details = String(data?.details || "").trim();
    const interestRaw = data?.interest;
    const interest = Array.isArray(interestRaw) ? interestRaw.map((x) => String(x).trim()).filter(Boolean) : [];

    console.log("Validated data:", { name, email, details, interest });

    // Validation and email sending
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,  // Pass key in headers
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "One Motion <hello@onemotion.studio>", // From field
        to: "hello@onemotion.studio",  // Recipient
        subject: `New contact: ${name}`,  // Email subject
        html: `
          <h2>New request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Interested in:</strong> ${interest.join(", ") || "-"}</p>
          <p><strong>Details:</strong></p>
          <p>${details || "-"}</p>
        `,  // HTML version
        text: `
          New request
          Name: ${name}
          Email: ${email}
          Interested in: ${interest.join(", ") || "-"}
          Details:
          ${details || "-"}
        `,  // Text version
        reply_to: email,  // Reply-to address
      })
    });

    const resJson = await response.json();
    console.log("Response from Resend:", resJson); // Log real response from Resend

    return json({ ok: true, id: resJson.id || null }, { status: 200 });

  } catch (e) {
    console.log("Server error:", e);
    return json({ ok: false, error: "Server error", details: String(e.message || e) }, { status: 500 });
  }
}



