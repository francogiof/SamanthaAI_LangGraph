// src/pages/api/llm.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.LEMONFOX_LLM_KEY,
  baseURL: 'https://api.lemonfox.ai/v1',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.body;

  const completion = await openai.chat.completions.create({
    model: 'llama-8b-chat',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: text },
    ],
  });

  res.status(200).json({ text: completion.choices[0].message.content });
}
