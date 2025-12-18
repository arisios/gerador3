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
import { downloadSlide, downloadAllSlides } from "@/lib/downloadSlide";
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
    if (!currentSlide) return;
    try {
      await downloadSlide(
        currentSlide.imageUrl || undefined,
        currentSlide.text || "",
        (currentSlide.style as SlideStyle) || DEFAULT_STYLE,
        withText,
        `slide_${currentSlideIndex + 1}`
      );
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro no download");
    }
  };

  const handleDownloadAll = async (withText: boolean) => {
    try {
      const slidesData = slides.map((s: any) => ({
        imageUrl: s.imageUrl || undefined,
        text: s.text || "",
        style: (s.style as SlideStyle) || DEFAULT_STYLE,
      }));
      await downloadAllSlides(slidesData, withText, content?.title || "carrossel");
      toast.success("Downloads iniciados!");
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
          <Card className="aspect-[4/5] relative overflow-hidden group cursor-pointer" onClick={() => currentSlide?.imageUrl && setLightboxOpen(true)}>
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
                <div className="w-full h-full bg-gradient-to-b from-primary/20 to-background flex items-center justify-center">
                  <Image className="w-16 h-16 text-muted-foreground" />
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
        onDelete={lightboxImageIndex !== null ? handleDeleteImage : undefined}
      />
    </div>
  );
}
