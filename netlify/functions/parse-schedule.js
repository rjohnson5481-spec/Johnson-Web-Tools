// Netlify Function: parse-schedule
// Accepts POST { file: base64, mediaType } from the planner client.
// Proxies to the Anthropic API using the server-side API key.
// ANTHROPIC_API_KEY must be set in the Netlify dashboard — never in client code.

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are parsing a homeschool weekly schedule document.
Extract all lesson assignments and return them as a JSON object.

Required format:
{
  "StudentName": {
    "SubjectName": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }
}

Rules:
- Array indices 0–4 represent Monday through Friday.
- Use null for any day with no assignment.
- Keep lesson text concise but complete — preserve page/chapter references.
- If the document does not name students, use "Orion" for the primary student.
- Extract every subject you find. Do not invent subjects not in the document.
- Return ONLY valid JSON — no markdown fences, no explanation.`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body must be valid JSON' }),
    };
  }

  const { file, mediaType } = body;
  if (!file || !mediaType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: file, mediaType' }),
    };
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: file },
            },
            {
              type: 'text',
              text: 'Parse this schedule and return the JSON.',
            },
          ],
        },
      ],
    });

    const parsed = JSON.parse(response.content[0].text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    const isJsonError = err instanceof SyntaxError;
    return {
      statusCode: isJsonError ? 422 : 500,
      body: JSON.stringify({
        error: isJsonError
          ? 'Model returned unparseable JSON — try a clearer document'
          : err.message,
      }),
    };
  }
};
