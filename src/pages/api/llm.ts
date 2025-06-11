// File: src/pages/api/llm.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.body;

  try {
    const backendRes = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await backendRes.json();

    res.status(200).json({ text: data.text });
  } catch (err) {
    console.error('❌ Error forwarding to FastAPI backend:', err);
    res.status(500).json({ text: 'Error calling local LLM backend.' });
  }
}
