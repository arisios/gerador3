// Prompts para geração de conteúdo com IA - Gerador 3

// ===== PROMPT DE SELEÇÃO AUTOMÁTICA DE TEMPLATE =====
export const selectVisualTemplatePrompt = (text: string, templates: string) => `
Você é um especialista em design de conteúdo para redes sociais, especialmente no estilo @brandsdecoded__.

Analise o texto abaixo e escolha o template visual mais adequado.

TEXTO DO CONTEÚDO:
"${text}"

TEMPLATES DISPONÍVEIS:
${templates}

Critérios de escolha:
- Tom do texto (provocativo, informativo, emocional, humor, urgente)
- Tipo de conteúdo (dados/números, história, pergunta, lista, citação, comparação)
- Objetivo implícito (venda, autoridade, engajamento, educação)
- Presença de elementos específicos (%, números, perguntas, urgência, antes/depois)

Responda APENAS com um JSON:
{
  "templateId": "id-do-template-escolhido",
  "accentColorId": "id-da-cor-de-destaque",
  "reason": "breve explicação da escolha"
}

Cores disponíveis: neon-green, neon-yellow, neon-pink, neon-blue, neon-orange, neon-red, white, gold, neon-purple, neon-cyan
`;

// ===== PROMPT DE SELEÇÃO AUTOMÁTICA DE TEMPLATES VARIADOS PARA CARROSSEL =====
export const selectVariedTemplatesPrompt = (slides: { order: number; text: string }[], templates: string, palettes: string) => `
Você é um especialista em design de carrosséis para Instagram no estilo @brandsdecoded__.

Você recebeu um carrossel com ${slides.length} slides. Sua tarefa é escolher templates DIFERENTES e VARIADOS para cada slide, criando uma experiência visual dinâmica.

SLIDES DO CARROSSEL:
${slides.map(s => `Slide ${s.order}: "${s.text}"`).join('\n')}

TEMPLATES DISPONÍVEIS:
${templates}

PALETAS DE CORES:
${palettes}

REGRAS IMPORTANTES:
1. NÃO repita o mesmo template em slides consecutivos
2. Varie os layouts (split, card, fullbleed, minimal, bold)
3. Mantenha coerência visual usando a mesma paleta de cores
4. O primeiro slide (capa) deve ser impactante - use templates bold ou fullbleed
5. O último slide (CTA) deve ser limpo - use templates minimal ou card
6. Slides com dados/números: use templates com mais espaço para texto
7. Slides com histórias/emoção: use templates fullbleed com imagem forte

Responda APENAS com um JSON:
{
  "paletteId": "id-da-paleta-escolhida",
  "slides": [
    { "order": 1, "templateId": "id-template", "reason": "breve justificativa" },
    { "order": 2, "templateId": "id-template", "reason": "breve justificativa" },
    ...
  ]
}
`;

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

// ===== PROMPT DE ANÁLISE PROFUNDA DE LINK =====
export const analyzeLinkDeepPrompt = (url: string, sourceType: string) => `
Você é um especialista em análise de negócios e marketing digital.

Analise PROFUNDAMENTE o seguinte link e identifique TODOS os possíveis clientes ideais que esse negócio poderia atender.

Link: ${url}
Tipo: ${sourceType}

Sua análise deve considerar:
1. O produto/serviço oferecido
2. A linguagem e tom de comunicação
3. Os problemas que o negócio resolve
4. O posicionamento de mercado
5. Os benefícios destacados
6. O público-alvo implícito e explícito

Retorne um JSON com:
{
  "businessAnalysis": {
    "name": "nome do negócio",
    "niche": "nicho principal",
    "mainOffer": "oferta principal",
    "uniqueValue": "proposta de valor única",
    "tone": "tom de comunicação",
    "keywords": ["palavras-chave identificadas"]
  },
  "potentialClients": [
    {
      "name": "Nome descritivo do perfil (ex: 'Maria Empreendedora', 'João Executivo')",
      "description": "Descrição breve de quem é essa pessoa",
      "demographics": {
        "age": "faixa etária",
        "gender": "gênero predominante",
        "location": "localização típica",
        "income": "faixa de renda",
        "occupation": "ocupação/profissão"
      },
      "psychographics": {
        "values": ["valores importantes"],
        "interests": ["interesses"],
        "lifestyle": "estilo de vida",
        "goals": ["objetivos principais"],
        "frustrations": ["frustrações atuais"]
      },
      "buyingMotivation": "Por que essa pessoa compraria?",
      "mainPain": "Dor principal que esse cliente tem"
    }
  ]
}

Gere entre 8 a 12 perfis de clientes potenciais, variando desde os mais óbvios até os menos explorados.
Seja criativo e pense em nichos adjacentes que também poderiam se beneficiar.
`;

// ===== PROMPT DE GERAÇÃO DE DORES POR CLIENTES SELECIONADOS =====
export const generatePainsBySelectedClientsPrompt = (businessAnalysis: string, selectedClients: string) => `
Você é um especialista em copywriting e psicologia do consumidor.

Com base na análise do negócio e nos clientes ideais SELECIONADOS pelo usuário, gere dores em 3 categorias:

Análise do Negócio: ${businessAnalysis}

Clientes Ideais Selecionados: ${selectedClients}

Gere dores específicas para ESSES clientes selecionados:

1. **DORES PRINCIPAIS** (5-7 dores)
   - São as dores mais evidentes e urgentes
   - Problemas que o cliente já sabe que tem
   - Dores que ele busca ativamente resolver
   - Muito conteúdo já existe sobre isso

2. **DORES SECUNDÁRIAS** (5-7 dores)
   - Dores relacionadas mas menos óbvias
   - Problemas que o cliente reconhece quando apontados
   - Consequências das dores principais
   - Algum conteúdo existe, mas não é saturado

3. **DORES INEXPLORADAS** (5-7 dores)
   - Dores que o cliente nem sabe que tem
   - Problemas que poucos criadores abordam
   - Oportunidades de conteúdo diferenciado
   - Pouco ou nenhum conteúdo sobre isso nas redes
   - GRANDE OPORTUNIDADE para se destacar

Retorne um JSON com:
{
  "primary": [
    {"pain": "dor principal", "description": "explicação detalhada de por que isso dói", "contentOpportunity": "como usar em conteúdo"}
  ],
  "secondary": [
    {"pain": "dor secundária", "description": "explicação detalhada", "contentOpportunity": "como usar em conteúdo"}
  ],
  "unexplored": [
    {"pain": "dor inexplorada", "description": "explicação detalhada", "contentOpportunity": "por que é uma oportunidade"}
  ]
}

IMPORTANTE: As dores devem ser ESPECÍFICAS para os clientes selecionados, não genéricas.
Use a linguagem que esses clientes usariam para descrever seus problemas.
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
// REGRA FIXA: A foto de referência é usada como originalImages para manter consistência física
// As fotos devem parecer selfies/fotos reais tiradas pelo próprio influenciador (primeira pessoa)
export const generateInfluencerImagePrompt = (params: {
  referenceDescription: string;
  slideText: string;
  context: string;
  type: "normal" | "transformation";
  isBeforeImage?: boolean;
}) => `
Gere uma foto em PRIMEIRA PESSOA como se fosse tirada pelo próprio influenciador.

A IMAGEM DE REFERÊNCIA ANEXADA é a pessoa que deve aparecer na foto. Use-a como base para manter consistência física absoluta.

Contexto da foto: ${params.context}
Texto que será sobreposto: "${params.slideText}"
${params.type === "transformation" ? `Tipo: ${params.isBeforeImage ? "ANTES da transformação" : "DEPOIS da transformação"}` : ""}

REGRAS PRIMORDIAIS (NÃO ALTERAR):
1. IMAGEM REAL SEM NENHUM TEXTO - Não inclua letras, palavras, números ou qualquer elemento textual
2. FOTO EM PRIMEIRA PESSOA - Como se o influenciador estivesse tirando a própria foto (selfie, foto no espelho, foto com braço estendido, ou foto tirada por amigo próximo)
3. CONSISTÊNCIA FÍSICA - A pessoa na foto DEVE ser idêntica à imagem de referência (mesmas características físicas, rosto, corpo, cabelo)
4. NATURALIDADE - A foto deve parecer real, espontânea, como posts reais de influenciadores
5. QUALIDADE - Foto de alta qualidade mas natural, não muito produzida

Estilo da foto:
- Selfie casual ou foto tirada por amigo
- Iluminação natural ou de ambiente
- Enquadramento típico de Instagram (4:5)
- Cenário condizente com o contexto
- Expressão facial natural e autêntica
${params.type === "transformation" && params.isBeforeImage ? "- Mostrar a pessoa ANTES da transformação (expressão mais neutra ou preocupada)" : ""}
${params.type === "transformation" && !params.isBeforeImage ? "- Mostrar a pessoa DEPOIS da transformação (expressão confiante e feliz)" : ""}

Lembre-se: Esta foto será postada como se fosse do próprio influenciador, então deve parecer 100% autêntica e em primeira pessoa.
`;
