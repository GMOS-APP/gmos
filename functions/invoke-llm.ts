import Anthropic from 'npm:@anthropic-ai/sdk@0.36.3';
import { createClient } from 'npm:@supabase/supabase-js@2';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Verify JWT and check plan via service role
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profile?.plan !== 'plus') {
      return Response.json({ error: 'upgrade_required' }, { status: 403, headers: corsHeaders });
    }

    const { prompt, response_json_schema } = await req.json();
    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400, headers: corsHeaders });
    }

    let system = 'You are a helpful assistant for tabletop RPG game masters.';
    if (response_json_schema) {
      system += ' Always respond with valid JSON. Do not include markdown code fences or any text outside the JSON object.';
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    if (response_json_schema) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        return Response.json(parsed, { headers: corsHeaders });
      } catch {
        return Response.json({ error: 'Failed to parse JSON response', raw: text }, { status: 500, headers: corsHeaders });
      }
    }

    return Response.json({ result: text }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
