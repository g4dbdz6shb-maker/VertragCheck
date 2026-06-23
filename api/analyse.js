export default async function handler(req, res) {
  // CORS — alle Domains erlauben
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    
    // Falls body ein String ist, parsen
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { prompt, max_tokens } = body;

    if (!prompt) {
      return res.status(400).json({ error: 'Kein Prompt angegeben' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Text zu lang' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key nicht konfiguriert' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'API Fehler' 
      });
    }

    return res.status(200).json({ text: data.content[0].text });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Serverfehler: ' + error.message });
  }
}
}
