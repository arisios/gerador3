import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { SlideRenderer, SlidePreview, TemplateSelector } from "@/components/SlideRenderer";
import SlideComposer, { SlideStyle } from "@/components/SlideComposer";
import { ImageLightbox } from "@/components/ImageLightbox";
import { designTemplates, colorPalettes, type DesignTemplate } from "../../../shared/designTemplates";
import { ArrowLeft, Download, Image, Loader2, ChevronLeft, ChevronRight, Edit2, Check, X, Plus, Sparkles, Maximize2, Images, Palette, Layout, Wand2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ContentEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const contentId = parseInt(id || "0");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editingText, setEditingText] = useState(false);
  const [slideText, setSlideText] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("split-top-image");
  const [selectedPaletteId, setSelectedPaletteId] = useState("dark-purple");
  const [designSheetOpen, setDesignSheetOpen] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const { data: content, isLoading } = trpc.content.get.useQuery({ id: contentId });
  const { data: project } = trpc.projects.get.useQuery(
    { id: content?.projectId || 0 },
    { enabled: !!content?.projectId }
  );
  // Slides vem junto com o content
  const slides = content?.slides || [];
  const utils = trpc.useUtils();

  const updateSlide = trpc.slides.update.useMutation({
    onSuccess: () => {
      utils.content.get.invalidate({ id: contentId });
      setEditingText(false);
    },
  });

  const generateImage = trpc.slides.generateImage.useMutation({
    onSuccess: () => {
      utils.content.get.invalidate({ id: contentId });
      toast.success("Imagem gerada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar imagem");
    },
  });

  const generateAllImages = trpc.slides.generateAllImages.useMutation({
    onSuccess: (data) => {
      utils.content.get.invalidate({ id: contentId });
      toast.success(`${data.totalGenerated} imagens geradas!`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar imagens");
    },
  });

  const uploadImage = trpc.upload.image.useMutation();

  // Mutation para aplicar templates variados automaticamente a todos os slides
  const selectVariedTemplates = trpc.templates.selectVariedTemplates.useMutation({
    onSuccess: (data) => {
      utils.content.get.invalidate({ id: contentId });
      toast.success(`Templates variados aplicados! ${data.updates.length} slides atualizados.`);
      // Atualizar o template do slide atual
      const currentUpdate = data.updates.find(u => u.slideId === currentSlide?.id);
      if (currentUpdate) {
        setSelectedTemplateId(currentUpdate.templateId);
      }
      setSelectedPaletteId(data.paletteId);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aplicar templates");
    },
  });

  const currentSlide = slides[currentSlideIndex];

  useEffect(() => {
    if (currentSlide?.text) {
      setSlideText(currentSlide.text);
    }
    if (currentSlide?.imagePrompt) {
      setTempPrompt(currentSlide.imagePrompt);
    }
    // Carregar template salvo do slide - priorizar designTemplateId, depois visualTemplate
    const slideAny = currentSlide as any;
    if (slideAny?.designTemplateId) {
      setSelectedTemplateId(slideAny.designTemplateId);
    } else if (currentSlide?.visualTemplate) {
      setSelectedTemplateId(currentSlide.visualTemplate);
    }
    // Carregar paleta de cores - priorizar colorPaletteId direto, depois style.colorPaletteId
    if (slideAny?.colorPaletteId) {
      setSelectedPaletteId(slideAny.colorPaletteId);
    } else if (slideAny?.style?.colorPaletteId) {
      setSelectedPaletteId(slideAny.style.colorPaletteId);
    }
  }, [currentSlide]);

  const handleGenerateImage = async () => {
    if (!currentSlide) return;
    const prompt = tempPrompt || currentSlide.imagePrompt || `Imagem para: ${currentSlide.text}`;
    // Reforçar: SEM TEXTO na imagem
    const enhancedPrompt = `${prompt}. IMPORTANTE: A imagem deve ser APENAS VISUAL, SEM NENHUM TEXTO, SEM LETRAS, SEM PALAVRAS, SEM NÚMEROS. Apenas elementos visuais.`;
    await generateImage.mutateAsync({ slideId: currentSlide.id, prompt: enhancedPrompt });
  };

  const handleGenerateAllImages = async () => {
    if (!content) return;
    await generateAllImages.mutateAsync({ contentId: content.id });
  };

  const handleUploadImage = async (file: File) => {
    if (!currentSlide) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const result = await uploadImage.mutateAsync({
          base64,
          filename: file.name,
          contentType: file.type,
        });
        
        await updateSlide.mutateAsync({
          id: currentSlide.id,
          imageUrl: result.url,
        });
        
        toast.success("Imagem enviada com sucesso!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    }
  };

  const handleSelectImage = async (index: number) => {
    if (!currentSlide) return;
    const bank = (currentSlide.imageBank as string[]) || [];
    if (bank[index]) {
      await updateSlide.mutateAsync({
        id: currentSlide.id,
        imageUrl: bank[index],
        selectedImageIndex: index,
      });
      toast.success("Imagem selecionada");
    }
  };

  const handleImageClick = (imageUrl: string, index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  // Salvar template no slide - usar designTemplateId para consistência
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (currentSlide) {
      await updateSlide.mutateAsync({
        id: currentSlide.id,
        designTemplateId: templateId,
        visualTemplate: templateId, // manter compatibilidade
      });
    }
  };

  const handlePaletteChange = async (paletteId: string) => {
    setSelectedPaletteId(paletteId);
    if (currentSlide) {
      await updateSlide.mutateAsync({
        id: currentSlide.id,
        colorPaletteId: paletteId, // salvar direto no campo
        style: { ...((currentSlide as any).style || {}), colorPaletteId: paletteId },
      });
    }
  };

  // Funções para o SlideComposer
  const handleStyleChange = (style: SlideStyle) => {
    if (!currentSlide) return;
    updateSlide.mutate({ id: currentSlide.id, style: style as any });
  };

  const handleComposerTextChange = (text: string) => {
    if (!currentSlide) return;
    setSlideText(text);
    updateSlide.mutate({ id: currentSlide.id, text: text });
  };

  const handleComposerDownload = async (withText: boolean) => {
    if (!currentSlide || !currentSlide.imageUrl) return;
    try {
      // Download simples da imagem
      const link = document.createElement('a');
      link.href = currentSlide.imageUrl;
      link.download = `slide_${currentSlideIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro no download");
    }
  };

  // Download com template renderizado
  const handleDownloadRendered = async () => {
    if (!currentSlide) return;
    
    const template = designTemplates.find((t: DesignTemplate) => t.id === selectedTemplateId) || designTemplates[0];
    const palette = colorPalettes.find((p) => p.id === selectedPaletteId);
    
    // Criar canvas temporário
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cores
    const bgColor = palette?.colors.background || template.colors.background;
    const textColor = palette?.colors.text || template.colors.text;
    const accentColor = palette?.colors.accent || template.colors.accent;

    // Desenhar fundo
    if (bgColor.startsWith('linear-gradient')) {
      ctx.fillStyle = '#0a0a0a'; // Fallback
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, 1080, 1080);

    // Desenhar imagem na moldura
    if (currentSlide.imageUrl && template.imageFrame.position !== 'none') {
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const frame = template.imageFrame;
          const frameX = parsePercent(frame.x, 1080);
          const frameY = parsePercent(frame.y, 1080);
          const frameW = parsePercent(frame.width, 1080);
          const frameH = parsePercent(frame.height, 1080);
          const borderRadius = parsePercent(frame.borderRadius, 1080);

          ctx.save();
          
          // Criar clip com bordas arredondadas
          if (borderRadius > 0) {
            roundedRect(ctx, frameX, frameY, frameW, frameH, borderRadius);
            ctx.clip();
          }

          // Calcular crop para manter aspect ratio
          const imgRatio = img.width / img.height;
          const frameRatio = frameW / frameH;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          
          if (imgRatio > frameRatio) {
            sw = img.height * frameRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / frameRatio;
            sy = (img.height - sh) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sw, sh, frameX, frameY, frameW, frameH);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = currentSlide.imageUrl!;
      });
    }

    // Desenhar overlay se existir
    if (template.overlay && template.overlay.type !== 'none') {
      const opacity = template.overlay.opacity;
      
      switch (template.overlay.type) {
        case 'gradient-bottom': {
          const gradient = ctx.createLinearGradient(0, 432, 0, 1080);
          gradient.addColorStop(0, `rgba(0,0,0,0)`);
          gradient.addColorStop(1, `rgba(0,0,0,${opacity})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1080, 1080);
          break;
        }
        case 'gradient-top': {
          const gradient = ctx.createLinearGradient(0, 0, 0, 648);
          gradient.addColorStop(0, `rgba(0,0,0,${opacity})`);
          gradient.addColorStop(1, `rgba(0,0,0,0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1080, 1080);
          break;
        }
        case 'solid': {
          ctx.fillStyle = `rgba(0,0,0,${opacity})`;
          ctx.fillRect(0, 0, 1080, 1080);
          break;
        }
      }
    }

    // Desenhar texto
    const text = currentSlide.text || "";
    const textStyle = template.textStyle;
    
    const fontSizes: Record<string, number> = {
      'sm': 32, 'base': 40, 'lg': 48, 'xl': 60, '2xl': 70, '3xl': 86
    };
    const fontWeights: Record<string, string> = {
      'normal': '400', 'medium': '500', 'semibold': '600', 'bold': '700', 'black': '900'
    };
    const lineHeights: Record<string, number> = {
      'tight': 1.1, 'normal': 1.4, 'relaxed': 1.6
    };
    
    const fontSize = fontSizes[textStyle.fontSize] || 60;
    const fontWeight = fontWeights[textStyle.fontWeight] || '700';
    const lineHeight = lineHeights[textStyle.lineHeight] || 1.4;
    const padding = parsePercent(textStyle.padding, 1080);
    const maxWidth = parsePercent(textStyle.maxWidth, 1080);
    
    ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = textStyle.alignment as CanvasTextAlign;
    ctx.textBaseline = 'top';
    
    // Sombra de texto
    if (textStyle.textShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // Posição do texto
    const { x: textX, y: textY } = getTextPosition(textStyle.position, 1080, 1080, padding);
    
    // Quebrar texto em linhas
    const lines = wrapText(ctx, text, maxWidth);
    const totalHeight = lines.length * fontSize * lineHeight;
    
    let startY = textY;
    if (textStyle.position.includes('center')) {
      startY = textY - totalHeight / 2;
    } else if (textStyle.position.includes('bottom')) {
      startY = textY - totalHeight;
    }
    
    // Desenhar cada linha
    lines.forEach((line, i) => {
      const lineY = startY + i * fontSize * lineHeight;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      let currentX = textX;
      
      if (textStyle.alignment === 'center') {
        let totalWidth = 0;
        parts.forEach(part => {
          const cleanPart = part.replace(/\*\*/g, '');
          totalWidth += ctx.measureText(cleanPart).width;
        });
        
        currentX = textX - totalWidth / 2;
        ctx.textAlign = 'left';
        
        parts.forEach(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const word = part.slice(2, -2);
            ctx.fillStyle = accentColor;
            ctx.fillText(word, currentX, lineY);
            currentX += ctx.measureText(word).width;
            ctx.fillStyle = textColor;
          } else if (part) {
            ctx.fillText(part, currentX, lineY);
            currentX += ctx.measureText(part).width;
          }
        });
        
        ctx.textAlign = textStyle.alignment as CanvasTextAlign;
      } else {
        parts.forEach(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const word = part.slice(2, -2);
            ctx.fillStyle = accentColor;
            ctx.fillText(word, currentX, lineY);
            currentX += ctx.measureText(word).width;
            ctx.fillStyle = textColor;
          } else if (part) {
            ctx.fillText(part, currentX, lineY);
            currentX += ctx.measureText(part).width;
          }
        });
      }
    });
    
    // Resetar sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Desenhar logo se houver
    if (project?.logoUrl) {
      await new Promise<void>((resolve) => {
        const logo = new window.Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoSize = 86;
          const logoPadding = 32;
          let logoX = logoPadding;
          let logoY = logoPadding;
          
          switch (template.logoPosition) {
            case 'top-right':
              logoX = 1080 - logoSize - logoPadding;
              break;
            case 'bottom-left':
              logoY = 1080 - logoSize - logoPadding;
              break;
            case 'bottom-right':
              logoX = 1080 - logoSize - logoPadding;
              logoY = 1080 - logoSize - logoPadding;
              break;
          }
          
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          resolve();
        };
        logo.onerror = () => resolve();
        logo.src = project.logoUrl!;
      });
    }

    // Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `slide_${currentSlideIndex + 1}_rendered.png`;
    link.href = dataUrl;
    link.click();
    
    toast.success("Slide baixado com sucesso!");
  };

  // Download de todos os slides
  const handleDownloadAll = async () => {
    for (let i = 0; i < slides.length; i++) {
      setCurrentSlideIndex(i);
      await new Promise(resolve => setTimeout(resolve, 500));
      await handleDownloadRendered();
    }
    toast.success("Todos os slides baixados!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Conteúdo não encontrado</p>
      </div>
    );
  }

  const handleSaveText = () => {
    if (currentSlide) {
      updateSlide.mutate({ id: currentSlide.id, text: slideText });
    }
  };

  const imageBank = (currentSlide?.imageBank as string[]) || [];
  const lightboxImageUrl = lightboxImageIndex !== null && imageBank[lightboxImageIndex] 
    ? imageBank[lightboxImageIndex] 
    : currentSlide?.imageUrl || "";

  const selectedTemplate = designTemplates.find((t: DesignTemplate) => t.id === selectedTemplateId) || designTemplates[0];
  const selectedPalette = colorPalettes.find((p) => p.id === selectedPaletteId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/project/${content.projectId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium truncate">{content.title || "Conteúdo"}</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opções de Download</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleDownloadRendered}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Slide Atual (com template)
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleDownloadAll}
                >
                  <Images className="w-4 h-4 mr-2" />
                  Baixar Todos os Slides
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* SlideComposer ou Preview do Slide com Template */}
        {showComposer && currentSlide ? (
          <SlideComposer
            text={currentSlide.text || ""}
            imageUrl={currentSlide.imageUrl || undefined}
            templateId={selectedTemplateId}
            paletteId={selectedPaletteId}
            style={(currentSlide as any).style || {
              showText: true,
              textAlign: "center",
              positionY: 80,
              fontSize: 32,
              fontFamily: "Inter",
              textColor: "#FFFFFF",
              backgroundColor: "#000000",
              overlayOpacity: 50,
              shadowEnabled: true,
              shadowColor: "#000000",
              shadowBlur: 4,
              shadowOffsetX: 2,
              shadowOffsetY: 2,
              borderEnabled: false,
              borderColor: "#FFFFFF",
              borderWidth: 2,
              glowEnabled: false,
              glowColor: "#A855F7",
              glowIntensity: 10,
              letterSpacing: 0,
              lineHeight: 1.3,
              padding: 24,
            }}
            onStyleChange={handleStyleChange}
            onTextChange={handleComposerTextChange}
            onDownload={handleComposerDownload}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="relative">
              {/* Badge do template */}
              <div className="absolute top-2 left-2 z-10 flex gap-2">
                <span className="px-2 py-1 bg-black/70 rounded text-xs text-white">
                  {selectedTemplate.name}
                </span>
                <span className="px-2 py-1 bg-black/70 rounded text-xs flex items-center gap-1">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: selectedPalette?.colors.accent || selectedTemplate.colors.accent }}
                  />
                  {selectedPalette?.name || 'Padrão'}
                </span>
              </div>
              
              {/* Botão de expandir */}
              <button 
                className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                onClick={() => setLightboxOpen(true)}
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>

              {/* Preview do slide */}
              <SlidePreview
                text={currentSlide?.text || ""}
                imageUrl={currentSlide?.imageUrl || undefined}
                templateId={selectedTemplateId}
                paletteId={selectedPaletteId}
                logoUrl={project?.logoUrl || undefined}
                className="w-full"
              />
            </div>
          </Card>
        )}

        {/* Navegação de slides */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-1">
            {slides.map((_slide: unknown, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentSlideIndex(i)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  i === currentSlideIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Painel de Design */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                <h3 className="font-semibold">Design do Slide</h3>
              </div>
              <div className="flex gap-2">
                  <Button 
                    variant={showComposer ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setShowComposer(!showComposer)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    {showComposer ? "Fechar Editor" : "Editar Visual"}
                  </Button>
                  <Sheet open={designSheetOpen} onOpenChange={setDesignSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Layout className="w-4 h-4 mr-1" />
                        Template
                      </Button>
                    </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Template Visual</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 space-y-4">
                    {/* Botão para aplicar templates variados a todo o carrossel */}
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 border-primary/50 hover:bg-primary/10"
                      onClick={() => content && selectVariedTemplates.mutate({ contentId: content.id })}
                      disabled={selectVariedTemplates.isPending || !content}
                    >
                      {selectVariedTemplates.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      <span>Automático para Todo Carrossel</span>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      A IA vai escolher templates diferentes para cada slide
                    </p>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Ou escolha manualmente para este slide:</p>
                      <TemplateSelector
                        selectedId={selectedTemplateId}
                        onSelect={handleTemplateChange}
                        paletteId={selectedPaletteId}
                        onPaletteSelect={handlePaletteChange}
                      />
                    </div>
                  </div>
                </SheetContent>
                  </Sheet>
                </div>
            </div>
            
            {/* Preview rápido do template */}
            <div className="grid grid-cols-3 gap-2">
              {designTemplates.slice(0, 3).map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedTemplateId === template.id 
                      ? 'border-primary ring-2 ring-primary/50' 
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <div 
                    className="w-full h-full"
                    style={{ background: template.colors.background }}
                  >
                    {template.imageFrame.position !== 'none' && (
                      <div
                        className="absolute bg-muted/50"
                        style={{
                          left: template.imageFrame.x,
                          top: template.imageFrame.y,
                          width: template.imageFrame.width,
                          height: template.imageFrame.height,
                          borderRadius: template.imageFrame.borderRadius
                        }}
                      />
                    )}
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] text-white truncate">
                    {template.name}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Texto do Slide */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Texto do Slide</Label>
              {editingText ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditingText(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={handleSaveText} disabled={updateSlide.isPending}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setEditingText(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
            
            {editingText ? (
              <Textarea
                value={slideText}
                onChange={(e) => setSlideText(e.target.value)}
                className="min-h-[100px]"
                placeholder="Digite o texto do slide..."
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {currentSlide?.text || "Sem texto"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Imagem do Slide */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Imagem do Slide</Label>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleGenerateAllImages}
                disabled={generateAllImages.isPending}
              >
                {generateAllImages.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Images className="w-4 h-4 mr-2" />
                )}
                Gerar Todas
              </Button>
            </div>

            {/* Banco de imagens */}
            {imageBank.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Banco de Imagens ({imageBank.length})
                </Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {imageBank.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => handleImageClick(url, i)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentSlide?.selectedImageIndex === i 
                          ? 'border-primary ring-2 ring-primary/50' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {currentSlide?.selectedImageIndex === i && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt da imagem */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Prompt da Imagem</Label>
              <Textarea
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
                placeholder="Descreva a imagem que deseja gerar..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Dica: As imagens são geradas SEM TEXTO para não conflitar com o template.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateImage}
                  disabled={generateImage.isPending}
                  className="flex-1"
                >
                  {generateImage.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Gerar
                </Button>
                
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImage(file);
                    }}
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxImageIndex(null);
        }}
        imageUrl={lightboxImageUrl}
        prompt={tempPrompt || currentSlide?.imagePrompt || ""}
        onRegenerate={async (newPrompt: string) => {
          setTempPrompt(newPrompt);
          if (!currentSlide) return;
          const enhancedPrompt = `${newPrompt}. IMPORTANTE: A imagem deve ser APENAS VISUAL, SEM NENHUM TEXTO, SEM LETRAS, SEM PALAVRAS, SEM NÚMEROS. Apenas elementos visuais.`;
          await generateImage.mutateAsync({ slideId: currentSlide.id, prompt: enhancedPrompt });
        }}
        onUpload={handleUploadImage}
        title={`Slide ${currentSlideIndex + 1}`}
      />
    </div>
  );
}

// Helpers
function parsePercent(value: string, reference: number): number {
  if (value.endsWith('%')) {
    return (parseFloat(value) / 100) * reference;
  }
  if (value.endsWith('px')) {
    return parseFloat(value);
  }
  return parseFloat(value) || 0;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getTextPosition(
  position: string,
  width: number,
  height: number,
  padding: number
): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    'top-left': { x: padding, y: padding },
    'top-center': { x: width / 2, y: padding },
    'top-right': { x: width - padding, y: padding },
    'center-left': { x: padding, y: height / 2 },
    'center': { x: width / 2, y: height / 2 },
    'center-right': { x: width - padding, y: height / 2 },
    'bottom-left': { x: padding, y: height - padding },
    'bottom-center': { x: width / 2, y: height - padding },
    'bottom-right': { x: width - padding, y: height - padding }
  };
  return positions[position] || positions['center'];
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const cleanWord = word.replace(/\*\*/g, '');
    const testLine = currentLine ? `${currentLine} ${cleanWord}` : cleanWord;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}
