export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { state } = req.body;
    const apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: 'Kamu adalah AI quest generator RPG. Selalu balas HANYA dengan JSON valid tanpa markdown, tanpa penjelasan apapun.',
        messages: [{
          role: 'user',
          content: `Buat 1 quest RPG personal dalam Bahasa Indonesia untuk player ini:
Level ${state?.level||1}, EXP ${state?.totalExp||0}, Streak NoGoon ${state?.streak||0} hari, Tidur ${state?.sleep?.hrs||0} jam.

Balas dengan JSON ini saja:
{"title":"judul quest","desc":"deskripsi motivating 1-2 kalimat","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`
        }]
      })
    });

    const raw = await response.json();
    const text = (raw?.content?.[0]?.text || '').replace(/```json|```/g,'').trim();
    
    let quest;
    try { quest = JSON.parse(text); }
    catch { quest = { title:'Quest Harian', desc: text||'Tetap semangat!', reward:'+30 EXP', type:'daily', emoji:'⚔️' }; }

    return res.status(200).json({
      title: quest.title || 'Quest Harian',
      desc: quest.desc || 'Tetap semangat hari ini!',
      reward: quest.reward || '+30 EXP',
      type: quest.type || 'daily',
      emoji: quest.emoji || '⚔️'
    });

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
