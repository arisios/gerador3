import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { TemplateSelector, AccentColorSelector } from "@/components/SlidePreview";
import { 
  ArrowLeft, Plus, Image, Video, Layers, Loader2, 
  ChevronRight, Trash2, Users, Zap, Target, AlertCircle,
  TrendingUp, Flame, X, Check
} from "lucide-react";
import { toast } from "sonner";

type ContentSource = "pains" | "trends" | "virals";

interface ContentSelection {
  id: string;
  sourceType: ContentSource;
  sourceId: number;
  sourceName: string;
  contentType: "carousel" | "image" | "video";
  template: string;
  templateName: string;
  quantity: number;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(id || "0");

  const [showGenerator, setShowGenerator] = useState(false);
  const [contentSource, setContentSource] = useState<ContentSource>("pains");
  const [selections, setSelections] = useState<ContentSelection[]>([]);
  const [objective, setObjective] = useState<"sale" | "authority" | "growth">("authority");
  const [person, setPerson] = useState<"first" | "second" | "third">("second");
  const [clickbait, setClickbait] = useState(false);

  // Seleção atual
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>([]);
  const [currentContentType, setCurrentContentType] = useState<"carousel" | "image" | "video">("carousel");
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [visualTemplate, setVisualTemplate] = useState("lifestyle-editorial");
  const [accentColor, setAccentColor] = useState("neon-green");
  const [showVisualTemplates, setShowVisualTemplates] = useState(false);

  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: contents } = trpc.content.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: trends } = trpc.trends.list.useQuery({ source: "google" });
  const { data: virals } = trpc.virals.list.useQuery({});
  const { data: carouselTemplates } = trpc.templates.getCarouselTemplates.useQuery();
  const { data: imageTemplates } = trpc.templates.getImageTemplates.useQuery();
  const { data: videoTemplates } = trpc.templates.getVideoTemplates.useQuery();

  const utils = trpc.useUtils();

  const generateContent = trpc.content.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.contentIds.length} conteúdo(s) gerado(s)!`);
      utils.content.list.invalidate({ projectId });
      setShowGenerator(false);
      setSelections([]);
      if (data.contentIds[0]) {
        setLocation(`/content/${data.contentIds[0]}`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao gerar: " + error.message);
    },
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projeto excluído");
      setLocation("/dashboard");
    },
  });

  const templates = currentContentType === "carousel" ? carouselTemplates :
                    currentContentType === "image" ? imageTemplates : videoTemplates;

  // Obter lista de fontes baseado no tipo selecionado
  const getSources = () => {
    if (contentSource === "pains") {
      return project?.pains?.map(p => ({ id: p.id, name: p.pain, level: p.level })) || [];
    } else if (contentSource === "trends") {
      return trends?.map(t => ({ id: t.id, name: t.name, level: t.classification })) || [];
    } else {
      return virals?.map(v => ({ id: v.id, name: v.title, level: v.category })) || [];
    }
  };

  const sources = getSources();

  // Adicionar seleção
  const handleAddSelection = () => {
    if (selectedSourceIds.length === 0) {
      toast.error("Selecione pelo menos uma opção");
      return;
    }
    if (!currentTemplate) {
      toast.error("Selecione um template");
      return;
    }

    const templateObj = templates?.find(t => t.id === currentTemplate);
    const newSelections: ContentSelection[] = selectedSourceIds.map(sourceId => {
      const source = sources.find(s => s.id === sourceId);
      return {
        id: `${contentSource}-${sourceId}-${currentContentType}-${currentTemplate}-${Date.now()}`,
        sourceType: contentSource,
        sourceId,
        sourceName: source?.name || "",
        contentType: currentContentType,
        template: currentTemplate,
        templateName: templateObj?.name || "",
        quantity: currentQuantity,
      };
    });

    setSelections([...selections, ...newSelections]);
    setSelectedSourceIds([]);
    setCurrentTemplate("");
    setCurrentQuantity(1);
    toast.success(`${newSelections.length} item(s) adicionado(s)`);
  };

  // Remover seleção
  const handleRemoveSelection = (selectionId: string) => {
    setSelections(selections.filter(s => s.id !== selectionId));
  };

  // Gerar todos os conteúdos
  const handleGenerateAll = async () => {
    if (selections.length === 0) {
      toast.error("Adicione pelo menos uma seleção");
      return;
    }

    // Gerar cada seleção
    for (const selection of selections) {
      let painText: string | undefined;
      
      if (selection.sourceType === "pains") {
        const pain = project?.pains?.find(p => p.id === selection.sourceId);
        painText = pain?.pain;
      } else if (selection.sourceType === "trends") {
        const trend = trends?.find(t => t.id === selection.sourceId);
        painText = `Trend: ${trend?.name}`;
      } else {
        const viral = virals?.find(v => v.id === selection.sourceId);
        painText = `Viral: ${viral?.title}`;
      }

      await generateContent.mutateAsync({
        projectId,
        type: selection.contentType,
        template: selection.template,
        quantity: selection.quantity,
        painId: selection.sourceType === "pains" ? selection.sourceId : undefined,
        pain: painText,
        objective,
        person,
        clickbait,
      });
    }
  };

  // Toggle seleção de fonte
  const toggleSourceSelection = (sourceId: number) => {
    if (selectedSourceIds.includes(sourceId)) {
      setSelectedSourceIds(selectedSourceIds.filter(id => id !== sourceId));
    } else {
      setSelectedSourceIds([...selectedSourceIds, sourceId]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p>Projeto não encontrado</p>
          <Button variant="link" onClick={() => setLocation("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalContents = selections.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium truncate max-w-[200px]">{project.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive"
            onClick={() => {
              if (confirm("Excluir projeto?")) {
                deleteProject.mutate({ id: projectId });
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-auto py-4 flex-col gap-2" 
            onClick={() => setShowGenerator(true)}
          >
            <Zap className="w-6 h-6" />
            <span>Gerar Conteúdo</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setLocation("/influencers")}
          >
            <Users className="w-6 h-6" />
            <span>Influenciadores</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="contents">
          <TabsList className="w-full">
            <TabsTrigger value="contents" className="flex-1">Conteúdos</TabsTrigger>
            <TabsTrigger value="pains" className="flex-1">Dores</TabsTrigger>
            <TabsTrigger value="clients" className="flex-1">Clientes</TabsTrigger>
          </TabsList>

          {/* Contents Tab */}
          <TabsContent value="contents" className="space-y-4 mt-4">
            {contents && contents.length > 0 ? (
              contents.map((content) => (
                <Link key={content.id} href={`/content/${content.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {content.type === "carousel" && <Layers className="w-5 h-5 text-primary" />}
                        {content.type === "image" && <Image className="w-5 h-5 text-primary" />}
                        {content.type === "video" && <Video className="w-5 h-5 text-primary" />}
                        <div>
                          <div className="font-medium">{content.title || "Sem título"}</div>
                          <div className="text-xs text-muted-foreground">{content.template}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum conteúdo ainda</p>
                <Button variant="link" onClick={() => setShowGenerator(true)}>
                  Gerar primeiro conteúdo
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Pains Tab */}
          <TabsContent value="pains" className="space-y-4 mt-4">
            {project.pains && project.pains.length > 0 ? (
              <>
                {["primary", "secondary", "unexplored"].map((level) => {
                  const levelPains = project.pains?.filter(p => p.level === level) || [];
                  if (levelPains.length === 0) return null;
                  
                  const levelConfig = {
                    primary: { 
                      title: "Dores Principais", 
                      description: "Problemas óbvios e urgentes que o cliente já sabe que tem",
                      color: "bg-red-500/10 border-red-500/30 text-red-500",
                      icon: "\uD83D\uDD25"
                    },
                    secondary: { 
                      title: "Dores Secundárias", 
                      description: "Problemas relacionados mas menos urgentes",
                      color: "bg-orange-500/10 border-orange-500/30 text-orange-500",
                      icon: "\u26A0\uFE0F"
                    },
                    unexplored: { 
                      title: "Dores Inexploradas", 
                      description: "Oportunidades! Pouco conteúdo sobre isso nas redes",
                      color: "bg-green-500/10 border-green-500/30 text-green-500",
                      icon: "\uD83D\uDCA1"
                    }
                  }[level];
                  
                  return (
                    <div key={level} className="space-y-3">
                      <div className={`p-3 rounded-lg border ${levelConfig?.color}`}>
                        <div className="flex items-center gap-2">
                          <span>{levelConfig?.icon}</span>
                          <div>
                            <h3 className="font-medium">{levelConfig?.title}</h3>
                            <p className="text-xs opacity-80">{levelConfig?.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pl-2">
                        {levelPains.map((pain) => (
                          <Card key={pain.id} className="bg-card/50 hover:bg-card transition-colors">
                            <CardContent className="p-3">
                              <div className="font-medium text-sm">{pain.pain}</div>
                              {pain.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {pain.description}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma dor mapeada</p>
              </div>
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4 mt-4">
            {project.idealClients && project.idealClients.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{project.idealClients.filter(c => c.isSelected).length} selecionado(s)</span>
                  <span>{project.idealClients.length} total</span>
                </div>
                {project.idealClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className={`transition-all ${
                      client.isSelected 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-card/50 opacity-60"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{client.name}</span>
                            {client.isSelected && (
                              <Badge variant="secondary" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Selecionado
                              </Badge>
                            )}
                          </div>
                          {client.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {client.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente ideal mapeado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-x-0 bottom-0 bg-background border-t border-border rounded-t-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg">Gerar Conteúdo</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowGenerator(false)}>
                Fechar
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Fonte do Conteúdo */}
              <div className="space-y-2">
                <Label>Fonte do Conteúdo</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={contentSource === "pains" ? "default" : "outline"}
                    onClick={() => { setContentSource("pains"); setSelectedSourceIds([]); }}
                    className="flex-col h-auto py-3"
                  >
                    <Target className="w-5 h-5 mb-1" />
                    <span className="text-xs">Dores</span>
                  </Button>
                  <Button
                    variant={contentSource === "trends" ? "default" : "outline"}
                    onClick={() => { setContentSource("trends"); setSelectedSourceIds([]); }}
                    className="flex-col h-auto py-3"
                  >
                    <TrendingUp className="w-5 h-5 mb-1" />
                    <span className="text-xs">Trends</span>
                  </Button>
                  <Button
                    variant={contentSource === "virals" ? "default" : "outline"}
                    onClick={() => { setContentSource("virals"); setSelectedSourceIds([]); }}
                    className="flex-col h-auto py-3"
                  >
                    <Flame className="w-5 h-5 mb-1" />
                    <span className="text-xs">Virais</span>
                  </Button>
                </div>
              </div>

              {/* Lista de Fontes com Checkbox */}
              <div className="space-y-2">
                <Label>
                  Selecione {contentSource === "pains" ? "as Dores" : contentSource === "trends" ? "as Trends" : "os Virais"}
                </Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {sources.length > 0 ? (
                    sources.map((source) => (
                      <div
                        key={source.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedSourceIds.includes(source.id) ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                        onClick={() => toggleSourceSelection(source.id)}
                      >
                        <Checkbox 
                          checked={selectedSourceIds.includes(source.id)}
                          onCheckedChange={() => toggleSourceSelection(source.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{source.name}</div>
                          {source.level && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {source.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {contentSource === "pains" && "Nenhuma dor mapeada"}
                      {contentSource === "trends" && "Nenhuma trend coletada. Vá em Trends para coletar."}
                      {contentSource === "virals" && "Nenhum viral coletado. Vá em Virais para coletar."}
                    </div>
                  )}
                </div>
                {selectedSourceIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedSourceIds.length} selecionado(s)
                  </p>
                )}
              </div>

              {/* Tipo de Conteúdo */}
              <div className="space-y-2">
                <Label>Tipo de Conteúdo</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={currentContentType === "carousel" ? "default" : "outline"}
                    onClick={() => { setCurrentContentType("carousel"); setCurrentTemplate(""); }}
                    className="flex-col h-auto py-3"
                  >
                    <Layers className="w-5 h-5 mb-1" />
                    <span className="text-xs">Carrossel</span>
                  </Button>
                  <Button
                    variant={currentContentType === "image" ? "default" : "outline"}
                    onClick={() => { setCurrentContentType("image"); setCurrentTemplate(""); }}
                    className="flex-col h-auto py-3"
                  >
                    <Image className="w-5 h-5 mb-1" />
                    <span className="text-xs">Imagem</span>
                  </Button>
                  <Button
                    variant={currentContentType === "video" ? "default" : "outline"}
                    onClick={() => { setCurrentContentType("video"); setCurrentTemplate(""); }}
                    className="flex-col h-auto py-3"
                  >
                    <Video className="w-5 h-5 mb-1" />
                    <span className="text-xs">Vídeo</span>
                  </Button>
                </div>
              </div>

              {/* Template */}
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={currentTemplate} onValueChange={setCurrentTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label>Quantidade por seleção</Label>
                <div className="flex gap-2">
                  {[1, 3, 5, 10].map((q) => (
                    <Button
                      key={q}
                      variant={currentQuantity === q ? "default" : "outline"}
                      onClick={() => setCurrentQuantity(q)}
                      className="flex-1"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template Visual (BrandsDecoded Style) */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Template Visual</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowVisualTemplates(!showVisualTemplates)}
                  >
                    {showVisualTemplates ? "Fechar" : "Escolher Estilo"}
                  </Button>
                </div>
                
                {showVisualTemplates && (
                  <div className="space-y-4">
                    <TemplateSelector
                      selectedId={visualTemplate}
                      onSelect={setVisualTemplate}
                      text={selectedSourceIds.length > 0 
                        ? sources.find(s => s.id === selectedSourceIds[0])?.name || ""
                        : ""
                      }
                      onAutoSelect={(templateId, colorId) => {
                        setVisualTemplate(templateId);
                        setAccentColor(colorId);
                      }}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs">Cor de Destaque</Label>
                      <AccentColorSelector
                        selectedId={accentColor}
                        onSelect={setAccentColor}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Adicionar */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleAddSelection}
                disabled={selectedSourceIds.length === 0 || !currentTemplate}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar à Lista
              </Button>

              {/* Lista de Seleções */}
              {selections.length > 0 && (
                <div className="space-y-2">
                  <Label>Lista de Conteúdos ({totalContents} total)</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selections.map((selection) => (
                      <div 
                        key={selection.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{selection.sourceName}</div>
                          <div className="text-xs text-muted-foreground">
                            {selection.templateName} × {selection.quantity}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveSelection(selection.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configurações Globais */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Configurações Globais</h3>
                
                {/* Objetivo */}
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Select value={objective} onValueChange={(v) => setObjective(v as typeof objective)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="authority">Autoridade</SelectItem>
                      <SelectItem value="growth">Crescimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pessoa */}
                <div className="space-y-2">
                  <Label>Pessoa Gramatical</Label>
                  <Select value={person} onValueChange={(v) => setPerson(v as typeof person)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">1ª Pessoa (Eu)</SelectItem>
                      <SelectItem value="second">2ª Pessoa (Você)</SelectItem>
                      <SelectItem value="third">3ª Pessoa (Ele/Ela)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clickbait */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Clickbait</Label>
                    <p className="text-xs text-muted-foreground">Títulos mais chamativos</p>
                  </div>
                  <Switch checked={clickbait} onCheckedChange={setClickbait} />
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleGenerateAll}
                disabled={generateContent.isPending || selections.length === 0}
              >
                {generateContent.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Gerar {totalContents} Conteúdo{totalContents > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
