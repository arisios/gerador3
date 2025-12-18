import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import SlideComposer, { SlideStyle } from "@/components/SlideComposer";
import SlidePreview, { TemplateSelector, AccentColorSelector } from "@/components/SlidePreview";
import { ImageLightbox } from "@/components/ImageLightbox";
import { downloadCarouselSlide, downloadSingleImage, downloadAllSlidesWithText, downloadAllSlidesWithoutText } from "@/lib/downloadSlide";
import { ArrowLeft, Download, Image, Loader2, ChevronLeft, ChevronRight, Edit2, Check, X, Plus, Sparkles, Maximize2, Images } from "lucide-react";

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
  const [selectedTemplate, setSelectedTemplate] = useState("lifestyle-editorial");
  const [selectedAccentColor, setSelectedAccentColor] = useState("neon-green");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const { data: content, isLoading, refetch } = trpc.content.get.useQuery({ id: contentId });
  const utils = trpc.useUtils();

  const updateSlide = trpc.slides.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingText(false);
      toast.success("Slide atualizado");
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

  useEffect(() => {
    if (currentSlide) {
      setSlideText(currentSlide.text || "");
    }
  }, [currentSlide?.id]);

  const handleStyleChange = (style: SlideStyle) => {
    if (!currentSlide) return;
    updateSlide.mutate({ id: currentSlide.id, style: style as any });
  };

  const handleTextChange = (text: string) => {
    if (!currentSlide) return;
    updateSlide.mutate({ id: currentSlide.id, text: text });
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
    
    // Convert file to base64 and upload via API
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // For now, we'll use the base64 directly as the image URL
      // In production, this should upload to S3 first
      try {
        // Create a blob URL for immediate display
        const blob = new Blob([file], { type: file.type });
        const blobUrl = URL.createObjectURL(blob);
        
        // Upload to server (which will handle S3)
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const { url } = await response.json();
          uploadSlideImage.mutate({ slideId: currentSlide.id, imageUrl: url });
        } else {
          // Fallback: use base64 (not ideal for production)
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
      selectedImageIndex: 0,
    });
    // Note: imageBank update would need a separate mutation or schema change
    setLightboxOpen(false);
    setLightboxImageIndex(null);
  };

  const handleSelectImage = (index: number) => {
    if (!currentSlide) return;
    const bank = (currentSlide.imageBank as string[]) || [];
    updateSlide.mutate({
      id: currentSlide.id,
      imageUrl: bank[index],
      selectedImageIndex: index,
    });
  };

  const handleImageClick = (imageUrl: string, index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
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
                <DialogTitle>Download</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Slide Atual</h4>
                  <div className="flex gap-2">
                    <Button onClick={() => handleDownload(true)} className="flex-1">Com Texto</Button>
                    <Button variant="outline" onClick={() => handleDownload(false)} className="flex-1">Sem Texto</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Todos os Slides</h4>
                  <div className="flex gap-2">
                    <Button onClick={() => handleDownloadAll(true)} className="flex-1">Todos com Texto</Button>
                    <Button variant="outline" onClick={() => handleDownloadAll(false)} className="flex-1">Todos sem Texto</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Slide Composer ou Preview */}
        {showComposer && currentSlide ? (
          <SlideComposer
            text={currentSlide.text || ""}
            imageUrl={currentSlide.imageUrl || undefined}
            style={(currentSlide.style as SlideStyle) || DEFAULT_STYLE}
            onStyleChange={handleStyleChange}
            onTextChange={handleTextChange}
            onDownload={handleDownload}
          />
        ) : (
          <div className="space-y-4">
            {/* Preview com Template Visual */}
            <div 
              className="cursor-pointer group"
              onClick={() => currentSlide?.imageUrl && setLightboxOpen(true)}
            >
              <SlidePreview
                text={currentSlide?.text || ""}
                imageUrl={currentSlide?.imageUrl || undefined}
                templateId={selectedTemplate}
                accentColorId={selectedAccentColor}
                className="w-full"
              />
              {currentSlide?.imageUrl && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/70">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </Button>
                </div>
              )}
            </div>

            {/* Edição de Texto */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {editingText ? (
                  <div className="space-y-2">
                    <Label>Texto do Slide</Label>
                    <Textarea
                      value={slideText}
                      onChange={(e) => setSlideText(e.target.value)}
                      placeholder="Use **palavra** para destacar com cor neon"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dica: Use **palavra** para destacar com a cor de destaque
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveText} disabled={updateSlide.isPending}>
                        <Check className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingText(false)}>
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm truncate flex-1">{currentSlide?.text || "Sem texto"}</p>
                    <Button size="sm" variant="ghost" onClick={() => setEditingText(true)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seletor de Template e Cor */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Template Visual</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  >
                    {showTemplateSelector ? "Fechar" : "Escolher"}
                  </Button>
                </div>
                
                {showTemplateSelector && (
                  <TemplateSelector
                    selectedId={selectedTemplate}
                    onSelect={setSelectedTemplate}
                  />
                )}

                <div className="space-y-2">
                  <Label>Cor de Destaque</Label>
                  <AccentColorSelector
                    selectedId={selectedAccentColor}
                    onSelect={setSelectedAccentColor}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Slide Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" disabled={currentSlideIndex === 0} onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-2">
            {slides.map((_: any, index: number) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
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
          <Button variant="outline" size="icon" disabled={currentSlideIndex >= slides.length - 1} onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Botão Gerar Todas as Imagens */}
          <Button 
            className="w-full" 
            onClick={handleGenerateAllImages}
            disabled={generateAllImages.isPending || slides.length === 0}
          >
            {generateAllImages.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Images className="w-4 h-4 mr-2" />
            )}
            {generateAllImages.isPending 
              ? "Gerando..." 
              : `Gerar Todas as Imagens (${slides.length} slides)`
            }
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Imagem
                </Button>
              </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Gerar Imagens</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Prompt (orientação para a imagem)</Label>
                  <Textarea
                    value={tempPrompt || currentSlide?.imagePrompt || ""}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    placeholder="Descreva a imagem que deseja..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 O prompt serve como orientação. Imagens serão geradas sem texto.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((q) => (
                      <Button
                        key={q}
                        variant={imageQuantity === q ? "default" : "outline"}
                        onClick={() => setImageQuantity(q)}
                        className="flex-1"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleGenerateImage} disabled={generateImage.isPending}>
                  {generateImage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Gerar {imageQuantity} Imagem{imageQuantity > 1 ? "s" : ""}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={() => setShowComposer(!showComposer)}>
            <Edit2 className="w-4 h-4 mr-2" />
            {showComposer ? "Fechar Editor" : "Editar Visual"}
          </Button>
          </div>
        </div>

        {/* Banco de Imagens */}
        {imageBank.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-3 block">Banco de Imagens ({imageBank.length})</Label>
              <p className="text-xs text-muted-foreground mb-3">Clique em uma imagem para abrir em tela cheia</p>
              <div className="grid grid-cols-4 gap-2">
                {imageBank.map((url: string, index: number) => (
                  <button
                    key={index}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      currentSlide?.selectedImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                    onClick={() => handleImageClick(url, index)}
                    onDoubleClick={() => handleSelectImage(index)}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {currentSlide?.selectedImageIndex === index && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3 h-3 text-white drop-shadow" />
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Duplo clique para selecionar como imagem principal</p>
            </CardContent>
          </Card>
        )}

        {/* Slide Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {slides.map((s: any, i: number) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlideIndex(i)}
              className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === currentSlideIndex ? "border-primary" : "border-transparent"
              }`}
            >
              {s.imageUrl ? (
                <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs">{i + 1}</div>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => { setLightboxOpen(false); setLightboxImageIndex(null); }}
        imageUrl={lightboxImageUrl}
        prompt={currentSlide?.imagePrompt || ""}
        title={`Slide ${currentSlideIndex + 1}`}
        onRegenerate={handleRegenerateImage}
        onUpload={handleUploadImage}
        onDelete={lightboxImageIndex !== null ? handleDeleteImage : undefined}
      />
    </div>
  );
}
