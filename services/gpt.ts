import axios from 'axios';

const API_KEY = process.env.OPENAI_API_KEY;

export async function getGPTReply(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('GPT ERROR:', err);
    return '💀 Ошибка, брат...';
  }
}
