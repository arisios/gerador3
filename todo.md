# Gerador 3 - TODO

## Estrutura Base
- [x] Configurar tema visual (cores roxo/escuro, fonte moderna)
- [x] Configurar index.css com variáveis de tema
- [x] Configurar App.tsx com rotas

## Banco de Dados
- [x] Schema: users, projects, idealClients, pains, contents, slides, influencers, trends, virals
- [x] Funções de DB para todas as entidades

## Templates de Copywriting
- [x] 19 templates de carrossel
- [x] 15 templates de imagem única
- [x] 12 templates de vídeo
- [x] 8 templates de soft sell (influenciadores)
- [x] 8 tipos de hooks virais
- [x] Fórmulas: AIDA, PAS, BAB, FAB, 4U's

## Templates Visuais (estilo @brandsdecoded__)
- [x] Lifestyle Editorial
- [x] Celebridade/Autoridade
- [x] Provocativo/Pergunta
- [x] Tech/Ciência
- [x] Case de Marca
- [x] Dados/Mercado
- [x] Tendência/Gen Z
- [x] Cultura Pop
- [x] Split Screen
- [x] Minimalista
- [x] Full Bleed
- [x] Card/Moldura

## API Routes
- [x] Projetos: create, list, get, analyzeSource, analyzePains, savePains
- [x] Conteúdo: generate, list, get, update, delete
- [x] Imagens: generate, regenerate, proxy
- [x] Influenciadores: create, createByPhoto, list, get, generateContent
- [x] Trends: collect (AI-powered), list, getAlerts - CORRIGIDO: usa response_format para JSON válido
- [x] Virals: collect (AI-powered), list - CORRIGIDO: usa response_format para JSON válido

## Frontend - Páginas
- [x] Home (landing)
- [x] Dashboard
- [x] ProjectCreate (wizard 4 etapas)
- [x] ProjectDetail
- [x] ContentEdit (edição de conteúdo)
- [x] ImageEdit
- [x] VideoEdit
- [x] History
- [x] Influencers
- [x] InfluencerCreate
- [x] InfluencerCreateByPhoto
- [x] InfluencerDetail
- [x] InfluencerContentCreate
- [x] InfluencerContentEdit
- [x] Trends
- [x] Virals

## Componentes
- [x] SlideComposer (3 abas: Básico, Cores, Avançado)
- [ ] SlideTemplatePreview
- [ ] ImageLightbox
- [ ] ImageLightboxWithEdit
- [ ] QuantitySelector
- [ ] PromptEditorModal

## Sistema de Download
- [x] Proxy de imagens (CORS)
- [x] Canvas 1080x1350
- [x] Download com texto (sombra, overlay)
- [x] Download sem texto
- [x] Download em lote

## Sistema de Padrão
- [x] Salvar estilo no localStorage
- [x] Carregar padrão salvo
- [x] Aplicar automaticamente

## Configurações de Batch
- [ ] Tipo: carrossel, imagem, vídeo
- [ ] Template selecionável
- [ ] Quantidade de posts
- [ ] Clickbait on/off
- [ ] Objetivo: venda, autoridade, crescimento
- [ ] Pessoa gramatical: 1ª, 2ª, 3ª

## Influenciadores Virtuais - Consistência Física
- [x] Criação por Descrição: gerar 3 fotos para escolha
- [x] Criação por Descrição: interface para escolher 1 das 3 fotos
- [x] Criação por Foto: upload de foto como referência
- [x] Salvar referenceImageUrl no influenciador
- [x] Geração de conteúdo: usar referenceImageUrl como originalImages
- [x] Garantir consistência física em todas as gerações

## Testes Realizados (18/12/2024)
- [x] Download Com Texto - funcionando (2.1MB, 1080x1350)
- [x] Download Sem Texto - funcionando
- [x] Consistência física de influenciadores - funcionando
- [x] Geração de 3 fotos por descrição - funcionando
- [x] Seleção de foto de referência - funcionando
- [x] Geração de imagem usando referência - funcionando
- [x] Trends Google e TikTok - funcionando (15 trends cada)
- [x] Virais ViralHog - funcionando (12 virais)
- [x] Criação de projeto - funcionando
- [x] Geração de conteúdo para projeto - funcionando

## Regras Gerais para Imagens Geradas por IA
- [x] Componente ImageLightbox: abre imagem em tela cheia ao clicar
- [x] Botão Regenerar: gera nova imagem com mesmo prompt ou editando
- [x] Botão Excluir: deleta a imagem
- [x] Botão Baixar: download da imagem
- [x] Salvar imagem no banco de referência correspondente
- [x] Prompt com instrução "imagem real sem texto" (regra primordial)
- [x] Mostrar prompt usado como orientação para upload no slide
- [x] Integrar lightbox em ContentEdit
- [x] Integrar lightbox em InfluencerContentEdit
- [x] Integrar lightbox em InfluencerCreate (fotos de referência)

## Bugs Reportados (18/12/2024)
- [x] Erro "Cannot update a component (Home)" - setState durante render - CORRIGIDO: useEffect
- [x] Download de todos não funciona no mobile - mudar de ZIP para PNG sequencial - CORRIGIDO
- [x] App não é PWA - configurar manifest, service worker, icons - CORRIGIDO
- [x] Interface não otimizada para mobile - CORRIGIDO: CSS mobile-first
- [x] Bug: Imagem fica esticada no download - corrigido com cover ratio
- [x] Bug: Prompt de influenciador deve gerar fotos em primeira pessoa (selfies reais) - CORRIGIDO

## Novo Fluxo - Implementação (18/12/2024)

### Regras Gerais
- [ ] Todo conteúdo pode ser editado
- [ ] Toda imagem tem prompt editável como referência + botão salvar

### Fluxo A - Projeto
- [x] Escolher fonte: Dores OU Viral OU Trends
- [x] Seleção múltipla de dores/trends/virais
- [x] Escolher tipo de conteúdo + quantidade para cada seleção
- [x] Exemplo: Dor 1 → Carrossel Antes/Depois → 5 conteúdos

### Fluxo B - Influenciador
- [x] Após criar influenciador, gerar automaticamente fotos de perfil
- [x] Foto de perfil para rede social
- [x] Foto "antes" e "atual" (transformação)
- [x] Outras fotos para montar o perfil
- [x] Conteúdos: templates padrão + dores + trends + virais
- [x] Edição de conteúdo igual aos projetos

## Fluxo de Criação por Link
- [x] Opção de entrada por link (Instagram, TikTok, YouTube, site)
- [x] IA analisa o link profundamente
- [x] IA retorna lista de possíveis clientes ideais
- [x] Usuário seleciona quais clientes são ideais
- [x] IA analisa novamente com base nos clientes selecionados
- [x] IA gera 3 categorias de dores:
  - [x] Dores Principais (mais evidentes)
  - [x] Dores Secundárias (importantes mas menos óbvias)
  - [x] Dores Inexploradas (pouco conteúdo, oportunidade)

## Simplificação do Dashboard (18/12/2024)
- [x] Remover stats, trends, virais, histórico do Dashboard
- [x] Manter apenas 2 opções: Projetos e Influenciadores
- [x] Projetos → Link ou Descrição
- [x] Influenciadores → Foto ou Descrição

## Simplificação do Fluxo por Link (18/12/2024)
- [x] Remover campo de nome do projeto no fluxo por link
- [x] Usar o link como nome do projeto automaticamente (extrai domínio ou @username)

## Melhorias de Imagem (18/12/2024)
- [x] Botão "Gerar Todas as Imagens" no conteúdo (carrossel)
- [x] Prompt visível e editável ao clicar na imagem
- [x] Prompt serve como referência para upload ou edição
- [x] Opção de upload de imagem própria

## Upload de Foto no Influenciador (18/12/2024)
- [x] Permitir upload de foto própria na criação de influenciador por foto
- [x] Usar a foto como referência visual para a IA
- [x] Rota genérica de upload de imagem para S3

## Templates Visuais BrandsDecoded (18/12/2024)
- [x] Criar componente SlidePreview que aplica os 12 templates visuais
- [x] Permitir selecionar template visual ao criar conteúdo
- [x] Aplicar estilos (overlay, posição do texto, cores neon) automaticamente
- [x] Preview em tempo real do template selecionado
- [x] Seletor de cor de destaque (8 cores neon)

## Mais Templates e Template Automático (18/12/2024)
- [x] Adicionar mais variedades de templates visuais (24 templates)
- [x] Implementar seleção automática de template com IA
- [x] IA analisa texto/conteúdo e escolhe template adequado
- [x] Opção "Automático" no seletor de templates
- [x] Filtro por categoria de template
- [x] Botão "Ver mais" para expandir lista de templates

## Templates Visuais Completos (18/12/2024)
- [x] Criar 20+ templates com layouts profissionais completos (24 templates)
- [x] Layouts variados: split horizontal, split vertical, card, full bleed, minimal, bold, editorial
- [x] Design diagramado com posicionamento fixo de texto
- [x] Sistema de paleta de cores customizável (12 paletas)
- [x] Kit de marca: upload de logo para incluir nos templates
- [x] Download renderizado em PNG/JPG com template aplicado
- [x] Template automático varia entre slides do carrossel (IA escolhe templates diferentes)

## Extração Automática de Logo (18/12/2024)
- [x] Ao analisar link (Instagram, TikTok, etc.), identificar imagem de perfil
- [x] Usar IA para analisar se é logo ou foto pessoal
- [x] Se for logo, indicar detecção e razão
- [x] Mostrar notificação de logo detectada no fluxo de criação
- [x] Indicar no step final que logo foi detectada para configurar no kit de marca

## Refatoração de Templates Visuais (18/12/2024)
- [x] Cada template com textStyle completo (posição, alinhamento, fonte, cor, sombra, área máxima)
- [x] SlideRenderer com moldura/quadro real (CSS object-fit: cover, overflow: hidden)
- [x] Imagem fica contida no quadro, pode ser ajustada para enquadrar
- [x] Salvar designTemplateId por slide no banco de dados
- [x] Template não muda ao navegar entre slides
- [x] Reforçar prompt: imagens SEM TEXTO, apenas visual (6 regras obrigatórias)
- [x] Corrigir bug do texto duplicado - verificado e não há duplicação no código
- [x] Formatação de texto automática baseada no template selecionado

## Correção de Variedade de Templates (18/12/2024)
- [x] Verificar IDs de templates no fallback da rota selectVariedTemplates
- [x] Adicionar botão "Automático para Todo Carrossel" no ContentEdit
- [x] Garantir carregamento de designTemplateId e colorPaletteId por slide
- [x] Aplicar cores da paleta selecionada no SlideRenderer
- [x] Testar variedade de templates no carrossel

## Refazer Variedade de Templates - SIMPLES (18/12/2024)
- [x] Verificar estado atual do botão "Automático para Todo Carrossel"
- [x] Garantir que cada slide recebe um template DIFERENTE
- [x] Garantir que cada slide recebe uma COR DIFERENTE da paleta
- [x] Testar e validar variedade visual - CONFIRMADO:
  - Slide 1: Full + Texto Central + Roxo Escuro
  - Slide 2: Storytelling + Verde Escuro
  - Slide 3: Declaração Bold + Azul Escuro
  - Cada slide com template E cor diferentes

## Correções Urgentes (18/12/2024)
- [x] Cores não estão aparecendo visualmente diferentes nos slides - CORRIGIDO: paletas agora têm fundos coloridos distintos
- [x] Permitir edição de texto no SlideComposer para templates automáticos - IMPLEMENTADO: botão "Editar Visual" abre o SlideComposer

## Bug SlideComposer (18/12/2024)
- [x] SlideComposer não respeita o layout do template selecionado - CORRIGIDO: agora usa imageFrame do template
