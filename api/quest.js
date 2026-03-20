export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_KEY;
  
  // Debug: cek apakah key ada
  if (!apiKey) return res.status(500).json({ error: 'API key kosong!' });
  
  // Debug: tampilin 10 karakter pertama key
  return res.status(200).json({ 
    keyExists: true, 
    keyPreview: apiKey.substring(0, 15) + '...',
    keyLength: apiKey.length
  });
}
