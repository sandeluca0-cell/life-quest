export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GROQ_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No GROQ_KEY' });

    const state = req.body?.state || {};
    const level = state.level || 1;
    const streak = state.streak || 0;
    const hrs = state.sleep?.hrs || 0;
    const int_ = state.stats?.int || 0;
    const str_ = state.stats?.str || 0;
    const dex_ = state.stats?.dex || 0;

    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const jam = now.getHours();
    const waktu = jam < 5 ? 'dini hari' : jam < 11 ? 'pagi' : jam < 15 ? 'siang' : jam < 18 ? 'sore' : 'malam';
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][now.getDay()];

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 200,
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah AI quest generator RPG kehidupan nyata. Balas dengan JSON valid saja. Buat quest yang relevan dengan waktu dan kondisi player.'
          },
          {
            role: 'user',
            content: `Buat 1 quest RPG personal dalam Bahasa Indonesia.
Waktu sekarang: ${hari} ${waktu} (jam ${jam}.00 WIB).
Player: Level ${level}, Streak NoGoon ${streak} hari, Tidur ${hrs} jam, INT ${int_}, STR ${str_}, DEX ${dex_}.
Buat quest yang spesifik dan relevan dengan waktu ${waktu} ini!
Balas JSON: {"title":"judul quest","desc":"deskripsi 1-2 kalimat motivating yang relevan dengan kondisi sekarang","reward":"+30 EXP","type":"daily","emoji":"⚔️"}`
          }
        ]
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: 'Groq error', detail: err });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';

    try {
      const q = JSON.parse(text);
      return res.status(200).json({
        title: q.title || 'Quest Harian',
        desc: q.desc || 'Tetap semangat!',
        reward: q.reward || '+30 EXP',
        type: q.type || 'daily',
        emoji: q.emoji || '⚔️'
      });
    } catch(e) {
      return res.status(200).json({ title: 'Quest Harian', desc: text, reward: '+30 EXP', type: 'daily', emoji: '⚔️' });
    }

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
