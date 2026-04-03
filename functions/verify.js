export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { token, nickname, score } = await request.json();

    // 🔥 토큰 없으면 바로 실패
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "no-token" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🔥 Google에 검증 요청
    const formData = new URLSearchParams();
    formData.append("secret", env.RECAPTCHA_SECRET);
    formData.append("response", token);

    const googleRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await googleRes.json();

    // 🔥 디버깅 (필요하면 로그 확인 가능)
    console.log("reCAPTCHA:", result);

    // 🔥 실패 시 이유까지 반환
    if (!result.success) {
      return new Response(JSON.stringify({
        ok: false,
        error: result["error-codes"],
        hostname: result.hostname
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🔥 점수 저장 (KV)
    let scores = JSON.parse(await env.SCORES.get("list") || "[]");

    scores.push({ nickname, score });

    // 높은 점수 순 정렬
    scores.sort((a, b) => b.score - a.score);

    // 최대 10개 유지 (선택)
    scores = scores.slice(0, 10);

    await env.SCORES.put("list", JSON.stringify(scores));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: "server-error"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}