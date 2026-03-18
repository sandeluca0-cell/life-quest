export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { state } = req.body;
    const apiKey = process.env.ANTHROPIC_KEY;
    
    if (!apiKey) return res.status(500).json({ error: 'API key tidak ditemukan' });

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
        messages: [{
          role: 'user',
          content: `Kamu adalah AI quest generator RPG kehidupan nyata. Buat 1 quest personal dalam Bahasa Indonesia berdasarkan data:
- Level: ${state?.level || 1}, EXP: ${state?.totalExp || 0}
- Streak No Goon: ${state?.streak || 0} hari
- Tidur: ${state?.sleep?.hrs || 0} jam
- Stats: INT ${state?.stats?.int || 0}, STR ${state?.stats?.str || 0}, DEX ${state?.stats?.dex || 0}

Balas HANYA dengan JSON ini (tanpa markdown):
{"title":"judul singkat","desc":"deskripsi 1-2 kalimat motivating","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`
        }]
      })
    });

    const raw = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Anthropic error', detail: raw });
    }

    const text = raw?.content?.[0]?.text || '{}';
    
    try {
      const quest = JSON.parse(text);
      return res.status(200).json(quest);
    } catch {
      return res.status(200).json({
        title: 'Quest Harian',
        desc: text,
        reward: '+30 EXP',
        type: 'daily',
        emoji: '⚔️'
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
