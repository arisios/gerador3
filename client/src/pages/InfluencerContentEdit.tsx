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
import { ImageLightbox } from "@/components/ImageLightbox";
import { downloadCarouselSlide, downloadSingleImage, downloadAllSlidesWithText, downloadAllSlidesWithoutText } from "@/lib/downloadSlide";
import { ArrowLeft, Download, Image, Loader2, ChevronLeft, ChevronRight, Edit2, Check, X, Plus, Sparkles, Maximize2 } from "lucide-react";
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
  marginLeft: 24,
  marginRight: 24,
};

export default function InfluencerContentEdit() {
  const { id, contentId } = useParams<{ id: string; contentId: string }>();
  const [, setLocation] = useLocation();
  const influencerId = parseInt(id || "0");
  const cId = parseInt(contentId || "0");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editingText, setEditingText] = useState(false);
  const [slideText, setSlideText] = useState("");
  const [tempPrompt, setTempPrompt] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  const { data: content, isLoading, refetch } = trpc.influencers.getContent.useQuery({ id: cId });
  const { data: influencer } = trpc.influencers.get.useQuery({ id: influencerId });
  const utils = trpc.useUtils();

  const updateSlide = trpc.slides.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingText(false);
      toast.success("Slide atualizado");
    },
  });

  const generateSlideImage = trpc.influencers.generateSlideImage.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Imagem gerada!");
      setGeneratingImage(false);
    },
    onError: (e) => {
      toast.error("Erro: " + e.message);
      setGeneratingImage(false);
    },
  });

  const generateAllImages = trpc.influencers.generateAllSlideImages.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`${data.results.filter(r => r.imageUrl).length} imagens geradas!`);
      setGeneratingAll(false);
    },
    onError: (e) => {
      toast.error("Erro: " + e.message);
      setGeneratingAll(false);
    },
  });

  const slides = content?.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const hasReferenceImage = !!influencer?.referenceImageUrl;

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
    if (!currentSlide || !hasReferenceImage) {
      toast.error("Influenciador não tem imagem de referência");
      return;
    }
    setGeneratingImage(true);
    generateSlideImage.mutate({
      slideId: currentSlide.id,
      influencerId,
      slideText: currentSlide.text || "",
      context: tempPrompt || undefined,
    });
  };

  const handleRegenerateImage = async (newPrompt: string) => {
    if (!currentSlide || !hasReferenceImage) return;
    setGeneratingImage(true);
    setLightboxOpen(false);
    try {
      await generateSlideImage.mutateAsync({
        slideId: currentSlide.id,
        influencerId,
        slideText: currentSlide.text || "",
        context: newPrompt,
      });
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleDeleteImage = async () => {
    if (!currentSlide) return;
    await updateSlide.mutateAsync({
      id: currentSlide.id,
      imageUrl: undefined,
    });
    setLightboxOpen(false);
    setLightboxImageIndex(null);
  };

  const handleGenerateAllImages = () => {
    if (!hasReferenceImage) {
      toast.error("Influenciador não tem imagem de referência");
      return;
    }
    setGeneratingAll(true);
    generateAllImages.mutate({
      contentId: cId,
      influencerId,
    });
  };

  const handleSaveText = () => {
    if (currentSlide) {
      updateSlide.mutate({ id: currentSlide.id, text: slideText });
    }
  };

  const handleImageClick = () => {
    if (currentSlide?.imageUrl) {
      setLightboxImageIndex(0);
      setLightboxOpen(true);
    }
  };

  const handleDownload = async (withText: boolean) => {
    if (!currentSlide || !currentSlide.imageUrl) return;
    try {
      if (withText) {
        await downloadCarouselSlide(
          currentSlide.imageUrl,
          currentSlide.text || "",
          `${content?.title || "slide"}_${currentSlideIndex + 1}.png`,
          currentSlideIndex === 0
        );
      } else {
        await downloadSingleImage(
          currentSlide.imageUrl,
          `${content?.title || "slide"}_${currentSlideIndex + 1}.png`
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

  // Gerar o prompt baseado no contexto do slide
  const getSlidePrompt = () => {
    if (!currentSlide) return "";
    return `Foto em primeira pessoa para Instagram.
Nicho: ${influencer?.niche || "lifestyle"}
Contexto: ${currentSlide.text}

A foto deve manter a MESMA pessoa da imagem de referência (selfie/foto tirada pelo próprio influenciador).`;
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/influencer/${influencerId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium truncate">{content.title || "Conteúdo"}</span>
          </div>
          <div className="flex gap-2">
            {hasReferenceImage && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleGenerateAllImages}
                disabled={generatingAll}
              >
                {generatingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Todas
              </Button>
            )}
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
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Imagem de referência do influenciador */}
        {influencer?.referenceImageUrl && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <img 
              src={influencer.referenceImageUrl} 
              alt={influencer.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-sm">{influencer.name}</p>
              <p className="text-xs text-muted-foreground">Imagem de referência ativa</p>
            </div>
          </div>
        )}

        {!hasReferenceImage && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Este influenciador não tem imagem de referência. Volte e adicione uma para gerar imagens consistentes.
            </p>
          </div>
        )}

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
          <Card className="aspect-[4/5] relative overflow-hidden group cursor-pointer" onClick={handleImageClick}>
            <CardContent className="p-0 h-full">
              {currentSlide?.imageUrl ? (
                <>
                  <img src={currentSlide.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/70">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-primary/20 to-background flex flex-col items-center justify-center gap-4">
                  <Image className="w-16 h-16 text-muted-foreground" />
                  {hasReferenceImage && (
                    <Button 
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); handleGenerateImage(); }}
                      disabled={generatingImage}
                    >
                      {generatingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Gerar Imagem
                    </Button>
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {editingText ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Textarea
                      value={slideText}
                      onChange={(e) => setSlideText(e.target.value)}
                      className="bg-black/50 border-white/20 text-white"
                      rows={4}
                    />
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
                  <div className="text-white">
                    <p className="text-lg font-bold leading-tight">{currentSlide?.text || "Sem texto"}</p>
                    <Button size="sm" variant="ghost" className="mt-2 text-white/80" onClick={(e) => { e.stopPropagation(); setEditingText(true); }}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Slide Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" disabled={currentSlideIndex === 0} onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-2 flex-wrap justify-center">
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
        <div className="grid grid-cols-2 gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" disabled={!hasReferenceImage}>
                <Plus className="w-4 h-4 mr-2" />
                Gerar Imagem
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Gerar Imagem</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Contexto adicional (opcional)</Label>
                  <Textarea
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    placeholder="Ex: foto na academia, selfie no espelho..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 A imagem será gerada em primeira pessoa, como se fosse tirada pelo próprio influenciador. Sem texto na imagem.
                  </p>
                </div>
                <Button className="w-full" onClick={handleGenerateImage} disabled={generatingImage}>
                  {generatingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Gerar Imagem
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={() => setShowComposer(!showComposer)}>
            <Edit2 className="w-4 h-4 mr-2" />
            {showComposer ? "Fechar Editor" : "Editar Visual"}
          </Button>
        </div>

        {/* Slide Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {slides.map((s: any, i: number) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlideIndex(i)}
              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === currentSlideIndex ? "border-primary" : "border-transparent"
              }`}
            >
              {s.imageUrl ? (
                <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs">{i + 1}</div>
              )}
              {generatingImage && i === currentSlideIndex && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => { setLightboxOpen(false); setLightboxImageIndex(null); }}
        imageUrl={currentSlide?.imageUrl || ""}
        prompt={getSlidePrompt()}
        title={`Slide ${currentSlideIndex + 1} - ${content.title || "Conteúdo"}`}
        onRegenerate={hasReferenceImage ? handleRegenerateImage : undefined}
        onDelete={handleDeleteImage}
      />
    </div>
  );
}
