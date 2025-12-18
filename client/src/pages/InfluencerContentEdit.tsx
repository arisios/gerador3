import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Image, Loader2, ChevronLeft, ChevronRight, Edit2, Check, X, Sparkles, ImagePlus, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { downloadSlide } from "@/lib/downloadSlide";
import { ImageLightbox } from "@/components/ImageLightbox";
import type { SlideStyle } from "@/components/SlideComposer";

export default function InfluencerContentEdit() {
  const { id, contentId } = useParams<{ id: string; contentId: string }>();
  const [, setLocation] = useLocation();
  const influencerId = parseInt(id || "0");
  const cId = parseInt(contentId || "0");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingText, setEditingText] = useState(false);
  const [slideText, setSlideText] = useState("");
  const [generatingImage, setGeneratingImage] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: content, isLoading, refetch } = trpc.influencers.getContent.useQuery({ id: cId });
  const { data: influencer } = trpc.influencers.get.useQuery({ id: influencerId });
  const utils = trpc.useUtils();

  const updateSlide = trpc.slides.update.useMutation({
    onSuccess: () => {
      utils.influencers.getContent.invalidate({ id: cId });
      setEditingText(false);
      toast.success("Atualizado");
    },
  });

  const generateSlideImage = trpc.influencers.generateSlideImage.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Imagem gerada!");
      setGeneratingImage(null);
    },
    onError: (e) => {
      toast.error("Erro: " + e.message);
      setGeneratingImage(null);
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

  useEffect(() => {
    if (content?.slides?.[currentSlide]) {
      setSlideText(content.slides[currentSlide].text || "");
    }
  }, [content, currentSlide]);

  const handleGenerateImage = (slideId: number, text: string) => {
    if (!influencer?.referenceImageUrl) {
      toast.error("Influenciador não tem imagem de referência");
      return;
    }
    setGeneratingImage(slideId);
    generateSlideImage.mutate({
      slideId,
      influencerId,
      slideText: text,
    });
  };

  const handleRegenerateFromLightbox = async (newPrompt: string) => {
    const slide = slides[currentSlide];
    if (!slide || !influencer?.referenceImageUrl) return;
    
    setGeneratingImage(slide.id);
    setLightboxOpen(false);
    
    try {
      await generateSlideImage.mutateAsync({
        slideId: slide.id,
        influencerId,
        slideText: newPrompt || slide.text || "",
        context: newPrompt,
      });
    } catch (e) {
      // Error already handled by mutation
    }
  };

  const handleDeleteImage = async () => {
    const slide = slides[currentSlide];
    if (!slide) return;
    
    await updateSlide.mutateAsync({
      id: slide.id,
      imageUrl: undefined,
    });
    setLightboxOpen(false);
  };

  const handleGenerateAllImages = () => {
    if (!influencer?.referenceImageUrl) {
      toast.error("Influenciador não tem imagem de referência");
      return;
    }
    setGeneratingAll(true);
    generateAllImages.mutate({
      contentId: cId,
      influencerId,
    });
  };

  const defaultStyle: SlideStyle = {
    showText: true,
    textAlign: "center",
    positionY: 80,
    fontSize: 32,
    fontFamily: "Inter",
    textColor: "#ffffff",
    backgroundColor: "#000000",
    overlayOpacity: 50,
    shadowEnabled: true,
    shadowColor: "#000000",
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    borderEnabled: false,
    borderColor: "#ffffff",
    borderWidth: 2,
    glowEnabled: false,
    glowColor: "#ffffff",
    glowIntensity: 10,
    letterSpacing: 0,
    lineHeight: 1.3,
    padding: 40,
  };

  const handleDownload = async (withText: boolean) => {
    const slide = slides[currentSlide];
    if (!slide) return;
    
    try {
      await downloadSlide(
        slide.imageUrl || "",
        slide.text || "",
        defaultStyle,
        withText,
        `${content?.title || "slide"}_${currentSlide + 1}`
      );
      toast.success("Download iniciado!");
    } catch (e) {
      toast.error("Erro no download");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!content) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p>Conteúdo não encontrado</p></div>;
  }

  const slides = content.slides || [];
  const slide = slides[currentSlide];
  const hasReferenceImage = !!influencer?.referenceImageUrl;

  // Gerar o prompt baseado no contexto do slide
  const getSlidePrompt = () => {
    if (!slide) return "";
    return `Foto profissional para Instagram de um influenciador digital.
Nicho: ${influencer?.niche || "lifestyle"}
Contexto do slide: ${slide.text}

A foto deve manter a MESMA pessoa da imagem de referência.`;
  };

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
            <Button size="sm" onClick={() => handleDownload(true)}>
              <Download className="w-4 h-4 mr-2" />Baixar
            </Button>
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

        <Card 
          className="aspect-[4/5] relative overflow-hidden group cursor-pointer" 
          onClick={() => slide?.imageUrl && setLightboxOpen(true)}
        >
          <CardContent className="p-0 h-full">
            {slide?.imageUrl ? (
              <>
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
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
                    onClick={(e) => { e.stopPropagation(); slide && handleGenerateImage(slide.id, slide.text || ""); }}
                    disabled={generatingImage === slide?.id}
                  >
                    {generatingImage === slide?.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ImagePlus className="w-4 h-4 mr-2" />
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
                  <Textarea value={slideText} onChange={(e) => setSlideText(e.target.value)} className="bg-black/50 border-white/20 text-white" rows={4} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { if (slide) updateSlide.mutate({ id: slide.id, text: slideText }); }} disabled={updateSlide.isPending}>
                      <Check className="w-4 h-4 mr-1" /> Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingText(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="text-white">
                  <p className="text-lg font-bold leading-tight">{slide?.text || "Sem texto"}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="ghost" className="text-white/80" onClick={(e) => { e.stopPropagation(); setEditingText(true); }}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    {slide?.imageUrl && hasReferenceImage && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-white/80"
                        onClick={(e) => { e.stopPropagation(); slide && handleGenerateImage(slide.id, slide.text || ""); }}
                        disabled={generatingImage === slide?.id}
                      >
                        {generatingImage === slide?.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <ImagePlus className="w-4 h-4 mr-1" />
                        )}
                        Regenerar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          💡 Clique na imagem para abrir em tela cheia, regenerar ou baixar
        </p>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" disabled={currentSlide === 0} onClick={() => setCurrentSlide(currentSlide - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-muted-foreground">Slide {currentSlide + 1} de {slides.length}</span>
          <Button variant="outline" size="icon" disabled={currentSlide >= slides.length - 1} onClick={() => setCurrentSlide(currentSlide + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {slides.map((s, i) => (
            <button 
              key={s.id} 
              onClick={() => setCurrentSlide(i)} 
              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === currentSlide ? "border-primary" : "border-transparent"}`}
            >
              {s.imageUrl ? (
                <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs">{i + 1}</div>
              )}
              {generatingImage === s.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Botões de download */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => handleDownload(true)} disabled={!slide?.imageUrl}>
            <Download className="w-4 h-4 mr-2" />
            Com Texto
          </Button>
          <Button variant="outline" onClick={() => handleDownload(false)} disabled={!slide?.imageUrl}>
            <Download className="w-4 h-4 mr-2" />
            Sem Texto
          </Button>
        </div>
      </main>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={slide?.imageUrl || ""}
        prompt={getSlidePrompt()}
        title={`Slide ${currentSlide + 1} - ${content.title || "Conteúdo"}`}
        onRegenerate={hasReferenceImage ? handleRegenerateFromLightbox : undefined}
        onDelete={handleDeleteImage}
      />
    </div>
  );
}
