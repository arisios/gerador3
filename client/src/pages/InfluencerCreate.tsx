import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Camera, FileText, Check, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function InfluencerCreate() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"description" | "photo" | null>(null);
  const [step, setStep] = useState<"form" | "choose-photo">("form");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"normal" | "transformation">("normal");
  const [generatedPhotos, setGeneratedPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePhotos = trpc.influencers.generateReferencePhotos.useMutation({
    onSuccess: (data) => {
      if (data.photos.length > 0) {
        setGeneratedPhotos(data.photos);
        setStep("choose-photo");
      } else {
        toast.error("Não foi possível gerar fotos. Tente novamente.");
      }
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const createInfluencer = trpc.influencers.create.useMutation({
    onSuccess: (data) => {
      toast.success("Influenciador criado!");
      setLocation(`/influencer/${data.id}`);
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const handleGeneratePhotos = () => {
    if (!name.trim()) {
      toast.error("Digite um nome");
      return;
    }
    if (!niche.trim()) {
      toast.error("Digite o nicho");
      return;
    }
    if (!description.trim()) {
      toast.error("Digite a descrição física");
      return;
    }
    generatePhotos.mutate({ name, niche, description, type });
  };

  const handleCreateWithPhoto = () => {
    if (!selectedPhoto) {
      toast.error("Selecione uma foto");
      return;
    }
    createInfluencer.mutate({ 
      name, 
      niche, 
      description, 
      type,
      referenceImageUrl: selectedPhoto 
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Falha no upload");
      
      const data = await response.json();
      setUploadedPhoto(data.url);
      toast.success("Foto enviada!");
    } catch (error) {
      toast.error("Erro ao enviar foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateWithUploadedPhoto = () => {
    if (!name.trim()) {
      toast.error("Digite um nome");
      return;
    }
    if (!niche.trim()) {
      toast.error("Digite o nicho");
      return;
    }
    if (!uploadedPhoto) {
      toast.error("Envie uma foto");
      return;
    }
    createInfluencer.mutate({ 
      name, 
      niche, 
      type,
      referenceImageUrl: uploadedPhoto 
    });
  };

  // Tela inicial - escolher modo
  if (!mode) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center h-14 px-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/influencers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium">Novo Influenciador</span>
          </div>
        </header>

        <main className="container px-4 py-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Como criar?</h2>
            <p className="text-muted-foreground text-sm">Escolha como deseja criar o influenciador.</p>
          </div>

          <div className="grid gap-4">
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" onClick={() => setMode("description")}>
              <FileText className="w-8 h-8" />
              <span className="font-medium">Por Descrição</span>
              <span className="text-xs text-muted-foreground">Descreva e geramos 3 fotos para você escolher</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" onClick={() => setMode("photo")}>
              <Camera className="w-8 h-8" />
              <span className="font-medium">Por Foto</span>
              <span className="text-xs text-muted-foreground">Envie uma foto de referência</span>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Modo DESCRIÇÃO - Etapa de escolher foto
  if (mode === "description" && step === "choose-photo") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center h-14 px-4">
            <Button variant="ghost" size="icon" onClick={() => setStep("form")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium">Escolha a Foto</span>
          </div>
        </header>

        <main className="container px-4 py-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Escolha a foto de {name}</h2>
            <p className="text-muted-foreground text-sm">
              Esta foto será usada como referência para manter a consistência visual em todos os conteúdos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {generatedPhotos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhoto(photo)}
                className={`relative aspect-[4/5] rounded-xl overflow-hidden border-4 transition-all ${
                  selectedPhoto === photo 
                    ? "border-primary ring-4 ring-primary/20" 
                    : "border-transparent hover:border-primary/50"
                }`}
              >
                <img src={photo} alt={`Opção ${index + 1}`} className="w-full h-full object-cover" />
                {selectedPhoto === photo && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-2">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white font-medium">Opção {index + 1}</span>
                </div>
              </button>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => generatePhotos.mutate({ name, niche, description, type })}
            disabled={generatePhotos.isPending}
          >
            {generatePhotos.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Gerar Novas Fotos
          </Button>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCreateWithPhoto} 
            disabled={!selectedPhoto || createInfluencer.isPending}
          >
            {createInfluencer.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Criar com Esta Foto
          </Button>
        </div>
      </div>
    );
  }

  // Modo DESCRIÇÃO - Formulário
  if (mode === "description") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container flex items-center h-14 px-4">
            <Button variant="ghost" size="icon" onClick={() => setMode(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium">Criar por Descrição</span>
          </div>
        </header>

        <main className="container px-4 py-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Ana Silva" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Nicho</Label>
              <Input placeholder="Ex: Fitness, Beleza, Finanças..." value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="transformation">Transformação (Antes/Depois)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição Física</Label>
              <Textarea
                placeholder="Ex: Mulher brasileira, 28 anos, cabelo castanho longo, pele morena, sorriso simpático, aparência fitness..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes, melhor será a consistência visual nas fotos geradas.
              </p>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button className="w-full" size="lg" onClick={handleGeneratePhotos} disabled={generatePhotos.isPending}>
            {generatePhotos.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Gerando 3 fotos...
              </>
            ) : (
              "Gerar Fotos"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Modo FOTO - Upload
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => setMode(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="ml-2 font-medium">Criar por Foto</span>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input placeholder="Ex: Ana Silva" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Nicho</Label>
            <Input placeholder="Ex: Fitness, Beleza, Finanças..." value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="transformation">Transformação (Antes/Depois)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foto de Referência</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {uploadedPhoto ? (
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-primary">
                <img src={uploadedPhoto} alt="Foto enviada" className="w-full h-full object-cover" />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute bottom-3 right-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Trocar Foto
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full aspect-[4/5] rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3"
              >
                {isUploading ? (
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <span className="text-muted-foreground">Clique para enviar uma foto</span>
                    <span className="text-xs text-muted-foreground">Esta foto será a referência visual</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleCreateWithUploadedPhoto} 
          disabled={!uploadedPhoto || createInfluencer.isPending}
        >
          {createInfluencer.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Criar Influenciador
        </Button>
      </div>
    </div>
  );
}
