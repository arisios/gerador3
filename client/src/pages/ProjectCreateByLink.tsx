import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, ArrowRight, Globe, Instagram, Youtube, Music2, 
  Loader2, Check, Users, Target, Lightbulb, AlertCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

type SourceType = "site" | "instagram" | "tiktok" | "youtube";

interface PotentialClient {
  name: string;
  description: string;
  demographics: {
    age: string;
    gender: string;
    location: string;
    income: string;
    occupation: string;
  };
  psychographics: {
    values: string[];
    interests: string[];
    lifestyle: string;
    goals: string[];
    frustrations: string[];
  };
  buyingMotivation: string;
  mainPain: string;
}

interface BusinessAnalysis {
  name: string;
  niche: string;
  mainOffer: string;
  uniqueValue: string;
  tone: string;
  keywords: string[];
}

export default function ProjectCreateByLink() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  
  // Dados da análise
  const [projectId, setProjectId] = useState<number | null>(null);
  const [businessAnalysis, setBusinessAnalysis] = useState<BusinessAnalysis | null>(null);
  const [potentialClients, setPotentialClients] = useState<PotentialClient[]>([]);
  const [selectedClientIndices, setSelectedClientIndices] = useState<number[]>([]);
  const [expandedClients, setExpandedClients] = useState<number[]>([]);
  const [extractedLogo, setExtractedLogo] = useState<{ detected: boolean; reason: string; sourceType: string; needsExtraction: boolean } | null>(null);
  


  const analyzeLink = trpc.projects.analyzeLink.useMutation({
    onSuccess: (data) => {
      setProjectId(data.projectId);
      setBusinessAnalysis(data.businessAnalysis);
      setPotentialClients(data.potentialClients || []);
      if (data.extractedLogo) {
        setExtractedLogo(data.extractedLogo);
        toast.success("🎯 Logo detectada! Você poderá configurá-la no kit de marca.");
      }
      setStep(3);
    },
    onError: (error) => {
      toast.error("Erro ao analisar link: " + error.message);
    },
  });

  // Buscar dados do projeto quando projectId mudar
  const { data: projectData } = trpc.projects.get.useQuery(
    { id: projectId || 0 },
    { enabled: !!projectId && step === 3 }
  );

  // Extrair IDs dos clientes salvos
  const savedClientIds = projectData?.idealClients?.map(c => c.id) || [];



  const selectClientsAndGeneratePains = trpc.projects.selectClientsAndGeneratePains.useMutation({
    onSuccess: () => {
      setStep(5);
    },
    onError: (error) => {
      toast.error("Erro ao gerar dores: " + error.message);
    },
  });

  const detectSourceType = (url: string): SourceType | null => {
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.startsWith("http")) return "site";
    return null;
  };

  const handleUrlChange = (url: string) => {
    setSourceUrl(url);
    const detected = detectSourceType(url);
    if (detected) {
      setSourceType(detected);
    }
  };

  // Extrair nome do link (domínio ou username)
  const extractNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Para Instagram/TikTok, pegar o username
      if (url.includes("instagram.com") || url.includes("tiktok.com")) {
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length > 0 && pathParts[0] !== "p" && pathParts[0] !== "reel") {
          return "@" + pathParts[0];
        }
      }
      // Para YouTube, pegar o canal
      if (url.includes("youtube.com")) {
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts[0] === "@" || pathParts[0]?.startsWith("@")) {
          return pathParts[0];
        }
        if (pathParts[0] === "channel" && pathParts[1]) {
          return pathParts[1];
        }
      }
      // Para sites, usar o domínio
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const handleAnalyze = () => {
    if (!sourceUrl.trim()) {
      toast.error("Cole o link para análise");
      return;
    }
    if (!sourceType) {
      toast.error("Tipo de link não reconhecido");
      return;
    }
    
    const projectName = extractNameFromUrl(sourceUrl);
    
    setStep(2);
    analyzeLink.mutate({
      name: projectName,
      sourceType,
      sourceUrl,
    });
  };

  const toggleClientSelection = (index: number) => {
    if (selectedClientIndices.includes(index)) {
      setSelectedClientIndices(selectedClientIndices.filter(i => i !== index));
    } else {
      setSelectedClientIndices([...selectedClientIndices, index]);
    }
  };

  const toggleClientExpanded = (index: number) => {
    if (expandedClients.includes(index)) {
      setExpandedClients(expandedClients.filter(i => i !== index));
    } else {
      setExpandedClients([...expandedClients, index]);
    }
  };

  const handleGeneratePains = () => {
    if (selectedClientIndices.length === 0) {
      toast.error("Selecione pelo menos um cliente ideal");
      return;
    }
    if (!projectId) {
      toast.error("Erro: projeto não encontrado");
      return;
    }

    // Mapear índices selecionados para IDs do banco
    const selectedIds = selectedClientIndices
      .map(index => savedClientIds[index])
      .filter((id): id is number => id !== undefined);
    
    if (selectedIds.length === 0) {
      toast.error("Aguarde os dados carregarem");
      return;
    }
    
    setStep(4);
    selectClientsAndGeneratePains.mutate({
      projectId,
      selectedClientIds: selectedIds,
    });
  };

  const handleFinish = () => {
    if (projectId) {
      setLocation(`/project/${projectId}`);
    }
  };

  const getSourceIcon = (type: SourceType | null) => {
    switch (type) {
      case "instagram": return <Instagram className="w-5 h-5" />;
      case "tiktok": return <Music2 className="w-5 h-5" />;
      case "youtube": return <Youtube className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="ml-2 font-medium">Criar por Link</span>
        </div>
      </header>

      {/* Progress */}
      <div className="container px-4 py-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Link</span>
          <span>Análise</span>
          <span>Clientes</span>
          <span>Dores</span>
          <span>Pronto</span>
        </div>
      </div>

      <main className="container px-4 py-6">
        {/* Step 1: Link Input */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Cole o link do seu negócio</h2>
              <p className="text-muted-foreground text-sm">
                A IA vai analisar profundamente e identificar seus clientes ideais.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link</label>
                <div className="relative">
                  <Input
                    placeholder="Cole o link aqui (Instagram, TikTok, YouTube ou Site)"
                    value={sourceUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="h-12 pr-12"
                  />
                  {sourceType && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                      {getSourceIcon(sourceType)}
                    </div>
                  )}
                </div>
                {sourceType && (
                  <p className="text-xs text-primary">
                    Detectado: {sourceType === "site" ? "Website" : sourceType.charAt(0).toUpperCase() + sourceType.slice(1)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                <SourceBadge 
                  icon={<Globe className="w-4 h-4" />} 
                  label="Site" 
                  active={sourceType === "site"}
                />
                <SourceBadge 
                  icon={<Instagram className="w-4 h-4" />} 
                  label="Instagram" 
                  active={sourceType === "instagram"}
                />
                <SourceBadge 
                  icon={<Music2 className="w-4 h-4" />} 
                  label="TikTok" 
                  active={sourceType === "tiktok"}
                />
                <SourceBadge 
                  icon={<Youtube className="w-4 h-4" />} 
                  label="YouTube" 
                  active={sourceType === "youtube"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 2 && (
          <div className="text-center py-12 space-y-6">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-xl font-bold mb-2">Analisando profundamente...</h2>
              <p className="text-muted-foreground text-sm">
                A IA está identificando todos os possíveis clientes ideais.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="animate-pulse">→ Analisando o negócio</p>
              <p className="opacity-50">○ Identificando público-alvo</p>
              <p className="opacity-50">○ Mapeando clientes potenciais</p>
              <p className="opacity-50">○ Analisando motivações de compra</p>
            </div>
          </div>
        )}

        {/* Step 3: Select Clients */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Business Summary */}
            {businessAnalysis && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium">{businessAnalysis.name}</h3>
                      <p className="text-sm text-muted-foreground">{businessAnalysis.niche}</p>
                      <p className="text-xs text-muted-foreground mt-1">{businessAnalysis.mainOffer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-xl font-bold mb-2">Selecione seus clientes ideais</h2>
              <p className="text-muted-foreground text-sm">
                Escolha quais perfis representam melhor seu público-alvo.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {selectedClientIndices.length} selecionado(s)
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (selectedClientIndices.length === potentialClients.length) {
                    setSelectedClientIndices([]);
                  } else {
                    setSelectedClientIndices(potentialClients.map((_, i) => i));
                  }
                }}
              >
                {selectedClientIndices.length === potentialClients.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>

            <div className="space-y-3">
              {potentialClients.map((client, index) => (
                <Card 
                  key={index}
                  className={`transition-all ${
                    selectedClientIndices.includes(index) 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedClientIndices.includes(index)}
                        onCheckedChange={() => toggleClientSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleClientExpanded(index)}
                        >
                          <div>
                            <h4 className="font-medium">{client.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {client.description}
                            </p>
                          </div>
                          {expandedClients.includes(index) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>

                        {expandedClients.includes(index) && (
                          <div className="mt-4 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground">Idade:</span>
                                <span className="ml-1">{client.demographics.age}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Gênero:</span>
                                <span className="ml-1">{client.demographics.gender}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Renda:</span>
                                <span className="ml-1">{client.demographics.income}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ocupação:</span>
                                <span className="ml-1">{client.demographics.occupation}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Estilo de vida:</span>
                              <p className="mt-1">{client.psychographics.lifestyle}</p>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Objetivos:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {client.psychographics.goals.map((goal, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {goal}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">Frustrações:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {client.psychographics.frustrations.map((frust, i) => (
                                  <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">
                                    {frust}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                                <div>
                                  <p className="font-medium text-xs">Por que compraria:</p>
                                  <p className="text-xs text-muted-foreground">{client.buyingMotivation}</p>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-destructive/10 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                                <div>
                                  <p className="font-medium text-xs">Dor principal:</p>
                                  <p className="text-xs text-muted-foreground">{client.mainPain}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Generating Pains */}
        {step === 4 && (
          <div className="text-center py-12 space-y-6">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-xl font-bold mb-2">Gerando dores...</h2>
              <p className="text-muted-foreground text-sm">
                Analisando os clientes selecionados para identificar dores.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ {selectedClientIndices.length} cliente(s) selecionado(s)</p>
              <p className="animate-pulse">→ Identificando dores principais</p>
              <p className="opacity-50">○ Mapeando dores secundárias</p>
              <p className="opacity-50">○ Descobrindo dores inexploradas</p>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="text-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Projeto criado!</h2>
              <p className="text-muted-foreground text-sm">
                Seu projeto está pronto com dores mapeadas em 3 níveis.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{selectedClientIndices.length} cliente(s) ideal(is)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Target className="w-4 h-4 text-destructive" />
                <span>Dores principais, secundárias e inexploradas</span>
              </div>
              {extractedLogo?.detected && (
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>🎯 Logo detectada! Configure no kit de marca.</span>
                </div>
              )}
            </div>
            <Button size="lg" onClick={handleFinish}>
              Ir para o Projeto
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="container">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleAnalyze}
              disabled={!sourceUrl.trim() || !sourceType}
            >
              Analisar Link
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="container">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleGeneratePains}
              disabled={selectedClientIndices.length === 0 || selectClientsAndGeneratePains.isPending}
            >
              {selectClientsAndGeneratePains.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Gerar Dores ({selectedClientIndices.length} selecionado{selectedClientIndices.length !== 1 ? "s" : ""})
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground"
    }`}>
      {icon}
      <span className="text-xs">{label}</span>
    </div>
  );
}
