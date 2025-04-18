import { generatePersonaPrompt, PersonaConfig } from './personaEngine';
import { getMemoryContext } from './memoryEngine';

export async function buildPrompt(userMessage: string, config: PersonaConfig): Promise<string> {
  const persona = generatePersonaPrompt(config);
  const memory = await getMemoryContext();

  return `
${persona}

Контекст пользователя:
${memory}

Сообщение пользователя:
"${userMessage}"

Ответь стратегически, прагматично и персонализированно.
`;
}
