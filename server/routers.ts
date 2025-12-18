import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import * as db from "./db";
import * as prompts from "./prompts";
import { carouselTemplates, imageTemplates, videoTemplates, softSellTemplates, hookTypes, copyFormulas } from "@shared/templates";
import { visualTemplates, accentColors, stylePresets } from "@shared/visualTemplates";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== TEMPLATES =====
  templates: router({
    getCarouselTemplates: publicProcedure.query(() => carouselTemplates),
    getImageTemplates: publicProcedure.query(() => imageTemplates),
    getVideoTemplates: publicProcedure.query(() => videoTemplates),
    getSoftSellTemplates: publicProcedure.query(() => softSellTemplates),
    getHookTypes: publicProcedure.query(() => hookTypes),
    getCopyFormulas: publicProcedure.query(() => copyFormulas),
    getVisualTemplates: publicProcedure.query(() => visualTemplates),
    getAccentColors: publicProcedure.query(() => accentColors),
    getStylePresets: publicProcedure.query(() => stylePresets),
  }),

  // ===== PROJECTS =====
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProjectsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const idealClients = await db.getIdealClientsByProject(input.id);
        const pains = await db.getPainsByProject(input.id);
        return { ...project, idealClients, pains };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        sourceType: z.enum(["site", "instagram", "tiktok", "description"]),
        sourceUrl: z.string().optional(),
        sourceDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          sourceType: input.sourceType,
          sourceUrl: input.sourceUrl || null,
          sourceDescription: input.sourceDescription || null,
        });
        return { id: projectId };
      }),

    analyze: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const source = project.sourceUrl || project.sourceDescription || "";
        const analysisPrompt = prompts.analyzeProjectPrompt(source, project.sourceType);
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em marketing digital e análise de negócios. Retorne apenas JSON válido." },
            { role: "user", content: analysisPrompt }
          ]
        });

        const analysisText = (typeof response.choices[0]?.message?.content === 'string' ? response.choices[0]?.message?.content : JSON.stringify(response.choices[0]?.message?.content)) || "{}";
        let analysis;
        try {
          analysis = JSON.parse(analysisText);
        } catch {
          analysis = { raw: analysisText };
        }

        await db.updateProject(input.id, { analysis });

        // Generate ideal clients
        const clientsPrompt = prompts.generateIdealClientsPrompt(JSON.stringify(analysis));
        const clientsResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em personas e público-alvo. Retorne apenas JSON válido." },
            { role: "user", content: clientsPrompt }
          ]
        });

        const clientsText = (typeof clientsResponse.choices[0]?.message?.content === 'string' ? clientsResponse.choices[0]?.message?.content : JSON.stringify(clientsResponse.choices[0]?.message?.content)) || "[]";
        console.log("[Analyze] Clients raw response:", clientsText.substring(0, 500));
        let clients;
        try {
          // Try to extract JSON from markdown code blocks
          let jsonStr = clientsText;
          const jsonMatch = clientsText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }
          clients = JSON.parse(jsonStr);
        } catch (e) {
          console.error("[Analyze] Failed to parse clients:", e);
          clients = [];
        }
        console.log("[Analyze] Parsed clients count:", Array.isArray(clients) ? clients.length : 0);

        if (Array.isArray(clients) && clients.length > 0) {
          await db.createIdealClients(input.id, clients);
          console.log("[Analyze] Saved ideal clients");
        }

        // Generate pains
        const idealClientsData = await db.getIdealClientsByProject(input.id);
        const painsPrompt = prompts.generatePainsPrompt(JSON.stringify(analysis), JSON.stringify(idealClientsData));
        const painsResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em copywriting e dores do cliente. Retorne apenas JSON válido." },
            { role: "user", content: painsPrompt }
          ]
        });

        const painsText = (typeof painsResponse.choices[0]?.message?.content === 'string' ? painsResponse.choices[0]?.message?.content : JSON.stringify(painsResponse.choices[0]?.message?.content)) || "{}";
        console.log("[Analyze] Pains raw response:", painsText.substring(0, 500));
        let painsData;
        try {
          // Try to extract JSON from markdown code blocks
          let jsonStr = painsText;
          const jsonMatch = painsText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }
          painsData = JSON.parse(jsonStr);
        } catch (e) {
          console.error("[Analyze] Failed to parse pains:", e);
          painsData = { primary: [], secondary: [], unexplored: [] };
        }
        console.log("[Analyze] Parsed pains:", painsData.primary?.length || 0, painsData.secondary?.length || 0, painsData.unexplored?.length || 0);

        const allPains: { level: "primary" | "secondary" | "unexplored"; pain: string; description: string }[] = [];
        if (painsData.primary) {
          painsData.primary.forEach((p: { pain: string; description: string }) => {
            allPains.push({ level: "primary", pain: p.pain, description: p.description });
          });
        }
        if (painsData.secondary) {
          painsData.secondary.forEach((p: { pain: string; description: string }) => {
            allPains.push({ level: "secondary", pain: p.pain, description: p.description });
          });
        }
        if (painsData.unexplored) {
          painsData.unexplored.forEach((p: { pain: string; description: string }) => {
            allPains.push({ level: "unexplored", pain: p.pain, description: p.description });
          });
        }

        if (allPains.length > 0) {
          await db.createPains(input.id, allPains);
        }

        return { success: true, analysis };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ===== CONTENT =====
  content: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return db.getContentsByProject(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const content = await db.getContentById(input.id);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const slides = await db.getSlidesByContent(input.id);
        return { ...content, slides };
      }),

    generate: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        type: z.enum(["carousel", "image", "video"]),
        template: z.string(),
        quantity: z.number().min(1).max(10).default(1),
        painId: z.number().optional(),
        pain: z.string().optional(),
        objective: z.enum(["sale", "authority", "growth"]).default("authority"),
        person: z.enum(["first", "second", "third"]).default("second"),
        clickbait: z.boolean().default(false),
        hookType: z.string().optional(),
        formula: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const analysis = project.analysis as { niche?: string } | null;
        const niche = analysis?.niche || "geral";
        const batchId = nanoid();

        const templateInfo = carouselTemplates.find(t => t.id === input.template) ||
                           imageTemplates.find(t => t.id === input.template) ||
                           videoTemplates.find(t => t.id === input.template);

        const contentIds: number[] = [];

        for (let i = 0; i < input.quantity; i++) {
          const contentPrompt = prompts.generateContentPrompt({
            template: input.template,
            templateStructure: (templateInfo as { structure?: string[] })?.structure || [],
            pain: input.pain || "dor genérica",
            niche,
            objective: input.objective,
            person: input.person,
            clickbait: input.clickbait,
            hookType: input.hookType,
            formula: input.formula,
          });

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Você é um especialista em criação de conteúdo viral para redes sociais. Retorne apenas JSON válido." },
              { role: "user", content: contentPrompt }
            ]
          });

          const contentText = (typeof response.choices[0]?.message?.content === 'string' ? response.choices[0]?.message?.content : JSON.stringify(response.choices[0]?.message?.content)) || "{}";
          console.log("[Content Generate] Raw response:", contentText.substring(0, 500));
          let contentData;
          try {
            // Try to extract JSON from markdown code blocks
            let jsonStr = contentText;
            const jsonMatch = contentText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1].trim();
            }
            contentData = JSON.parse(jsonStr);
          } catch (e) {
            console.error("[Content Generate] Failed to parse:", e);
            contentData = { title: "Conteúdo gerado", slides: [] };
          }
          console.log("[Content Generate] Parsed slides count:", contentData.slides?.length || 0);

          const contentId = await db.createContent({
            projectId: input.projectId,
            userId: ctx.user.id,
            type: input.type,
            template: input.template,
            title: contentData.title,
            description: contentData.description,
            hook: contentData.hook,
            hookType: input.hookType || null,
            formula: input.formula || null,
            objective: input.objective,
            person: input.person,
            clickbait: input.clickbait,
            status: "generating",
            batchId,
          });

          if (contentData.slides && Array.isArray(contentData.slides)) {
            const slidesData = contentData.slides.map((s: { order: number; text: string }, idx: number) => ({
              order: s.order || idx + 1,
              text: s.text,
              visualTemplate: visualTemplates[0]?.id || "lifestyle-editorial",
            }));
            await db.createSlides(contentId, slidesData);
          }

          await db.updateContent(contentId, { status: "ready" });
          contentIds.push(contentId);
        }

        return { batchId, contentIds };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        hook: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const content = await db.getContentById(input.id);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.updateContent(input.id, {
          title: input.title,
          description: input.description,
          hook: input.hook,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const content = await db.getContentById(input.id);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteContent(input.id);
        return { success: true };
      }),
  }),

  // ===== SLIDES =====
  slides: router({
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        text: z.string().optional(),
        imageUrl: z.string().optional(),
        imagePrompt: z.string().optional(),
        selectedImageIndex: z.number().optional(),
        visualTemplate: z.string().optional(),
        style: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateSlide(input.id, {
          text: input.text,
          imageUrl: input.imageUrl,
          imagePrompt: input.imagePrompt,
          selectedImageIndex: input.selectedImageIndex,
          visualTemplate: input.visualTemplate,
          style: input.style,
        });
        return { success: true };
      }),

    generateImage: protectedProcedure
      .input(z.object({
        slideId: z.number(),
        prompt: z.string().optional(),
        quantity: z.number().min(1).max(4).default(1),
      }))
      .mutation(async ({ input }) => {
        const imageUrls: string[] = [];
        const basePrompt = input.prompt || "Professional Instagram image, high quality, editorial style";
        const fullPrompt = `${basePrompt}\n\nREGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem. Deve ser uma FOTOGRAFIA REAL, não ilustração.`;
        
        for (let i = 0; i < input.quantity; i++) {
          const result = await generateImage({
            prompt: fullPrompt,
          });
          if (result.url) {
            imageUrls.push(result.url);
          }
        }

        // Get current slide to update image bank
        const currentSlide = await db.getSlideById(input.slideId);
        const currentBank = (currentSlide?.imageBank as string[]) || [];
        const newBank = [...currentBank, ...imageUrls];
        
        await db.updateSlide(input.slideId, {
          imageBank: newBank,
          imageUrl: imageUrls[0] || undefined,
          imagePrompt: input.prompt,
        });

        return { imageUrls };
      }),
  }),

  // ===== INFLUENCERS =====
  influencers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getInfluencersByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const influencer = await db.getInfluencerById(input.id);
        if (!influencer || influencer.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const contents = await db.getInfluencerContentsByInfluencer(input.id);
        return { ...influencer, contents };
      }),

    generateReferencePhotos: protectedProcedure
      .input(z.object({
        name: z.string(),
        niche: z.string(),
        description: z.string(),
        type: z.enum(["normal", "transformation"]).default("normal"),
      }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `Foto profissional para Instagram de um influenciador digital.
Nome: ${input.name}
Nicho: ${input.niche}
Descrição física: ${input.description}

REGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem.

A foto deve:
- Ser uma FOTOGRAFIA REAL, não ilustração ou arte digital
- Parecer natural e autêntica
- Ter qualidade profissional de fotografia
- Mostrar a pessoa de forma atraente e confiável
- Ser adequada para perfil de Instagram
- Formato retrato 4:5
- Iluminação natural e ambiente agradável
- NÃO CONTER ABSOLUTAMENTE NENHUM TEXTO, LETRA, PALAVRA OU NÚMERO`;

        const photos: string[] = [];
        for (let i = 0; i < 3; i++) {
          try {
            const result = await generateImage({ prompt });
            if (result.url) {
              photos.push(result.url);
            }
          } catch (e) {
            console.error("Erro ao gerar foto", i, e);
          }
        }
        return { photos };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        niche: z.string().optional(),
        type: z.enum(["normal", "transformation"]).default("normal"),
        description: z.string().optional(),
        referenceImageUrl: z.string().optional(),
        beforeImageUrl: z.string().optional(),
        afterImageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createInfluencer({
          userId: ctx.user.id,
          name: input.name,
          niche: input.niche || null,
          type: input.type,
          description: input.description || null,
          referenceImageUrl: input.referenceImageUrl || null,
          beforeImageUrl: input.beforeImageUrl || null,
          afterImageUrl: input.afterImageUrl || null,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const influencer = await db.getInfluencerById(input.id);
        if (!influencer || influencer.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.deleteInfluencer(input.id);
        return { success: true };
      }),

    getContent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const content = await db.getInfluencerContentById(input.id);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const slides = await db.getInfluencerSlidesByContent(input.id);
        return { ...content, slides };
      }),

    generateContent: protectedProcedure
      .input(z.object({
        influencerId: z.number(),
        template: z.string(),
        product: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const influencer = await db.getInfluencerById(input.influencerId);
        if (!influencer || influencer.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `Você é um especialista em marketing de influência e soft sell.
Crie conteúdo para o influenciador virtual ${influencer.name}.
Descrição: ${influencer.description || "Influenciador digital"}
Template: ${input.template}
${input.product ? `Produto/Serviço: ${input.product}` : "Conteúdo de autoridade sem venda direta"}

O conteúdo deve parecer natural e autêntico, não vendedor demais.`
            },
            { role: "user", content: `Gere um conteúdo de carrossel no formato ${input.template} para Instagram.` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "influencer_content",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título do conteúdo" },
                  description: { type: "string", description: "Descrição para legenda" },
                  hook: { type: "string", description: "Frase de gancho inicial" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order: { type: "integer", description: "Ordem do slide" },
                        text: { type: "string", description: "Texto do slide (máx 100 caracteres)" }
                      },
                      required: ["order", "text"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["title", "description", "hook", "slides"],
                additionalProperties: false
              }
            }
          }
        });

        const contentText = response.choices[0]?.message?.content || "{}";
        let contentData;
        try {
          contentData = JSON.parse(typeof contentText === 'string' ? contentText : JSON.stringify(contentText));
        } catch {
          contentData = { title: "Conteúdo de influenciador", description: "", hook: "", slides: [] };
        }

        const contentId = await db.createInfluencerContent({
          influencerId: input.influencerId,
          userId: ctx.user.id,
          type: "carousel",
          template: input.template,
          title: contentData.title || "Conteúdo",
          description: contentData.description || null,
          hook: contentData.hook || null,
          status: "ready",
        });

        if (contentData.slides && Array.isArray(contentData.slides)) {
          const slidesData = contentData.slides.map((s: { order?: number; text: string }, idx: number) => ({
            order: s.order || idx + 1,
            text: s.text || "",
          }));
          if (slidesData.length > 0) {
            await db.createInfluencerSlides(contentId, slidesData);
          }
        }

        return { contentId };
      }),

    generateSlideImage: protectedProcedure
      .input(z.object({
        slideId: z.number(),
        influencerId: z.number(),
        slideText: z.string(),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const influencer = await db.getInfluencerById(input.influencerId);
        if (!influencer || influencer.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (!influencer.referenceImageUrl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Influenciador não tem imagem de referência" });
        }

        const prompt = `Foto profissional para Instagram de um influenciador digital.
Nicho: ${influencer.niche || "lifestyle"}
Contexto do slide: ${input.slideText}
${input.context ? `Contexto adicional: ${input.context}` : ""}

REGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem.

A foto deve:
- Ser uma FOTOGRAFIA REAL, não ilustração ou arte digital
- Manter a MESMA pessoa da imagem de referência (mesmas características físicas)
- Parecer natural e autêntica
- Ter qualidade profissional
- Ser adequada para Instagram (4:5)
- Combinar com o contexto do conteúdo
- NÃO CONTER ABSOLUTAMENTE NENHUM TEXTO, LETRA, PALAVRA OU NÚMERO`;

        const result = await generateImage({
          prompt,
          originalImages: [{
            url: influencer.referenceImageUrl,
            mimeType: "image/jpeg"
          }]
        });

        if (result.url) {
          await db.updateInfluencerSlide(input.slideId, { imageUrl: result.url });
        }

        return { imageUrl: result.url };
      }),

    generateAllSlideImages: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        influencerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const influencer = await db.getInfluencerById(input.influencerId);
        if (!influencer || influencer.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (!influencer.referenceImageUrl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Influenciador não tem imagem de referência" });
        }

        const slides = await db.getInfluencerSlidesByContent(input.contentId);
        const results: { slideId: number; imageUrl?: string }[] = [];

        for (const slide of slides) {
          const prompt = `Foto profissional para Instagram de um influenciador digital.
Nicho: ${influencer.niche || "lifestyle"}
Contexto do slide: ${slide.text}

REGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem.

A foto deve:
- Ser uma FOTOGRAFIA REAL, não ilustração ou arte digital
- Manter a MESMA pessoa da imagem de referência (mesmas características físicas)
- Parecer natural e autêntica
- Ter qualidade profissional
- Ser adequada para Instagram (4:5)
- NÃO CONTER ABSOLUTAMENTE NENHUM TEXTO, LETRA, PALAVRA OU NÚMERO`;

          try {
            const result = await generateImage({
              prompt,
              originalImages: [{
                url: influencer.referenceImageUrl,
                mimeType: "image/jpeg"
              }]
            });

            if (result.url) {
              await db.updateInfluencerSlide(slide.id, { imageUrl: result.url });
              results.push({ slideId: slide.id, imageUrl: result.url });
            }
          } catch (e) {
            console.error("Erro ao gerar imagem do slide", slide.id, e);
            results.push({ slideId: slide.id });
          }
        }

        return { results };
      }),
  }),

  // ===== TRENDS =====
  trends: router({
    list: protectedProcedure
      .input(z.object({ source: z.enum(["google", "tiktok"]).optional(), limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getTrendsByUser(ctx.user.id, input?.source, input?.limit);
      }),

    collect: protectedProcedure
      .input(z.object({ source: z.enum(["google", "tiktok"]) }))
      .mutation(async ({ ctx, input }) => {
        // Gerar trends diretamente com análise usando response_format
        const sourcePrompt = input.source === "google" 
          ? `Liste 15 tendências de busca do Google Brasil em dezembro de 2024.
Inclua: notícias, esportes, entretenimento, celebridades, tecnologia, comportamento.`
          : `Liste 15 tendências do TikTok Brasil em dezembro de 2024.
Inclua: sons virais, hashtags, desafios, danças, formatos de vídeo, trends de humor.`;

        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `Você é um especialista em tendências virais do Brasil.
Gere tendências REALISTAS e ATUAIS baseadas no seu conhecimento.
Para cada tendência, analise e classifique.` 
            },
            { role: "user", content: sourcePrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "trends_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  trends: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome da tendência" },
                        category: { type: "string", description: "Categoria: Moda, Tech, Fitness, Humor, Música, Entretenimento, Esportes, Política, Economia, Lifestyle" },
                        classification: { type: "string", enum: ["emerging", "rising", "peak", "declining"], description: "Fase da tendência" },
                        viralProbability: { type: "number", description: "Probabilidade de viralizar 0-100" },
                        suggestedNiches: { type: "array", items: { type: "string" }, description: "Nichos que podem aproveitar" }
                      },
                      required: ["name", "category", "classification", "viralProbability", "suggestedNiches"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["trends"],
                additionalProperties: false
              }
            }
          }
        });

        let trendsData: { trends: Array<{ name: string; category: string; classification: string; viralProbability: number; suggestedNiches: string[] }> } = { trends: [] };
        try {
          const content = response.choices[0]?.message?.content;
          if (typeof content === 'string') {
            trendsData = JSON.parse(content);
          }
        } catch (e) {
          console.error("Failed to parse trends:", e);
          return { count: 0 };
        }

        if (trendsData.trends && trendsData.trends.length > 0) {
          const trendsToSave = trendsData.trends.map((t) => ({
            source: input.source,
            name: t.name,
            category: t.category || null,
            classification: t.classification as "emerging" | "rising" | "peak" | "declining" || null,
            viralProbability: t.viralProbability || null,
            suggestedNiches: t.suggestedNiches || null,
          }));
          await db.createTrends(ctx.user.id, trendsToSave);
          return { count: trendsToSave.length };
        }

        return { count: 0 };
      }),
  }),

  // ===== VIRALS =====
  virals: router({
    list: protectedProcedure
      .input(z.object({ source: z.enum(["viralhog", "reddit"]).optional(), limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getViralsByUser(ctx.user.id, input?.source, input?.limit);
      }),

    collect: protectedProcedure
      .input(z.object({ source: z.enum(["viralhog", "reddit"]) }))
      .mutation(async ({ ctx, input }) => {
        const sourcePrompt = input.source === "viralhog"
          ? `Analise conteúdos virais recentes do ViralHog (vídeos virais de situações engraçadas, animais, fails, momentos incríveis).
Identifique 12 tipos de conteúdo viral que estão em alta em dezembro de 2024.
Inclua: vídeos de animais, fails engraçados, momentos fofos, situações inesperadas, reações humorísticas.`
          : `Analise conteúdos virais recentes do Reddit (posts populares de subreddits como r/funny, r/aww, r/nextfuckinglevel, r/MadeMeSmile, r/brasil).
Identifique 12 tipos de conteúdo viral que estão em alta em dezembro de 2024.
Inclua: memes, histórias engraçadas, vídeos satisfatórios, discussões populares, conteúdo brasileiro.`;

        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `Você é um especialista em conteúdo viral da internet.
Gere conteúdos virais REALISTAS baseados em padrões atuais.
Para cada viral, sugira nichos que podem adaptar e ângulos de abordagem.` 
            },
            { role: "user", content: sourcePrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "virals_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  virals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título/descrição do conteúdo viral" },
                        category: { type: "string", description: "Categoria: Humor, Animais, Fails, Inspiração, Satisfatório, Memes, Lifestyle, Tech" },
                        viralProbability: { type: "number", description: "Probabilidade de viralizar 0-100" },
                        suggestedNiches: { type: "array", items: { type: "string" }, description: "Nichos que podem adaptar" },
                        suggestedAngles: { type: "array", items: { type: "string" }, description: "Ângulos de adaptação" }
                      },
                      required: ["title", "category", "viralProbability", "suggestedNiches", "suggestedAngles"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["virals"],
                additionalProperties: false
              }
            }
          }
        });

        let viralsData: { virals: Array<{ title: string; category: string; viralProbability: number; suggestedNiches: string[]; suggestedAngles: string[] }> } = { virals: [] };
        try {
          const content = response.choices[0]?.message?.content;
          if (typeof content === 'string') {
            viralsData = JSON.parse(content);
          }
        } catch (e) {
          console.error("Failed to parse virals:", e);
          return { count: 0 };
        }

        if (viralsData.virals && viralsData.virals.length > 0) {
          const viralsToSave = viralsData.virals.map((v) => ({
            source: input.source,
            title: v.title,
            category: v.category || null,
            viralProbability: v.viralProbability || null,
            suggestedNiches: v.suggestedNiches || null,
            suggestedAngles: v.suggestedAngles || null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          }));
          await db.createVirals(ctx.user.id, viralsToSave);
          return { count: viralsToSave.length };
        }

        return { count: 0 };
      }),
  }),

  // ===== SETTINGS =====
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        defaultStyle: z.any().optional(),
        trendAlertEnabled: z.boolean().optional(),
        trendAlertThreshold: z.number().optional(),
        trendAlertCategories: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ===== STATS/HISTORY =====
  stats: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getContentStats(ctx.user.id);
    }),

    recentContents: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return db.getRecentContents(ctx.user.id, input.limit);
      }),
  }),

  // ===== IMAGE PROXY =====
  proxy: router({
    getImage: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(async ({ input }) => {
        try {
          const response = await fetch(input.url);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = response.headers.get("content-type") || "image/jpeg";
          return { data: `data:${contentType};base64,${base64}` };
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to fetch image" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
