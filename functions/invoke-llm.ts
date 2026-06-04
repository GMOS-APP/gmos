// invoke-llm — DECOMMISSIONED.
// GM/OS no longer has AI features; this function previously proxied Anthropic.
// It now does nothing and never reads ANTHROPIC_API_KEY, eliminating the
// key-exposure and cost-abuse surface. (The ANTHROPIC_API_KEY secret can also
// be deleted from the project if nothing else uses it.)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  return Response.json(
    { error: 'This function has been decommissioned.' },
    { status: 410, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
