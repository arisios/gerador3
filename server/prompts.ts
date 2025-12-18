// Prompts para geração de conteúdo com IA - Gerador 3

// ===== PROMPT DE ANÁLISE DE PROJETO =====
export const analyzeProjectPrompt = (source: string, sourceType: string) => `
Analise a seguinte fonte e extraia informações relevantes para criação de conteúdo para redes sociais.

Fonte (${sourceType}): ${source}

Retorne um JSON com:
{
  "businessName": "nome do negócio/marca",
  "niche": "nicho de atuação",
  "mainProduct": "produto/serviço principal",
  "targetAudience": "público-alvo geral",
  "tone": "tom de comunicação identificado",
  "uniqueValue": "proposta de valor única",
  "keywords": ["palavras-chave relevantes"]
}
`;

// ===== PROMPT DE CLIENTES IDEAIS =====
export const generateIdealClientsPrompt = (analysis: string) => `
Com base na análise do negócio abaixo, gere 10 perfis de clientes ideais detalhados.

Análise: ${analysis}

Para cada cliente ideal, retorne um JSON array com:
[
  {
    "name": "Nome descritivo do perfil (ex: 'Maria Empreendedora')",
    "description": "Descrição breve do perfil",
    "demographics": {
      "age": "faixa etária",
      "gender": "gênero predominante",
      "location": "localização típica",
      "income": "faixa de renda",
      "education": "nível de educação"
    },
    "psychographics": {
      "values": ["valores importantes"],
      "interests": ["interesses"],
      "lifestyle": "estilo de vida",
      "goals": ["objetivos"],
      "challenges": ["desafios"]
    }
  }
]

Gere exatamente 10 perfis diversos e realistas.
`;

// ===== PROMPT DE DORES =====
export const generatePainsPrompt = (analysis: string, idealClients: string) => `
Com base na análise do negócio e nos clientes ideais, gere dores em 3 níveis.

Análise: ${analysis}
Clientes Ideais: ${idealClients}

Retorne um JSON com:
{
  "primary": [
    {"pain": "dor principal 1", "description": "explicação detalhada"},
    {"pain": "dor principal 2", "description": "explicação detalhada"},
    {"pain": "dor principal 3", "description": "explicação detalhada"},
    {"pain": "dor principal 4", "description": "explicação detalhada"},
    {"pain": "dor principal 5", "description": "explicação detalhada"}
  ],
  "secondary": [
    {"pain": "dor secundária 1", "description": "explicação detalhada"},
    {"pain": "dor secundária 2", "description": "explicação detalhada"},
    {"pain": "dor secundária 3", "description": "explicação detalhada"},
    {"pain": "dor secundária 4", "description": "explicação detalhada"},
    {"pain": "dor secundária 5", "description": "explicação detalhada"}
  ],
  "unexplored": [
    {"pain": "dor inexplorada 1", "description": "explicação detalhada"},
    {"pain": "dor inexplorada 2", "description": "explicação detalhada"},
    {"pain": "dor inexplorada 3", "description": "explicação detalhada"},
    {"pain": "dor inexplorada 4", "description": "explicação detalhada"},
    {"pain": "dor inexplorada 5", "description": "explicação detalhada"}
  ]
}

- Dores primárias: problemas óbvios e urgentes
- Dores secundárias: problemas relacionados mas menos urgentes
- Dores inexploradas: problemas que o público nem sabe que tem
`;

// ===== PROMPT DE GERAÇÃO DE CONTEÚDO =====
export const generateContentPrompt = (params: {
  template: string;
  templateStructure: string[];
  pain: string;
  niche: string;
  objective: string;
  person: string;
  clickbait: boolean;
  hookType?: string;
  formula?: string;
}) => `
Gere conteúdo para um carrossel de Instagram seguindo as especificações:

Template: ${params.template}
Estrutura: ${params.templateStructure.join(" → ")}
Dor/Tema: ${params.pain}
Nicho: ${params.niche}
Objetivo: ${params.objective === "sale" ? "Venda" : params.objective === "authority" ? "Autoridade" : "Crescimento"}
Pessoa gramatical: ${params.person === "first" ? "1ª pessoa (eu, meu)" : params.person === "second" ? "2ª pessoa (você, seu)" : "3ª pessoa (ele, nosso)"}
Clickbait: ${params.clickbait ? "Sim, use títulos chamativos" : "Não, seja direto"}
${params.hookType ? `Tipo de Hook: ${params.hookType}` : ""}
${params.formula ? `Fórmula de Copy: ${params.formula}` : ""}

Retorne um JSON com:
{
  "title": "título do conteúdo",
  "description": "descrição para legenda",
  "hook": "frase de gancho inicial",
  "slides": [
    {"order": 1, "text": "texto do slide 1 (máx 100 caracteres)"},
    {"order": 2, "text": "texto do slide 2"},
    ...
  ]
}

Regras:
- Cada slide deve ter no máximo 100 caracteres
- O texto deve ser impactante e direto
- Use a pessoa gramatical especificada consistentemente
- O primeiro slide é o hook/capa
- O último slide é o CTA
`;

// ===== PROMPT DE GERAÇÃO DE IMAGEM =====
export const generateImagePrompt = (params: {
  slideText: string;
  niche: string;
  visualTemplate: string;
  style?: string;
}) => `
Crie uma imagem profissional para Instagram no estilo ${params.visualTemplate}.

Texto do slide: "${params.slideText}"
Nicho: ${params.niche}
${params.style ? `Estilo adicional: ${params.style}` : ""}

REGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem.

A imagem deve:
- Ser uma FOTOGRAFIA REAL, não ilustração ou arte digital
- Ser visualmente impactante e profissional
- Ter qualidade de revista/editorial
- Combinar com o texto que será sobreposto posteriormente
- Seguir o estilo visual de contas como @brandsdecoded__
- Ter boa iluminação e composição
- Ser adequada para formato 4:5 (1080x1350)
- NÃO CONTER ABSOLUTAMENTE NENHUM TEXTO, LETRA, PALAVRA OU NÚMERO
`;

// ===== PROMPT DE TRENDS =====
export const analyzeTrendsPrompt = (trends: string[]) => `
Analise as seguintes tendências e classifique cada uma:

Tendências: ${trends.join(", ")}

Para cada tendência, retorne:
{
  "trends": [
    {
      "name": "nome da trend",
      "category": "categoria (Moda, Tech, Fitness, etc)",
      "classification": "emerging | rising | peak | declining",
      "viralProbability": 0-100,
      "suggestedNiches": ["nichos que podem aproveitar"]
    }
  ]
}
`;

// ===== PROMPT DE VIRAIS =====
export const analyzeViralsPrompt = (source: string) => `
Analise conteúdos virais recentes de ${source} e identifique oportunidades.

Retorne um JSON com:
{
  "virals": [
    {
      "title": "título/descrição do viral",
      "category": "categoria",
      "viralProbability": 0-100,
      "suggestedNiches": ["nichos que podem adaptar"],
      "suggestedAngles": ["ângulos de adaptação"]
    }
  ]
}

Identifique pelo menos 10 conteúdos virais atuais.
`;

// ===== PROMPT DE SOFT SELL (INFLUENCIADORES) =====
export const generateSoftSellPrompt = (params: {
  template: string;
  influencerName: string;
  influencerDescription: string;
  product?: string;
}) => `
Gere conteúdo de soft sell para o influenciador virtual:

Template: ${params.template}
Influenciador: ${params.influencerName}
Descrição: ${params.influencerDescription}
${params.product ? `Produto/Serviço: ${params.product}` : ""}

O conteúdo deve:
- Parecer natural e autêntico
- Não ser vendedor demais
- Integrar o produto/serviço de forma orgânica
- Manter a personalidade do influenciador

Retorne um JSON com:
{
  "title": "título do conteúdo",
  "hook": "gancho inicial",
  "slides": [
    {"order": 1, "text": "texto do slide"},
    ...
  ],
  "imagePrompts": [
    {"order": 1, "prompt": "descrição da imagem para IA"}
  ]
}
`;

// ===== PROMPT DE IMAGEM DE INFLUENCIADOR =====
export const generateInfluencerImagePrompt = (params: {
  referenceDescription: string;
  slideText: string;
  context: string;
  type: "normal" | "transformation";
  isBeforeImage?: boolean;
}) => `
Gere uma imagem de um influenciador virtual para Instagram.

Descrição de referência: ${params.referenceDescription}
Contexto: ${params.context}
Texto do slide: "${params.slideText}"
${params.type === "transformation" ? `Tipo: ${params.isBeforeImage ? "ANTES da transformação" : "DEPOIS da transformação"}` : ""}

REGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem.

A imagem deve:
- Ser uma FOTOGRAFIA REAL, não ilustração ou arte digital
- Manter consistência com a descrição de referência (mesma pessoa, mesmas características físicas)
- Parecer natural e autêntica
- Ter qualidade profissional
- Ser adequada para Instagram (4:5)
- NÃO CONTER ABSOLUTAMENTE NENHUM TEXTO, LETRA, PALAVRA OU NÚMERO
- ${params.type === "transformation" && params.isBeforeImage ? "Mostrar a pessoa ANTES da transformação" : ""}
- ${params.type === "transformation" && !params.isBeforeImage ? "Mostrar a pessoa DEPOIS da transformação, com aparência melhorada" : ""}
`;
