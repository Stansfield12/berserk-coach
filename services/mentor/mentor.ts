import { buildPrompt} from './promptBuilder';
import { PersonaConfig } from './personaEngine';
import axios from 'axios';

const API_KEY = '🔥_ТВОЙ_OPENAI_KEY_ЗДЕСЬ';

export async function askMentor(message: string, persona: PersonaConfig): Promise<string> {
  const prompt = await buildPrompt(message, persona);

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
}
