export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GROQ_KEY;
    if (!apiKey) {
      console.error("GROQ_KEY tidak ditemukan!");
      return res.status(500).json({ error: 'No GROQ_KEY configured' });
    }

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
    const hariArr = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const hari = hariArr[now.getDay()];

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', 
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah sistem tracker produktivitas dunia nyata. JANGAN pernah memberikan quest fantasi, sihir, atau pertarungan. Berikan quest dunia nyata yang logis dan aman.'
          },
          {
            role: 'user',
            content: `Buat 1 quest RPG kehidupan nyata dalam Bahasa Indonesia.
Konteks Player: Pelajar kelas 10, rutin nge-gym, fokus target OSN Fisika, berencana ambil les untuk kelas 11 atau mulai semester 2 ini jika sudah kelelahan belajar sendiri, dan sedang menabung merakit PC.
Waktu sekarang: ${hari} ${waktu} (jam ${jam}.00 WIB).
Kondisi Player: Level ${level}, Streak NoGoon ${streak} hari, Tidur ${hrs} jam, INT ${int_}, STR ${str_}, DEX ${dex_}.
Buat quest dunia nyata yang spesifik, masuk akal, dan bisa dikerjakan di waktu ${waktu} ini! 
Balas HANYA dengan JSON: {"title":"judul quest","desc":"deskripsi singkat yang realistis","reward":"+30 EXP","type":"daily","emoji":"💪"}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("Groq API Error:", err);
      return res.status(500).json({ error: 'Groq error', detail: err });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';

    try {
      // Hapus backtick ```json kalau AI ngasih format markdown
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const q = JSON.parse(cleanText);
      
      return res.status(200).json({
        title: q.title || 'Misi Harian',
        desc: q.desc || 'Selesaikan tugasmu hari ini!',
        reward: q.reward || '+30 EXP',
        type: q.type || 'daily',
        emoji: q.emoji || '💪'
      });
    } catch (parseError) {
      console.error("Gagal parse JSON dari Groq:", text);
      return res.status(200).json({
        title: 'Fokus Target!',
        desc: 'AI sedang kebingungan. Ambil waktu ini untuk review materi atau atur jadwal belajarmu.',
        reward: '+30 EXP',
        type: 'daily',
        emoji: '📚'
      });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
}
