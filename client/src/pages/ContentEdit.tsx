import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import SlideComposer, { SlideStyle } from "@/components/SlideComposer";
import { SlideRenderer, DesignTemplateSelector, ColorPaletteSelector, designTemplates, colorPalettes } from "@/components/SlideRenderer";
import { ImageLightbox } from "@/components/ImageLightbox";
import { downloadCarouselSlide, downloadSingleImage, downloadAllSlidesWithText, downloadAllSlidesWithoutText } from "@/lib/downloadSlide";
import { ArrowLeft, Download, Image, Loader2, ChevronLeft, ChevronRight, Edit2, Check, X, Plus, Sparkles, Maximize2, Images, Palette, Layout, Wand2, Upload } from "lucide-react";

import { toast } from "sonner";

const DEFAULT_STYLE: SlideStyle = {
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
};

export default function ContentEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const contentId = parseInt(id || "0");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editingText, setEditingText] = useState(false);
  const [slideText, setSlideText] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");
  const [imageQuantity, setImageQuantity] = useState(1);
  const [showComposer, setShowComposer] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);
  
  // Design Template states
  const [selectedTemplateId, setSelectedTemplateId] = useState("split-top");
  const [selectedPaletteId, setSelectedPaletteId] = useState("dark-neon");
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: content, isLoading, refetch } = trpc.content.get.useQuery({ id: contentId });
  const { data: project } = trpc.projects.get.useQuery(
    { id: content?.projectId || 0 },
    { enabled: !!content?.projectId }
  );
  const utils = trpc.useUtils();

  const updateSlide = trpc.slides.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingText(false);
      toast.success("Slide atualizado");
    },
  });

  const updateDesignTemplate = trpc.slides.updateDesignTemplate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Template atualizado");
    },
  });

  const saveRenderedImage = trpc.slides.saveRenderedImage.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Imagem renderizada salva!");
    },
  });

  const selectVariedTemplates = trpc.templates.selectVariedTemplates.useMutation({
    onSuccess: (data) => {
      refetch();
      setSelectedPaletteId(data.paletteId);
      toast.success(`Templates variados aplicados! (${data.updates.length} slides)`);
      setIsAutoSelecting(false);
    },
    onError: (e) => {
      toast.error("Erro: " + e.message);
      setIsAutoSelecting(false);
    },
  });

  const generateImage = trpc.slides.generateImage.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Imagem gerada!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const generateAllImages = trpc.slides.generateAllImages.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`${data.totalGenerated} imagens geradas!`);
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const uploadSlideImage = trpc.slides.uploadImage.useMutation({
    onSuccess: () => {
      refetch();
      setLightboxOpen(false);
      toast.success("Imagem enviada!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const slides = content?.slides || [];
  const currentSlide = slides[currentSlideIndex];

  // Carregar template do slide atual
  useEffect(() => {
    if (currentSlide) {
      setSlideText(currentSlide.text || "");
      if (currentSlide.designTemplateId) {
        setSelectedTemplateId(currentSlide.designTemplateId);
      }
      if (currentSlide.colorPaletteId) {
        setSelectedPaletteId(currentSlide.colorPaletteId);
      }
    }
  }, [currentSlide?.id]);

  // Carregar kit de marca do projeto
  useEffect(() => {
    if (project) {
      if (project.colorPaletteId && !currentSlide?.colorPaletteId) {
        setSelectedPaletteId(project.colorPaletteId);
      }
      if (project.defaultTemplateId && !currentSlide?.designTemplateId) {
        setSelectedTemplateId(project.defaultTemplateId);
      }
    }
  }, [project?.id]);

  const handleStyleChange = (style: SlideStyle) => {
    if (!currentSlide) return;
    updateSlide.mutate({ id: currentSlide.id, style: style as any });
  };

  const handleTextChange = (text: string) => {
    if (!currentSlide) return;
    updateSlide.mutate({ id: currentSlide.id, text: text });
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (currentSlide) {
      updateDesignTemplate.mutate({
        slideId: currentSlide.id,
        designTemplateId: templateId,
        colorPaletteId: selectedPaletteId,
      });
    }
  };

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPaletteId(paletteId);
    if (currentSlide) {
      updateDesignTemplate.mutate({
        slideId: currentSlide.id,
        designTemplateId: selectedTemplateId,
        colorPaletteId: paletteId,
      });
    }
  };

  const handleAutoSelectTemplates = () => {
    if (!content) return;
    setIsAutoSelecting(true);
    toast.info("IA selecionando templates variados...");
    selectVariedTemplates.mutate({ contentId: content.id });
  };

  const handleGenerateImage = () => {
    if (!currentSlide) return;
    generateImage.mutate({
      slideId: currentSlide.id,
      prompt: tempPrompt || currentSlide.imagePrompt || undefined,
      quantity: imageQuantity,
    });
  };

  const handleRegenerateImage = async (newPrompt: string) => {
    if (!currentSlide) return;
    await generateImage.mutateAsync({
      slideId: currentSlide.id,
      prompt: newPrompt,
      quantity: 1,
    });
  };

  const handleGenerateAllImages = () => {
    if (!content) return;
    toast.info(`Gerando imagens para ${slides.length} slides...`);
    generateAllImages.mutate({ contentId: content.id });
  };

  const handleUploadImage = async (file: File) => {
    if (!currentSlide) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ base64, filename: file.name, contentType: file.type }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const { url } = await response.json();
          uploadSlideImage.mutate({ slideId: currentSlide.id, imageUrl: url });
        } else {
          uploadSlideImage.mutate({ slideId: currentSlide.id, imageUrl: base64 });
        }
      } catch (error) {
        toast.error("Erro ao fazer upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async () => {
    if (!currentSlide || lightboxImageIndex === null) return;
    const bank = (currentSlide.imageBank as string[]) || [];
    const newBank = bank.filter((_, i) => i !== lightboxImageIndex);
    const newImageUrl = newBank.length > 0 ? newBank[0] : null;
    
    await updateSlide.mutateAsync({
      id: currentSlide.id,
      imageUrl: newImageUrl || undefined,
    });
    
    setLightboxImageIndex(null);
    setLightboxOpen(false);
    toast.success("Imagem removida");
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

  // Download com template renderizado
  const handleDownloadRendered = async () => {
    if (!currentSlide) return;
    
    // Criar canvas temporário para renderizar
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = designTemplates.find(t => t.id === selectedTemplateId) || designTemplates[0];
    const palette = colorPalettes.find(p => p.id === selectedPaletteId);

    // Renderizar fundo
    ctx.fillStyle = palette?.colors.background || template.defaultStyle.backgroundColor;
    ctx.fillRect(0, 0, 1080, 1080);

    // Se tiver imagem, desenhar
    if (currentSlide.imageUrl) {
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Calcular posição baseada no layout do template
          const layout = template.layout.image;
          let dx = 0, dy = 0, dw = 1080, dh = 1080;
          
          if (layout.position === 'top') {
            dh = 1080 * (layout.height / 100);
          } else if (layout.position === 'bottom') {
            dy = 1080 * (1 - layout.height / 100);
            dh = 1080 * (layout.height / 100);
          } else if (layout.position === 'left') {
            dw = 1080 * (layout.width / 100);
          } else if (layout.position === 'right') {
            dx = 1080 * (1 - layout.width / 100);
            dw = 1080 * (layout.width / 100);
          }
          
          // Crop para manter aspect ratio
          const imgRatio = img.width / img.height;
          const targetRatio = dw / dh;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          
          if (imgRatio > targetRatio) {
            sw = img.height * targetRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / targetRatio;
            sy = (img.height - sh) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = currentSlide.imageUrl!;
      });
    }

    // Desenhar overlay se necessário
    if (template.category === 'fullbleed') {
      const gradient = ctx.createLinearGradient(0, 540, 0, 1080);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);
    }

    // Desenhar texto
    const text = currentSlide.text || "";
    const textColor = palette?.colors.text || template.defaultStyle.textColor;
    const accentColor = palette?.colors.accent || template.defaultStyle.accentColor;
    
    ctx.font = `${template.defaultStyle.fontWeight === 'black' ? '900' : '700'} 48px Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = template.layout.text.alignment as CanvasTextAlign;
    
    // Posição do texto baseada no layout
    let textY = 540;
    let textX = 540;
    
    if (template.layout.text.position === 'bottom' || template.layout.text.position === 'overlay-bottom') {
      textY = 800;
    } else if (template.layout.text.position === 'top' || template.layout.text.position === 'overlay-top') {
      textY = 200;
    }
    
    if (template.layout.text.alignment === 'left') {
      textX = 60;
    } else if (template.layout.text.alignment === 'right') {
      textX = 1020;
    }
    
    // Quebrar texto em linhas
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = 900;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine.replace(/\*\*/g, ''));
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    // Desenhar linhas
    const lineHeight = 60;
    const startY = textY - (lines.length * lineHeight) / 2;
    
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      
      // Verificar texto destacado
      const parts = line.split(/(\*\*[^*]+\*\*)/);
      let lineX = textX;
      
      if (template.layout.text.alignment === 'center') {
        const cleanLine = line.replace(/\*\*/g, '');
        const lineWidth = ctx.measureText(cleanLine).width;
        lineX = textX - lineWidth / 2;
        ctx.textAlign = 'left';
      }
      
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          const highlightText = part.slice(2, -2);
          ctx.fillStyle = accentColor;
          ctx.fillText(highlightText, lineX, y);
          lineX += ctx.measureText(highlightText).width;
          ctx.fillStyle = textColor;
        } else if (part) {
          ctx.fillText(part, lineX, y);
          lineX += ctx.measureText(part).width;
        }
      }
      
      ctx.textAlign = template.layout.text.alignment as CanvasTextAlign;
    });

    // Desenhar logo se houver
    if (project?.logoUrl) {
      await new Promise<void>((resolve) => {
        const logo = new window.Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const logoSize = 80;
          const padding = 30;
          ctx.drawImage(logo, 1080 - logoSize - padding, padding, logoSize, logoSize);
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
    
    toast.success("Download iniciado!");
  };

  const handleDownload = async (withText: boolean) => {
    if (!currentSlide || !currentSlide.imageUrl) return;
    try {
      if (withText) {
        await downloadCarouselSlide(
          currentSlide.imageUrl,
          currentSlide.text || "",
          `slide_${currentSlideIndex + 1}.png`,
          currentSlideIndex === 0
        );
      } else {
        await downloadSingleImage(
          currentSlide.imageUrl,
          `slide_${currentSlideIndex + 1}.png`
        );
      }
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro no download");
    }
  };

  const handleDownloadAll = async (withText: boolean) => {
    try {
      const slidesWithImages = slides.filter((s: any) => s.imageUrl);
      if (slidesWithImages.length === 0) {
        toast.error("Nenhum slide com imagem para baixar");
        return;
      }
      
      if (withText) {
        const slidesData = slidesWithImages.map((s: any, index: number) => ({
          url: s.imageUrl,
          text: s.text || "",
          isFirst: index === 0,
        }));
        toast.info(`Baixando ${slidesData.length} slides...`);
        await downloadAllSlidesWithText(slidesData, content?.title || "carrossel", (current, total) => {
          toast.info(`Baixando slide ${current} de ${total}...`);
        });
      } else {
        const slidesData = slidesWithImages.map((s: any) => ({ url: s.imageUrl }));
        toast.info(`Baixando ${slidesData.length} imagens...`);
        await downloadAllSlidesWithoutText(slidesData, content?.title || "carrossel", (current, total) => {
          toast.info(`Baixando imagem ${current} de ${total}...`);
        });
      }
      toast.success("Downloads concluídos!");
    } catch (error) {
      toast.error("Erro nos downloads");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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

  const selectedTemplate = designTemplates.find(t => t.id === selectedTemplateId) || designTemplates[0];
  const selectedPalette = colorPalettes.find(p => p.id === selectedPaletteId);

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
                <div className="space-y-2">
                  <h4 className="font-medium">Slide Atual</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleDownload(true)}>
                      Com Texto
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload(false)}>
                      Só Imagem
                    </Button>
                    <Button 
                      className="col-span-2 bg-gradient-to-r from-purple-600 to-pink-600"
                      onClick={handleDownloadRendered}
                    >
                      <Layout className="w-4 h-4 mr-2" />
                      Com Template Renderizado
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Todos os Slides</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleDownloadAll(true)}>
                      Com Texto
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadAll(false)}>
                      Só Imagens
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Preview do Slide com Template */}
        <div className="relative">
          <SlideRenderer
            text={currentSlide?.text || ""}
            imageUrl={currentSlide?.imageUrl || undefined}
            templateId={selectedTemplateId}
            paletteId={selectedPaletteId}
            logoUrl={project?.logoUrl || undefined}
            className="w-full rounded-lg shadow-2xl"
          />
          
          {/* Overlay de informações */}
          <div className="absolute top-2 left-2 flex gap-2">
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
              {selectedTemplate.name}
            </span>
            {selectedPalette && (
              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedPalette.colors.accent }}
                />
                {selectedPalette.name}
              </span>
            )}
          </div>
          
          {/* Botão de expandir */}
          {currentSlide?.imageUrl && (
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
              onClick={() => setLightboxOpen(true)}
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </Button>
          )}
        </div>

        {/* Navegação de Slides */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" disabled={currentSlideIndex === 0} onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-2 overflow-x-auto py-2">
            {slides.map((_: any, index: number) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                  index === currentSlideIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => setCurrentSlideIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" disabled={currentSlideIndex === slides.length - 1} onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Painel de Design */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Design do Slide
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDesignPanel(!showDesignPanel)}
              >
                {showDesignPanel ? "Fechar" : "Editar"}
              </Button>
            </div>

            {showDesignPanel && (
              <div className="space-y-4 pt-2 border-t">
                {/* Botão Automático */}
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={handleAutoSelectTemplates}
                  disabled={isAutoSelecting}
                >
                  {isAutoSelecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Selecionando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Automático (IA escolhe templates variados)
                    </>
                  )}
                </Button>

                {/* Seletor de Template */}
                <div className="space-y-2">
                  <Label>Template de Layout</Label>
                  <DesignTemplateSelector
                    selectedId={selectedTemplateId}
                    onSelect={handleTemplateChange}
                  />
                </div>

                {/* Seletor de Paleta */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Paleta de Cores
                  </Label>
                  <ColorPaletteSelector
                    selectedId={selectedPaletteId}
                    onSelect={handlePaletteChange}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edição de Texto */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Texto do Slide</Label>
              <Button size="sm" variant="ghost" onClick={() => setEditingText(!editingText)}>
                <Edit2 className="w-4 h-4 mr-1" /> {editingText ? "Cancelar" : "Editar"}
              </Button>
            </div>
            
            {editingText ? (
              <div className="space-y-2">
                <Textarea
                  value={slideText}
                  onChange={(e) => setSlideText(e.target.value)}
                  placeholder="Use **palavra** para destacar com cor neon"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Dica: Use **palavra** para destacar com a cor de destaque
                </p>
                <Button size="sm" onClick={handleSaveText} disabled={updateSlide.isPending}>
                  <Check className="w-4 h-4 mr-1" /> Salvar
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{currentSlide?.text || "Sem texto"}</p>
            )}
          </CardContent>
        </Card>

        {/* Geração de Imagem */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Imagem do Slide</Label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleGenerateAllImages}
                  disabled={generateAllImages.isPending}
                >
                  {generateAllImages.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Images className="w-4 h-4 mr-1" />
                      Gerar Todas
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Banco de Imagens */}
            {imageBank.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Banco de Imagens ({imageBank.length})</Label>
                <div className="grid grid-cols-4 gap-2">
                  {imageBank.map((url, index) => (
                    <button
                      key={index}
                      className={`aspect-square rounded overflow-hidden border-2 transition-all ${
                        currentSlide?.imageUrl === url ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                      }`}
                      onClick={() => handleImageClick(url, index)}
                    >
                      <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt de Geração */}
            <div className="space-y-2">
              <Label>Prompt da Imagem</Label>
              <Textarea
                value={tempPrompt || currentSlide?.imagePrompt || ""}
                onChange={(e) => setTempPrompt(e.target.value)}
                placeholder="Descreva a imagem que deseja gerar..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleGenerateImage}
                  disabled={generateImage.isPending}
                >
                  {generateImage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  Gerar
                </Button>
                <select 
                  className="text-sm border rounded px-2 bg-background"
                  value={imageQuantity}
                  onChange={(e) => setImageQuantity(parseInt(e.target.value))}
                >
                  <option value={1}>1 imagem</option>
                  <option value={2}>2 imagens</option>
                  <option value={3}>3 imagens</option>
                  <option value={4}>4 imagens</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={lightboxImageUrl}
        prompt={currentSlide?.imagePrompt || ""}
        onRegenerate={handleRegenerateImage}
        onUpload={handleUploadImage}
        onDelete={handleDeleteImage}
      />
    </div>
  );
}
