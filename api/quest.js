export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { state } = req.body || {};
    const apiKey = process.env.ANTHROPIC_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API key' });

    const prompt = `Buat 1 quest RPG untuk player level ${state?.level||1} dengan streak NoGoon ${state?.streak||0} hari dan tidur ${state?.sleep?.hrs||0} jam. Balas HANYA dengan JSON ini tanpa teks lain:
{"title":"judul quest","desc":"deskripsi motivating","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const raw = await response.json();
    console.log('STATUS:', response.status);
    console.log('RAW:', JSON.stringify(raw).substring(0, 500));

    if (!response.ok) return res.status(500).json({ error: raw?.error?.message || 'API error' });

    const text = raw?.content?.[0]?.text || '';
    console.log('TEXT:', text);

    // Extract JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const quest = JSON.parse(match[0]);
        return res.status(200).json({
          title: quest.title || 'Quest Harian',
          desc: quest.desc || 'Tetap semangat!',
          reward: quest.reward || '+30 EXP',
          type: quest.type || 'daily',
          emoji: quest.emoji || '⚔️'
        });
      } catch(e) {}
    }

    return res.status(200).json({
      title: 'Quest Harian',
      desc: text || 'Tetap semangat hari ini!',
      reward: '+30 EXP',
      type: 'daily',
      emoji: '⚔️'
    });

  } catch(err) {
    console.log('ERROR:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
