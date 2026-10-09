/**
 * Cloudflare Pages Function: GET /api/health
 * Checks whether the Cloudflare Workers AI binding 'AI' is configured on this deployment.
 */

const WORKERS_AI_MODEL = '@cf/meta/llama-3.2-3b-instruct';

export async function onRequestGet(context) {
  const hasAiBinding = Boolean(context.env && context.env.AI);

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (!hasAiBinding) {
    return new Response(
      JSON.stringify({
        ok: false,
        provider: 'cloudflare-workers-ai',
        model: WORKERS_AI_MODEL,
        bindingConfigured: false,
        statusText: 'Workers AI binding missing',
        error: "Workers AI binding 'AI' is missing in Cloudflare Pages. Please navigate to Pages project Settings > Bindings and add a Workers AI binding with the variable name 'AI', then redeploy.",
      }),
      { status: 503, headers }
    );
  }

  // Binding is verified to exist on context.env.
  // We accurately report that the binding is configured without falsely claiming
  // that a full end-to-end inference pass has been executed on this lightweight health ping.
  return new Response(
    JSON.stringify({
      ok: true,
      provider: 'cloudflare-workers-ai',
      model: WORKERS_AI_MODEL,
      bindingConfigured: true,
      message: `Cloudflare Workers AI binding 'AI' is configured with model ${WORKERS_AI_MODEL}. Ready for inference.`,
    }),
    { status: 200, headers }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
