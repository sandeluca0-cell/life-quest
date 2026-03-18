export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { state } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Kamu adalah AI quest generator untuk game RPG kehidupan nyata. Berdasarkan data berikut, buat 1 quest personal yang motivating dalam Bahasa Indonesia.

Data player:
- Level: ${state.level}
- Total EXP: ${state.totalExp}
- Streak No Goon: ${state.streak} hari
- Tidur terakhir: ${state.sleep.hrs} jam
- INT: ${state.stats.int}, STR: ${state.stats.str}, DEX: ${state.stats.dex}, GOLD: ${state.stats.gld}
- Quest aktif: OSN Astronomi (${state.quests.osn.length} materi), Lagu (${state.quests.lagu.length}), Ulangan (${state.quests.ul.length}), Buku (${state.quests.buku.length}), Clipping (${state.quests.duit.length})

Respond dengan JSON ONLY tanpa markdown:
{"title":"judul quest singkat","desc":"deskripsi quest 1-2 kalimat yang personal dan motivating","reward":"reward EXP misal +50 EXP","type":"daily/urgent/bonus","emoji":"1 emoji yang relevan"}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  try {
    const quest = JSON.parse(text);
    res.status(200).json(quest);
  } catch {
    res.status(200).json({ title: 'Quest Harian', desc: text, reward: '+30 EXP', type: 'daily', emoji: '⚔️' });
  }
}
