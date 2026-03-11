import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, response_json_schema } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const systemPrompt = response_json_schema
      ? 'You are a helpful D&D assistant. Respond ONLY with valid JSON matching the schema provided. Do not include markdown code fences.'
      : 'You are a helpful D&D Game Master assistant. Be creative, concise, and SRD 5.2.1 compliant.';

    const userMessage = response_json_schema
      ? `${prompt}\n\nRespond with JSON matching this schema:\n${JSON.stringify(response_json_schema, null, 2)}`
      : prompt;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = message.content[0]?.text ?? '';

    if (response_json_schema) {
      try {
        const parsed = JSON.parse(content);
        return res.status(200).json({ content: parsed });
      } catch {
        // Try stripping markdown code fences if present
        const stripped = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        return res.status(200).json({ content: JSON.parse(stripped) });
      }
    }

    return res.status(200).json({ content });
  } catch (err) {
    console.error('LLM error:', err);
    return res.status(500).json({ error: err.message || 'LLM request failed' });
  }
}
