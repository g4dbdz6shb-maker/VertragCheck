export default async function handler(req, res) {
  // CORS — erlaubt Anfragen von deiner App
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, max_tokens } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Kein Prompt angegeben' });

    // Rate limiting: max 20 Zeichen Prompt-Länge check (Schutz vor Missbrauch)
    if (prompt.length > 8000) return res.status(400).json({ error: 'Text zu lang' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // sicher in Vercel gespeichert
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API Fehler' });
    }

    const data = await response.json();
    return res.status(200).json({ text: data.content[0].text });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Serverfehler: ' + error.message });
  }
}
