export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const state = body.state || {};
    const apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

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
}      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: 'Kamu adalah AI quest generator RPG kehidupan nyata. Balas HANYA dengan JSON valid. Tidak ada teks lain, tidak ada markdown, tidak ada penjelasan.',
        messages: [{
          role: 'user',
          content: `Buat 1 quest RPG personal dalam Bahasa Indonesia.
Player: Level ${state.level||1}, EXP ${state.totalExp||0}, Streak NoGoon ${state.streak||0} hari, Tidur ${state.sleep?.hrs||0} jam, INT ${state.stats?.int||0}, STR ${state.stats?.str||0}, DEX ${state.stats?.dex||0}.
Balas dengan JSON ini saja, isi dengan konten yang relevan dan motivating:
{"title":"judul quest","desc":"deskripsi motivating","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`
        }, {
          role: 'assistant',
          content: '{'
        }]
      })
    });

    const raw = await response.json();
   const full = '{' + (raw?.content?.[0]?.text || '').trim();
    
    try {
      const q = JSON.parse(full);
      return res.status(200).json({
        title: q.title || 'Quest Harian',
        desc: q.desc || 'Tetap semangat!',
        reward: q.reward || '+30 EXP',
        type: q.type || 'daily',
        emoji: q.emoji || '⚔️'
      });
    } catch(e) {
      // Try extracting JSON another way
      const match = full.match(/\{[^{}]*\}/);
      if (match) {
        try {
          const q = JSON.parse(match[0]);
          return res.status(200).json({
            title: q.title || 'Quest Harian',
            desc: q.desc || 'Tetap semangat!',
            reward: q.reward || '+30 EXP',
            type: q.type || 'daily',
            emoji: q.emoji || '⚔️'
          });
        } catch(e2) {}
      }
      return res.status(200).json({
        title: 'Quest Harian',
        desc: full || 'Tetap semangat hari ini!',
        reward: '+30 EXP',
        type: 'daily',
        emoji: '⚔️'
      });
    }

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
