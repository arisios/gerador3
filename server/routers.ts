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
import { designTemplates, colorPalettes } from "@shared/designTemplates";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

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

  // ===== UPLOAD =====
  upload: router({
    image: protectedProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string().optional(),
        contentType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64
        const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const ext = input.contentType?.split('/')[1] || 'png';
        const filename = input.filename || `${nanoid()}.${ext}`;
        const key = `uploads/${ctx.user.id}/${Date.now()}-${filename}`;
        
        // Upload to S3
        const { url } = await storagePut(key, buffer, input.contentType || 'image/png');
        
        return { url, key };
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
    
    // Obter templates de design completos
    getDesignTemplates: publicProcedure.query(() => designTemplates),
    getColorPalettes: publicProcedure.query(() => colorPalettes),

    // Seleção automática de template com IA
    selectAutoTemplate: protectedProcedure
      .input(z.object({
        text: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Criar lista de templates para o prompt
        const templatesList = visualTemplates.map(t => 
          `- ${t.id}: ${t.name} - ${t.description} (tags: ${t.tags.join(', ')})`
        ).join('\n');
        
        const response = await invokeLLM({
          messages: [
            { role: "user", content: prompts.selectVisualTemplatePrompt(input.text, templatesList) }
          ],
        });
        
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : '';
        
        try {
          // Extrair JSON da resposta
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            // Fallback para template padrão
            return {
              templateId: "lifestyle-editorial",
              accentColorId: "neon-green",
              reason: "Template padrão selecionado"
            };
          }
          
          const result = JSON.parse(jsonMatch[0]);
          
          // Validar se o template existe
          const validTemplate = visualTemplates.find(t => t.id === result.templateId);
          const validColor = accentColors.find(c => c.id === result.accentColorId);
          
          return {
            templateId: validTemplate ? result.templateId : "lifestyle-editorial",
            accentColorId: validColor ? result.accentColorId : "neon-green",
            reason: result.reason || "Selecionado automaticamente"
          };
        } catch (e) {
          return {
            templateId: "lifestyle-editorial",
            accentColorId: "neon-green",
            reason: "Template padrão selecionado"
          };
        }
      }),
    getStylePresets: publicProcedure.query(() => stylePresets),

    // Seleção automática de templates VARIADOS para carrossel inteiro
    selectVariedTemplates: protectedProcedure
      .input(z.object({
        contentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const content = await db.getContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const slides = await db.getSlidesByContent(input.contentId);
        if (slides.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum slide encontrado" });
        }

        // Preparar dados para o prompt
        const slidesData = slides.map(s => ({
          order: s.order,
          text: s.text || ""
        }));

        const templatesList = designTemplates.map(t => 
          `- ${t.id}: ${t.name} (${t.category}) - ${t.description}`
        ).join('\n');

        const palettesList = colorPalettes.map(p => 
          `- ${p.id}: ${p.name}`
        ).join('\n');

        const response = await invokeLLM({
          messages: [
            { role: "user", content: prompts.selectVariedTemplatesPrompt(slidesData, templatesList, palettesList) }
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const contentStr = typeof rawContent === 'string' ? rawContent : '';

        try {
          const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("JSON não encontrado");
          }

          const result = JSON.parse(jsonMatch[0]);
          const paletteId = colorPalettes.find(p => p.id === result.paletteId)?.id || 'dark-neon';

          // Atualizar cada slide com seu template
          const updates: { slideId: number; templateId: string; reason: string }[] = [];
          
          for (const slideResult of result.slides || []) {
            const slide = slides.find(s => s.order === slideResult.order);
            if (slide) {
              const validTemplate = designTemplates.find(t => t.id === slideResult.templateId);
              const templateId = validTemplate ? slideResult.templateId : 'split-top';
              
              await db.updateSlide(slide.id, {
                designTemplateId: templateId,
                colorPaletteId: paletteId,
              });
              
              updates.push({
                slideId: slide.id,
                templateId,
                reason: slideResult.reason || 'Selecionado automaticamente'
              });
            }
          }

          return { paletteId, updates };
        } catch (e) {
          // Fallback: distribuir templates variados manualmente
          const fallbackTemplates = ['split-top', 'fullbleed-dark', 'card-border', 'minimal-left', 'bold-center', 'split-left'];
          const updates: { slideId: number; templateId: string; reason: string }[] = [];
          
          for (let i = 0; i < slides.length; i++) {
            const templateId = fallbackTemplates[i % fallbackTemplates.length];
            await db.updateSlide(slides[i].id, {
              designTemplateId: templateId,
              colorPaletteId: 'dark-neon',
            });
            updates.push({
              slideId: slides[i].id,
              templateId,
              reason: 'Template distribuído automaticamente'
            });
          }

          return { paletteId: 'dark-neon', updates };
        }
      }),
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

    // Atualizar Kit de Marca
    updateBrandKit: protectedProcedure
      .input(z.object({
        id: z.number(),
        logoUrl: z.string().optional(),
        colorPaletteId: z.string().optional(),
        customColors: z.object({
          background: z.string().optional(),
          text: z.string().optional(),
          accent: z.string().optional(),
        }).optional(),
        defaultTemplateId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.updateProjectBrandKit(input.id, {
          logoUrl: input.logoUrl,
          colorPaletteId: input.colorPaletteId,
          customColors: input.customColors,
          defaultTemplateId: input.defaultTemplateId,
        });
        return { success: true };
      }),

    // Análise profunda de link - retorna lista de clientes potenciais
    analyzeLink: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        sourceType: z.enum(["site", "instagram", "tiktok", "youtube"]),
        sourceUrl: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          sourceType: input.sourceType as "site" | "instagram" | "tiktok" | "description",
          sourceUrl: input.sourceUrl,
        });

        const analysisPrompt = prompts.analyzeLinkDeepPrompt(input.sourceUrl, input.sourceType);
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em análise de negócios e marketing digital. Analise profundamente e retorne apenas JSON válido." },
            { role: "user", content: analysisPrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "link_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  businessAnalysis: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      niche: { type: "string" },
                      mainOffer: { type: "string" },
                      uniqueValue: { type: "string" },
                      tone: { type: "string" },
                      keywords: { type: "array", items: { type: "string" } }
                    },
                    required: ["name", "niche", "mainOffer", "uniqueValue", "tone", "keywords"],
                    additionalProperties: false
                  },
                  potentialClients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        demographics: {
                          type: "object",
                          properties: {
                            age: { type: "string" },
                            gender: { type: "string" },
                            location: { type: "string" },
                            income: { type: "string" },
                            occupation: { type: "string" }
                          },
                          required: ["age", "gender", "location", "income", "occupation"],
                          additionalProperties: false
                        },
                        psychographics: {
                          type: "object",
                          properties: {
                            values: { type: "array", items: { type: "string" } },
                            interests: { type: "array", items: { type: "string" } },
                            lifestyle: { type: "string" },
                            goals: { type: "array", items: { type: "string" } },
                            frustrations: { type: "array", items: { type: "string" } }
                          },
                          required: ["values", "interests", "lifestyle", "goals", "frustrations"],
                          additionalProperties: false
                        },
                        buyingMotivation: { type: "string" },
                        mainPain: { type: "string" }
                      },
                      required: ["name", "description", "demographics", "psychographics", "buyingMotivation", "mainPain"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["businessAnalysis", "potentialClients"],
                additionalProperties: false
              }
            }
          }
        });

        const analysisText = response.choices[0]?.message?.content || "{}";
        let analysisData;
        try {
          analysisData = JSON.parse(typeof analysisText === 'string' ? analysisText : JSON.stringify(analysisText));
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao analisar link" });
        }

        await db.updateProject(projectId, { analysis: analysisData.businessAnalysis });

        if (analysisData.potentialClients && analysisData.potentialClients.length > 0) {
          await db.createIdealClients(projectId, analysisData.potentialClients.map((c: { name: string; description: string; demographics: unknown; psychographics: unknown }) => ({
            name: c.name,
            description: c.description,
            demographics: c.demographics,
            psychographics: c.psychographics,
          })));
        }

        return { projectId, businessAnalysis: analysisData.businessAnalysis, potentialClients: analysisData.potentialClients };
      }),

    selectClientsAndGeneratePains: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        selectedClientIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const allClients = await db.getIdealClientsByProject(input.projectId);
        for (const client of allClients) {
          await db.updateIdealClient(client.id, { isSelected: input.selectedClientIds.includes(client.id) });
        }

        const selectedClients = await db.getSelectedIdealClientsByProject(input.projectId);
        if (selectedClients.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione pelo menos um cliente ideal" });
        }

        await db.deletePainsByProject(input.projectId);

        const painsPrompt = prompts.generatePainsBySelectedClientsPrompt(
          JSON.stringify(project.analysis),
          JSON.stringify(selectedClients)
        );

        const painsResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em copywriting e psicologia do consumidor. Retorne apenas JSON válido." },
            { role: "user", content: painsPrompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pains_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  primary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pain: { type: "string" },
                        description: { type: "string" },
                        contentOpportunity: { type: "string" }
                      },
                      required: ["pain", "description", "contentOpportunity"],
                      additionalProperties: false
                    }
                  },
                  secondary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pain: { type: "string" },
                        description: { type: "string" },
                        contentOpportunity: { type: "string" }
                      },
                      required: ["pain", "description", "contentOpportunity"],
                      additionalProperties: false
                    }
                  },
                  unexplored: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pain: { type: "string" },
                        description: { type: "string" },
                        contentOpportunity: { type: "string" }
                      },
                      required: ["pain", "description", "contentOpportunity"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["primary", "secondary", "unexplored"],
                additionalProperties: false
              }
            }
          }
        });

        const painsText = painsResponse.choices[0]?.message?.content || "{}";
        let painsData;
        try {
          painsData = JSON.parse(typeof painsText === 'string' ? painsText : JSON.stringify(painsText));
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao gerar dores" });
        }

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
          await db.createPains(input.projectId, allPains);
        }

        return { success: true, painsCount: allPains.length, pains: painsData };
      }),

    updateIdealClientSelection: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        isSelected: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateIdealClient(input.clientId, { isSelected: input.isSelected });
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

    generateAllImages: protectedProcedure
      .input(z.object({
        contentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const content = await db.getContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const slides = await db.getSlidesByContent(input.contentId);
        const results: { slideId: number; imageUrl: string | null; error?: string }[] = [];

        for (const slide of slides) {
          try {
            const basePrompt = slide.imagePrompt || `Professional Instagram image for: ${slide.text || "lifestyle content"}`;
            const fullPrompt = `${basePrompt}\n\nREGRA PRIMORDIAL: A imagem deve ser REAL e SEM NENHUM TEXTO. Não inclua letras, palavras, números ou qualquer elemento textual na imagem. Deve ser uma FOTOGRAFIA REAL, não ilustração.`;
            
            const result = await generateImage({
              prompt: fullPrompt,
            });

            if (result.url) {
              const currentBank = (slide.imageBank as string[]) || [];
              const newBank = [...currentBank, result.url];
              
              await db.updateSlide(slide.id, {
                imageBank: newBank,
                imageUrl: result.url,
              });

              results.push({ slideId: slide.id, imageUrl: result.url });
            } else {
              results.push({ slideId: slide.id, imageUrl: null, error: "Falha ao gerar" });
            }
          } catch (error) {
            results.push({ slideId: slide.id, imageUrl: null, error: String(error) });
          }
        }

        return { results, totalGenerated: results.filter(r => r.imageUrl).length };
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        slideId: z.number(),
        imageUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const currentSlide = await db.getSlideById(input.slideId);
        const currentBank = (currentSlide?.imageBank as string[]) || [];
        const newBank = [...currentBank, input.imageUrl];
        
        await db.updateSlide(input.slideId, {
          imageBank: newBank,
          imageUrl: input.imageUrl,
        });

        return { success: true };
      }),

    // Atualizar template de design do slide
    updateDesignTemplate: protectedProcedure
      .input(z.object({
        slideId: z.number(),
        designTemplateId: z.string(),
        colorPaletteId: z.string().optional(),
        customColors: z.object({
          background: z.string().optional(),
          text: z.string().optional(),
          accent: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateSlide(input.slideId, {
          designTemplateId: input.designTemplateId,
          colorPaletteId: input.colorPaletteId,
          customColors: input.customColors,
        });
        return { success: true };
      }),

    // Salvar imagem renderizada do slide
    saveRenderedImage: protectedProcedure
      .input(z.object({
        slideId: z.number(),
        base64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64
        const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const key = `rendered/${ctx.user.id}/${Date.now()}-slide-${input.slideId}.png`;
        
        // Upload to S3
        const { url } = await storagePut(key, buffer, 'image/png');
        
        // Update slide with rendered image URL
        await db.updateSlide(input.slideId, {
          renderedImageUrl: url,
        });
        
        return { url };
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

    // Gerar fotos de perfil automáticas para o influenciador
    generateProfilePhotos: protectedProcedure
      .input(z.object({
        influencerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const influencer = await db.getInfluencerById(input.influencerId);
        if (!influencer || influencer.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (!influencer.referenceImageUrl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Influenciador precisa ter uma foto de referência" });
        }

        const profilePhotos: { type: string; url: string; prompt: string }[] = [];

        // Tipos de fotos a gerar
        const photoTypes = [
          {
            type: "profile",
            prompt: `Foto de perfil profissional para Instagram.
A MESMA PESSOA da foto de referência, mantendo EXATAMENTE as mesmas características físicas.
Foto em primeiro plano (close-up), sorriso natural, olhando para a câmera.
Iluminação suave e favorecedora.
Fundo neutro ou levemente desfocado.
REGRA PRIMORDIAL: Imagem REAL, SEM NENHUM TEXTO. Foto tirada pelo próprio influenciador (selfie profissional).`
          },
          {
            type: "lifestyle",
            prompt: `Foto lifestyle para feed do Instagram.
A MESMA PESSOA da foto de referência, mantendo EXATAMENTE as mesmas características físicas.
Foto casual mostrando o dia a dia, ambiente relacionado ao nicho ${influencer.niche || "lifestyle"}.
Pose natural e descontraída.
REGRA PRIMORDIAL: Imagem REAL, SEM NENHUM TEXTO. Foto em primeira pessoa, como se fosse tirada por um amigo.`
          },
          {
            type: "action",
            prompt: `Foto de ação/atividade para Instagram.
A MESMA PESSOA da foto de referência, mantendo EXATAMENTE as mesmas características físicas.
Foto realizando atividade relacionada ao nicho ${influencer.niche || "lifestyle"}.
Expressão engajada e autêntica.
REGRA PRIMORDIAL: Imagem REAL, SEM NENHUM TEXTO. Foto em primeira pessoa, selfie ou foto tirada por amigo.`
          },
        ];

        // Se for tipo transformação, adicionar foto "antes"
        if (influencer.type === "transformation") {
          photoTypes.unshift({
            type: "before",
            prompt: `Foto "ANTES" para conteúdo de transformação.
A MESMA PESSOA da foto de referência, mas em uma versão anterior (antes da transformação).
Mostrar a pessoa de forma natural, sem maquiagem elaborada, iluminação comum.
Pose simples, expressão neutra ou levemente insatisfeita.
Nicho: ${influencer.niche || "lifestyle"}
REGRA PRIMORDIAL: Imagem REAL, SEM NENHUM TEXTO. Selfie casual.`
          });
        }

        // Gerar cada foto usando a referência
        for (const photoType of photoTypes) {
          try {
            const result = await generateImage({
              prompt: photoType.prompt,
              originalImages: [{
                url: influencer.referenceImageUrl,
                mimeType: "image/jpeg"
              }]
            });
            if (result.url) {
              profilePhotos.push({
                type: photoType.type,
                url: result.url,
                prompt: photoType.prompt
              });
            }
          } catch (e) {
            console.error("Erro ao gerar foto de perfil", photoType.type, e);
          }
        }

        // Salvar fotos no banco (criar tabela ou usar campo JSON)
        // Por enquanto, retornar as fotos geradas
        return { photos: profilePhotos };
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

        const prompt = `Gere uma foto em PRIMEIRA PESSOA como se fosse tirada pelo próprio influenciador.

A IMAGEM DE REFERÊNCIA ANEXADA é a pessoa que deve aparecer na foto. Use-a como base para manter consistência física absoluta.

Nicho: ${influencer.niche || "lifestyle"}
Contexto da foto: ${input.slideText}
${input.context ? `Contexto adicional: ${input.context}` : ""}

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

Lembre-se: Esta foto será postada como se fosse do próprio influenciador, então deve parecer 100% autêntica e em primeira pessoa.`;

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
          const prompt = `Gere uma foto em PRIMEIRA PESSOA como se fosse tirada pelo próprio influenciador.

A IMAGEM DE REFERÊNCIA ANEXADA é a pessoa que deve aparecer na foto. Use-a como base para manter consistência física absoluta.

Nicho: ${influencer.niche || "lifestyle"}
Contexto da foto: ${slide.text}

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

Lembre-se: Esta foto será postada como se fosse do próprio influenciador, então deve parecer 100% autêntica e em primeira pessoa.`;

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
