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
