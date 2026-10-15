export const config = { runtime: 'edge' };

const MODEL = 'deepseek-chat';

const SYSTEM = `คุณคือผู้เชี่ยวชาญการเขียนสคริปต์ Roblox (Luau) ตอบเป็นภาษาไทยเสมอ
ถ้าผู้ใช้ถามเรื่องอื่นก็ตอบได้ตามปกติ
ให้โค้ดเต็มที่รันได้จริง บอกว่าต้องวางสคริปต์ไว้ที่ไหน (ServerScriptService, StarterPlayerScripts ฯลฯ) และอธิบายสั้นๆ
ตอบตรงประเด็น ไม่ต้องเทศนา
ฝั่งเซิร์ฟเวอร์ต้องตรวจสอบข้อมูลจาก RemoteEvent ทุกครั้ง`;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });

  const need = process.env.ACCESS_CODE;
  if (need && req.headers.get('x-code') !== need) {
    return new Response('unauthorized', { status: 401 });
  }

  const { messages } = await req.json();
  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [{ role: 'system', content: SYSTEM }, ...messages.slice(-20)],
    }),
  });

  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status });
  return new Response(upstream.body, { headers: { 'Content-Type': 'text/event-stream' } });
}
