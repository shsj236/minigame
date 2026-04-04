export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    console.log("BODY:", body);

    const token = body.token;
    const nickname = body.nickname;
    const score = body.score;

    if (!token) {
      return new Response(JSON.stringify({
        ok: false,
        error: "no-token"
      }), { headers: { "Content-Type": "application/json" }});
    }

    // 🔥 Google 검증
    const formData = new URLSearchParams();
    formData.append("secret", env.RECAPTCHA_SECRET);
    formData.append("response", token);

    const googleRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      { method: "POST", body: formData }
    );

    const result = await googleRes.json();

    console.log("GOOGLE:", result);

    if (!result.success) {
      return new Response(JSON.stringify({
        ok: false,
        error: result["error-codes"]
      }), { headers: { "Content-Type": "application/json" }});
    }

    // 🔥 KV 저장 부분 (여기서 터질 가능성 높음)
    let scores = [];

    try {
      const data = await env.SCORES.get("list");
      scores = JSON.parse(data || "[]");
    } catch (e) {
      console.log("KV READ ERROR:", e);
      scores = [];
    }

    scores.push({ nickname, score });

    scores.sort((a, b) => b.score - a.score);

    try {
      await env.SCORES.put("list", JSON.stringify(scores));
    } catch (e) {
      console.log("KV WRITE ERROR:", e);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: e.toString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}