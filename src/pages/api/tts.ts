// src/pages/api/tts.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.body;

  const ttsResp = await fetch('https://api.lemonfox.ai/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LEMONFOX_TTS_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      voice: 'sarah',
      response_format: 'mp3',
    }),
  });

  const buffer = await ttsResp.arrayBuffer();
  res.setHeader('Content-Type', 'audio/mpeg');
  res.status(200).send(Buffer.from(buffer));
}
