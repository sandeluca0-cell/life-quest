export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const state = (req.body || {}).state || {};
    const apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are an RPG quest generator. Respond with ONLY a JSON object, no other text.
Player: Level ${state.level||1}, Streak ${state.streak||0} days, Sleep ${state.sleep?.hrs||0}h.
Create a motivating personal quest in Indonesian language.
JSON format: {"title":"quest title","desc":"1-2 sentence description","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`
        }]
      })
    });

    const data = await r.json();
    const text = (data?.content?.[0]?.text || '').trim();
    
    // Find JSON in response
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const q = JSON.parse(text.substring(start, end + 1));
      return res.status(200).json({
        title: q.title || 'Quest Harian',
        desc: q.desc || 'Tetap semangat!',
        reward: q.reward || '+30 EXP',
        type: q.type || 'daily',
        emoji: q.emoji || '⚔️'
      });
    }

    return res.status(200).json({ title: 'Quest Harian', desc: text, reward: '+30 EXP', type: 'daily', emoji: '⚔️' });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
