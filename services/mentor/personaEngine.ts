export type PersonaConfig = {
    tone: 'rational' | 'friendly' | 'cold' | 'strict';
    role: 'strategist' | 'coach' | 'analyst';
    values: string[];
    avoid: string[];
  };
  
  export function generatePersonaPrompt(config: PersonaConfig): string {
    const { tone, role, values, avoid } = config;
  
    return `
  Ты — персональный ментор в роли ${role}.
  Общайся в тоне: ${tone}.
  Твои приоритеты: ${values.join(', ')}.
  Не упоминай: ${avoid.join(', ')}.
  Будь предельно прагматичным, не уходи в обобщения, давай чёткие предложения.`;
  }
  