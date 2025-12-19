import { useState, useEffect, useCallback, useRef } from "react";
import { designTemplates, colorPalettes } from "../../../shared/designTemplates";
// Removido html2canvas - usando Canvas API nativo com proxy
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Type, Palette, Settings2, AlignLeft, AlignCenter, AlignRight, 
  ChevronUp, ChevronDown, Save, RotateCcw, Download, Loader2
} from "lucide-react";
import { toast } from "sonner";

export interface SlideStyle {
  // Básico
  showText: boolean;
  textAlign: "left" | "center" | "right";
  positionY: number; // 0-100
  fontSize: number; // 16-72
  fontFamily: string;
  
  // Cores
  textColor: string;
  backgroundColor: string;
  overlayOpacity: number; // 0-100
  
  // Avançado
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  
  borderEnabled: boolean;
  borderColor: string;
  borderWidth: number;
  
  glowEnabled: boolean;
  glowColor: string;
  glowIntensity: number;
  
  letterSpacing: number;
  lineHeight: number;
  padding: number;
  marginLeft: number; // Margem esquerda em pixels
  marginRight: number; // Margem direita em pixels
}

const DEFAULT_STYLE: SlideStyle = {
  showText: true,
  textAlign: "center",
  positionY: 20,
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

const COLOR_PRESETS = [
  { name: "Branco", text: "#FFFFFF", bg: "#1a1a2e" },
  { name: "Neon Verde", text: "#39FF14", bg: "#0a0a0a" },
  { name: "Neon Rosa", text: "#FF10F0", bg: "#0a0a0a" },
  { name: "Amarelo", text: "#FFFF00", bg: "#0a0a0a" },
  { name: "Laranja", text: "#FF6B00", bg: "#0a0a0a" },
  { name: "Azul", text: "#00D4FF", bg: "#0a0a0a" },
  { name: "Roxo", text: "#A855F7", bg: "#1a1a2e" },
  { name: "Vermelho", text: "#FF0000", bg: "#0a0a0a" },
];

interface SlideComposerProps {
  text: string;
  imageUrl?: string;
  style: SlideStyle;
  templateId?: string;
  paletteId?: string;
  logoUrl?: string;
  slideIndex?: number;
  slideId?: number; // ID do slide para salvar no banco
  onStyleChange: (style: SlideStyle) => void;
  onTextChange: (text: string) => void;
  onDownload: (withText: boolean) => void;
  onSave?: (style: SlideStyle) => Promise<void>; // Callback para salvar no banco
}

export default function SlideComposer({
  text,
  imageUrl,
  style,
  templateId,
  paletteId,
  logoUrl,
  slideIndex = 0,
  slideId,
  onStyleChange,
  onTextChange,
  onDownload,
  onSave,
}: SlideComposerProps) {
  // Obter template e paleta
  const template = templateId ? designTemplates.find(t => t.id === templateId) : designTemplates[0];
  const palette = paletteId ? colorPalettes.find(p => p.id === paletteId) : null;
  
  // Inicializar localStyle com valores salvos ou do template/paleta
  const getInitialStyle = useCallback((): SlideStyle => {
    // Se já existe um estilo salvo no banco, usar ele
    if (style && Object.keys(style).length > 0 && style.textColor) {
      return { ...DEFAULT_STYLE, ...style };
    }
    
    // Caso contrário, usar cores do template/paleta
    const colors = {
      background: palette?.colors.background || template?.colors.background || "#1a1a2e",
      text: palette?.colors.text || template?.colors.text || "#FFFFFF",
    };
    
    return {
      ...DEFAULT_STYLE,
      backgroundColor: colors.background,
      textColor: colors.text,
    };
  }, [template, palette, style]);
  
  const [localStyle, setLocalStyle] = useState<SlideStyle>(getInitialStyle);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basico");
  const [initialized, setInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Ref para o preview - usado para capturar a imagem com html2canvas
  const previewRef = useRef<HTMLDivElement>(null);

  // Inicializar quando o slide mudar (slideId diferente)
  useEffect(() => {
    setLocalStyle(getInitialStyle());
    setHasUnsavedChanges(false);
  }, [slideId]); // Reinicializar quando mudar de slide

  const updateStyle = useCallback((updates: Partial<SlideStyle>) => {
    const newStyle = { ...localStyle, ...updates };
    setLocalStyle(newStyle);
    setHasUnsavedChanges(true);
    onStyleChange(newStyle);
  }, [localStyle, onStyleChange]);

  const saveAsDefault = () => {
    localStorage.setItem("gerador3_default_style", JSON.stringify(localStyle));
    toast.success("Estilo salvo como padrão!");
  };

  const loadDefault = () => {
    const saved = localStorage.getItem("gerador3_default_style");
    if (saved) {
      const parsed = JSON.parse(saved);
      setLocalStyle(parsed);
      onStyleChange(parsed);
      toast.success("Estilo padrão carregado!");
    } else {
      toast.info("Nenhum estilo padrão salvo.");
    }
  };

  const resetStyle = () => {
    const initial = getInitialStyle();
    setLocalStyle(initial);
    onStyleChange(initial);
    setHasUnsavedChanges(true);
    toast.success("Estilo resetado!");
  };

  // Salvar edição no banco de dados
  const handleSave = async () => {
    if (!onSave) {
      toast.error("Função de salvamento não disponível");
      return;
    }
    
    setSaving(true);
    try {
      await onSave(localStyle);
      setHasUnsavedChanges(false);
      toast.success("Edição salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar edição");
    } finally {
      setSaving(false);
    }
  };

  // Download usando Canvas API nativo com proxy (conforme PDF Sistema-Downloads-Completo)
  const handleDownload = async (withText: boolean) => {
    setDownloading(true);
    
    try {
      // ETAPA 1: Criar canvas com dimensões fixas
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }
      
      // ETAPA 2: Preencher fundo com cor de fundo
      ctx.fillStyle = localStyle.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // ETAPA 3: Carregar imagem via proxy (se existir)
      console.log('imageUrl:', imageUrl);
      if (imageUrl) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
        console.log('proxyUrl:', proxyUrl);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            console.log('Imagem carregada:', img.width, 'x', img.height);
            resolve();
          };
          img.onerror = (e) => {
            console.error('Erro ao carregar imagem:', e);
            reject(new Error('Falha ao carregar imagem'));
          };
          img.src = proxyUrl;
        });
        
        // Calcular posição da imagem baseado no template
        const template = designTemplates.find(t => t.id === templateId);
        console.log('Template:', templateId, template?.name);
        const frame = template?.imageFrame || { x: 0, y: 0, width: 100, height: 60 };
        console.log('Frame:', frame);
        
        // Função para converter valor (número ou string com %) para pixels
        const toPixels = (value: string | number, total: number): number => {
          if (typeof value === 'string') {
            // Remove % e converte para número
            const num = parseFloat(value.replace('%', ''));
            return (num / 100) * total;
          }
          return (value / 100) * total;
        };
        
        const frameX = toPixels(frame.x, canvas.width);
        const frameY = toPixels(frame.y, canvas.height);
        const frameW = toPixels(frame.width, canvas.width);
        const frameH = toPixels(frame.height, canvas.height);
        console.log('Frame pixels:', { frameX, frameY, frameW, frameH });
        
        // Desenhar imagem com cover (manter proporção)
        const imgRatio = img.width / img.height;
        const frameRatio = frameW / frameH;
        let drawW, drawH, drawX, drawY;
        
        if (imgRatio > frameRatio) {
          drawH = frameH;
          drawW = frameH * imgRatio;
          drawX = frameX - (drawW - frameW) / 2;
          drawY = frameY;
        } else {
          drawW = frameW;
          drawH = frameW / imgRatio;
          drawX = frameX;
          drawY = frameY - (drawH - frameH) / 2;
        }
        
        // Clip para manter imagem dentro do frame
        ctx.save();
        ctx.beginPath();
        const borderRadius = template?.imageFrame?.borderRadius ? (Number(template.imageFrame.borderRadius) / 100) * Math.min(frameW, frameH) : 0;
        ctx.roundRect(frameX, frameY, frameW, frameH, borderRadius);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      }
      
      // ETAPA 4: Adicionar overlay/gradiente se configurado
      if (localStyle.overlayOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${localStyle.overlayOpacity / 100})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // ETAPA 5: Desenhar texto (se withText for true)
      if (withText && localStyle.showText && text) {
        // Configurar fonte
        ctx.fillStyle = localStyle.textColor;
        ctx.font = `bold ${localStyle.fontSize * 2}px ${localStyle.fontFamily}`;
        ctx.textAlign = localStyle.textAlign;
        ctx.textBaseline = 'middle';
        
        // Configurar sombra
        if (localStyle.shadowEnabled) {
          ctx.shadowColor = localStyle.shadowColor;
          ctx.shadowBlur = localStyle.shadowBlur * 2;
          ctx.shadowOffsetX = localStyle.shadowOffsetX * 2;
          ctx.shadowOffsetY = localStyle.shadowOffsetY * 2;
        }
        
        // Calcular área de texto com margens
        const textAreaLeft = localStyle.marginLeft * 2;
        const textAreaRight = canvas.width - (localStyle.marginRight * 2);
        const maxWidth = textAreaRight - textAreaLeft;
        
        // Quebrar texto em linhas
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0] || '';
        
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        // Calcular posição Y baseada no positionY
        const lineHeight = localStyle.fontSize * 2 * localStyle.lineHeight;
        const totalTextHeight = lines.length * lineHeight;
        const startY = (localStyle.positionY / 100) * canvas.height;
        
        // Calcular X baseado no alinhamento e margens
        let textX: number;
        if (localStyle.textAlign === 'left') {
          textX = textAreaLeft;
        } else if (localStyle.textAlign === 'right') {
          textX = textAreaRight;
        } else {
          textX = textAreaLeft + maxWidth / 2;
        }
        
        // Desenhar cada linha
        lines.forEach((line, index) => {
          const y = startY + (index - (lines.length - 1) / 2) * lineHeight;
          ctx.fillText(line, textX, y);
        });
        
        // Resetar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // ETAPA 6: Converter para PNG e fazer download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `slide_${slideIndex + 1}${withText ? '_com_texto' : '_sem_texto'}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Download iniciado!");
        }
      }, 'image/png');
      
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao baixar slide");
    } finally {
      setDownloading(false);
    }
  };

  // Calcular estilos do texto baseados no localStyle
  const getTextStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${localStyle.marginLeft}px`,
      right: `${localStyle.marginRight}px`,
      top: `${localStyle.positionY}%`,
      transform: 'translateY(-50%)',
      textAlign: localStyle.textAlign,
      color: localStyle.textColor,
      fontSize: `${localStyle.fontSize}px`,
      fontFamily: localStyle.fontFamily,
      fontWeight: 700,
      lineHeight: localStyle.lineHeight,
      letterSpacing: `${localStyle.letterSpacing}px`,
      paddingTop: `${localStyle.padding}px`,
      paddingBottom: `${localStyle.padding}px`,
    };

    // Sombra
    if (localStyle.shadowEnabled) {
      baseStyles.textShadow = `${localStyle.shadowOffsetX}px ${localStyle.shadowOffsetY}px ${localStyle.shadowBlur}px ${localStyle.shadowColor}`;
    }

    // Glow
    if (localStyle.glowEnabled) {
      const glowShadow = `0 0 ${localStyle.glowIntensity}px ${localStyle.glowColor}`;
      baseStyles.textShadow = baseStyles.textShadow 
        ? `${baseStyles.textShadow}, ${glowShadow}` 
        : glowShadow;
    }

    // Borda do texto (usando text-stroke)
    if (localStyle.borderEnabled) {
      baseStyles.WebkitTextStroke = `${localStyle.borderWidth}px ${localStyle.borderColor}`;
    }

    return baseStyles;
  };

  // Obter posição da imagem do template
  const getImageFrame = () => {
    if (!template) return null;
    return template.imageFrame;
  };

  const imageFrame = getImageFrame();

  return (
    <div className="flex flex-col h-full">
      {/* Preview Fixo no Topo - Menor e sempre visível */}
      <div className="sticky top-0 z-10 bg-background pb-2 border-b border-border mb-2">
        <div 
          ref={previewRef}
          className="relative aspect-[4/5] rounded-lg overflow-hidden mx-auto"
          style={{ 
            backgroundColor: localStyle.backgroundColor,
            width: "100%",
            maxWidth: "200px"
          }}
        >
        {/* Imagem na moldura do template */}
        {imageUrl && imageFrame && imageFrame.position !== 'none' && (
          <div
            style={{
              position: 'absolute',
              left: imageFrame.x,
              top: imageFrame.y,
              width: imageFrame.width,
              height: imageFrame.height,
              borderRadius: imageFrame.borderRadius,
              overflow: 'hidden'
            }}
          >
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: imageFrame.objectFit || 'cover'
              }}
            />
          </div>
        )}

        {/* Overlay */}
        {localStyle.overlayOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,${localStyle.overlayOpacity / 100}) 100%)`
            }}
          />
        )}

        {/* Texto customizado */}
        {localStyle.showText && text && (
          <div style={getTextStyles()}>
            {text}
          </div>
        )}

        {/* Logo */}
        {logoUrl && template?.logoPosition !== 'none' && (
          <img
            src={logoUrl}
            alt="Logo"
            className="absolute w-[8%] h-auto"
            style={getLogoPositionStyles(template?.logoPosition || 'bottom-right')}
          />
        )}
        </div>
      </div>

      {/* Área de Controles com Scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1">

      {/* Info do template */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Template: {template?.name || 'Padrão'}</span>
        <span>Paleta: {palette?.name || 'Padrão'}</span>
      </div>

      {/* Tabs de Edição */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="basico" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="cores" className="text-xs">
            <Palette className="w-3 h-3 mr-1" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="avancado" className="text-xs">
            <Settings2 className="w-3 h-3 mr-1" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Aba Básico */}
        <TabsContent value="basico" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input 
              value={text} 
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Digite o texto do slide"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Mostrar Texto</Label>
            <Switch 
              checked={localStyle.showText} 
              onCheckedChange={(v) => updateStyle({ showText: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>Alinhamento</Label>
            <div className="flex gap-2">
              {[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={localStyle.textAlign === value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => updateStyle({ textAlign: value as SlideStyle["textAlign"] })}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Posição Vertical</Label>
              <span className="text-xs text-muted-foreground">{localStyle.positionY}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateStyle({ positionY: Math.max(0, localStyle.positionY - 5) })}>
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Slider 
                value={[localStyle.positionY]} 
                onValueChange={([v]) => updateStyle({ positionY: v })}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateStyle({ positionY: Math.min(100, localStyle.positionY + 5) })}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tamanho da Fonte</Label>
              <span className="text-xs text-muted-foreground">{localStyle.fontSize}px</span>
            </div>
            <Slider 
              value={[localStyle.fontSize]} 
              onValueChange={([v]) => updateStyle({ fontSize: v })}
              min={16}
              max={72}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Margem Esquerda</Label>
              <span className="text-xs text-muted-foreground">{localStyle.marginLeft}px</span>
            </div>
            <Slider 
              value={[localStyle.marginLeft]} 
              onValueChange={([v]) => updateStyle({ marginLeft: v })}
              min={0}
              max={200}
              step={4}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Margem Direita</Label>
              <span className="text-xs text-muted-foreground">{localStyle.marginRight}px</span>
            </div>
            <Slider 
              value={[localStyle.marginRight]} 
              onValueChange={([v]) => updateStyle({ marginRight: v })}
              min={0}
              max={200}
              step={4}
            />
          </div>
        </TabsContent>

        {/* Aba Cores */}
        <TabsContent value="cores" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Presets de Cores</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateStyle({ textColor: preset.text, backgroundColor: preset.bg })}
                  className="p-2 rounded-lg border hover:border-primary transition-colors"
                  style={{ background: preset.bg }}
                >
                  <span style={{ color: preset.text }} className="text-xs font-bold">
                    Aa
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do Texto</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localStyle.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={localStyle.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor de Fundo</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localStyle.backgroundColor}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Input
                value={localStyle.backgroundColor}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opacidade do Overlay</Label>
              <span className="text-xs text-muted-foreground">{localStyle.overlayOpacity}%</span>
            </div>
            <Slider 
              value={[localStyle.overlayOpacity]} 
              onValueChange={([v]) => updateStyle({ overlayOpacity: v })}
              min={0}
              max={100}
            />
          </div>
        </TabsContent>

        {/* Aba Avançado */}
        <TabsContent value="avancado" className="space-y-4 mt-4">
          {/* Sombra */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Sombra</Label>
              <Switch 
                checked={localStyle.shadowEnabled} 
                onCheckedChange={(v) => updateStyle({ shadowEnabled: v })}
              />
            </div>
            {localStyle.shadowEnabled && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localStyle.shadowColor}
                    onChange={(e) => updateStyle({ shadowColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs">Blur</span>
                      <span className="text-xs text-muted-foreground">{localStyle.shadowBlur}px</span>
                    </div>
                    <Slider 
                      value={[localStyle.shadowBlur]} 
                      onValueChange={([v]) => updateStyle({ shadowBlur: v })}
                      min={0}
                      max={20}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Glow */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Glow (Brilho)</Label>
              <Switch 
                checked={localStyle.glowEnabled} 
                onCheckedChange={(v) => updateStyle({ glowEnabled: v })}
              />
            </div>
            {localStyle.glowEnabled && (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localStyle.glowColor}
                  onChange={(e) => updateStyle({ glowColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Intensidade</span>
                    <span className="text-xs text-muted-foreground">{localStyle.glowIntensity}px</span>
                  </div>
                  <Slider 
                    value={[localStyle.glowIntensity]} 
                    onValueChange={([v]) => updateStyle({ glowIntensity: v })}
                    min={0}
                    max={30}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Borda do Texto */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Contorno do Texto</Label>
              <Switch 
                checked={localStyle.borderEnabled} 
                onCheckedChange={(v) => updateStyle({ borderEnabled: v })}
              />
            </div>
            {localStyle.borderEnabled && (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localStyle.borderColor}
                  onChange={(e) => updateStyle({ borderColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Espessura</span>
                    <span className="text-xs text-muted-foreground">{localStyle.borderWidth}px</span>
                  </div>
                  <Slider 
                    value={[localStyle.borderWidth]} 
                    onValueChange={([v]) => updateStyle({ borderWidth: v })}
                    min={1}
                    max={5}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Espaçamento */}
          <div className="space-y-3 p-3 rounded-lg bg-muted/50">
            <Label>Espaçamento</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-sm">Entre Letras</Label>
                  <span className="text-xs text-muted-foreground">{localStyle.letterSpacing}px</span>
                </div>
                <Slider 
                  value={[localStyle.letterSpacing]} 
                  onValueChange={([v]) => updateStyle({ letterSpacing: v })}
                  min={-5}
                  max={20}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-sm">Entre Linhas</Label>
                  <span className="text-xs text-muted-foreground">{localStyle.lineHeight.toFixed(1)}</span>
                </div>
                <Slider 
                  value={[localStyle.lineHeight * 10]} 
                  onValueChange={([v]) => updateStyle({ lineHeight: v / 10 })}
                  min={8}
                  max={25}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-sm">Padding</Label>
                  <span className="text-xs text-muted-foreground">{localStyle.padding}px</span>
                </div>
                <Slider 
                  value={[localStyle.padding]} 
                  onValueChange={([v]) => updateStyle({ padding: v })}
                  min={0}
                  max={60}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      </div>

      {/* Ações - Fixas na parte inferior */}
      <div className="sticky bottom-0 bg-background pt-2 border-t border-border space-y-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={saveAsDefault} className="flex-1">
          <Save className="w-3 h-3 mr-1" />
          Salvar Padrão
        </Button>
        <Button variant="outline" size="sm" onClick={loadDefault} className="flex-1">
          <RotateCcw className="w-3 h-3 mr-1" />
          Carregar Padrão
        </Button>
      </div>

      {/* Botão Salvar Edição - destaque quando há mudanças não salvas */}
      {onSave && (
        <Button 
          onClick={handleSave} 
          className={`w-full ${hasUnsavedChanges ? 'bg-primary hover:bg-primary/90' : ''}`}
          variant={hasUnsavedChanges ? 'default' : 'outline'}
          disabled={saving || !hasUnsavedChanges}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {hasUnsavedChanges ? 'Salvar Edição *' : 'Edição Salva'}
        </Button>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={() => handleDownload(true)} 
          className="flex-1"
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Com Texto
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleDownload(false)} 
          className="flex-1"
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Sem Texto
        </Button>
      </div>
      </div>
    </div>
  );
}

// Função auxiliar para posição do logo
function getLogoPositionStyles(position: string): React.CSSProperties {
  const padding = '3%';
  const styles: Record<string, React.CSSProperties> = {
    'top-left': { top: padding, left: padding },
    'top-right': { top: padding, right: padding },
    'bottom-left': { bottom: padding, left: padding },
    'bottom-right': { bottom: padding, right: padding }
  };
  return styles[position] || styles['bottom-right'];
}
