export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    const state = req.body?.state || {};
    const level = state.level || 1;
    const streak = state.streak || 0;
    const hrs = state.sleep?.hrs || 0;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Buat quest RPG dalam Bahasa Indonesia untuk player Level ${level}, streak ${streak} hari, tidur ${hrs} jam. Balas HANYA JSON: {"title":"...","desc":"...","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`
        }]
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: 'Claude error', detail: err });
    }

    const data = await r.json();
    const text = data?.content?.[0]?.text || '';
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');

    if (s !== -1 && e !== -1) {
      try {
        const q = JSON.parse(text.slice(s, e + 1));
        return res.status(200).json({
          title: q.title || 'Quest Harian',
          desc: q.desc || 'Tetap semangat!',
          reward: q.reward || '+30 EXP',
          type: q.type || 'daily',
          emoji: q.emoji || '⚔️'
        });
      } catch(pe) {
        return res.status(200).json({ title: 'Quest Harian', desc: text, reward: '+30 EXP', type: 'daily', emoji: '⚔️' });
      }
    }

    return res.status(200).json({ title: 'Quest Harian', desc: text || 'Tetap semangat!', reward: '+30 EXP', type: 'daily', emoji: '⚔️' });

  } catch(err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
