export async function onRequestPost(context) {
  const { request, env } = context;
  const { token, nickname, score } = await request.json();

  const formData = new URLSearchParams();
  formData.append("secret", env.RECAPTCHA_SECRET);
  formData.append("response", token);

  const googleRes = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    { method: "POST", body: formData }
  );

  const result = await googleRes.json();

 return new Response(JSON.stringify(result), {
  headers: { "Content-Type": "application/json" }
});

  let scores = JSON.parse(await env.SCORES.get("list") || "[]");
  scores.push({ nickname, score });
  scores.sort((a,b)=>b.score-a.score);

  await env.SCORES.put("list", JSON.stringify(scores));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
