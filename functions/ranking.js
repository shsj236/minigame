export async function onRequestGet(context) {
  const { env } = context;

  let scores = JSON.parse(await env.SCORES.get("list") || "[]");

  return new Response(JSON.stringify(scores.slice(0,10)), {
    headers: { "Content-Type": "application/json" }
  });
}
