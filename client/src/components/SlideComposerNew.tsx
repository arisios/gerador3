import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Minus, Trash2, Download, Move, Type, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic
} from "lucide-react";

// Tipos
interface TextBlock {
  id: string;
  text: string;
  x: number; // 0-100 (percentual)
  y: number; // 0-100 (percentual)
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  textAlign: "left" | "center" | "right";
  // Sombra
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Borda/Contorno
  borderEnabled: boolean;
  borderColor: string;
  borderWidth: number;
  // Glow
  glowEnabled: boolean;
  glowColor: string;
  glowIntensity: number;
  // Espaçamento
  letterSpacing: number;
  lineHeight: number;
  // Fundo do texto
  bgEnabled: boolean;
  bgColor: string;
  bgPadding: number;
}

interface ImageSettings {
  x: number; // 0-100
  y: number; // 0-100
  width: number; // 0-100
  height: number; // 0-100
}

interface SlideComposerNewProps {
  imageUrl?: string;
  initialText?: string;
  backgroundColor?: string;
  onSave?: (data: SaveData) => Promise<void>;
  slideIndex?: number;
}

interface SaveData {
  textBlocks: TextBlock[];
  imageSettings: ImageSettings;
  backgroundColor: string;
}

// Valores padrão
const DEFAULT_TEXT_BLOCK: Omit<TextBlock, "id"> = {
  text: "Seu texto aqui",
  x: 50,
  y: 75,
  fontSize: 28,
  color: "#FFFFFF",
  fontFamily: "Inter",
  fontWeight: "bold",
  textAlign: "center",
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
  bgEnabled: false,
  bgColor: "#000000",
  bgPadding: 8,
};

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  x: 0,
  y: 0,
  width: 100,
  height: 60,
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

const FONT_FAMILIES = [
  "Inter",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Impact",
];

// Gerar ID único
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function SlideComposerNew({
  imageUrl,
  initialText = "",
  backgroundColor: initialBgColor = "#1a1a2e",
  onSave,
  slideIndex = 0,
}: SlideComposerNewProps) {
  // Estados
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([
    { ...DEFAULT_TEXT_BLOCK, id: generateId(), text: initialText || "Seu texto aqui" }
  ]);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [backgroundColor, setBackgroundColor] = useState(initialBgColor);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("basico");
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Atualizar texto inicial quando mudar
  useEffect(() => {
    if (initialText && textBlocks.length > 0) {
      setTextBlocks(prev => [
        { ...prev[0], text: initialText },
        ...prev.slice(1)
      ]);
    }
  }, [initialText]);
  
  // Bloco de texto selecionado
  const selectedTextBlock = textBlocks.find(b => b.id === selectedElement);
  
  // Funções de manipulação de texto
  const addTextBlock = () => {
    const newBlock: TextBlock = {
      ...DEFAULT_TEXT_BLOCK,
      id: generateId(),
      text: "Novo texto",
      y: 50 + textBlocks.length * 10,
    };
    setTextBlocks([...textBlocks, newBlock]);
    setSelectedElement(newBlock.id);
  };
  
  const removeTextBlock = (id: string) => {
    if (textBlocks.length <= 1) {
      toast.error("Deve haver pelo menos um bloco de texto");
      return;
    }
    setTextBlocks(textBlocks.filter(b => b.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };
  
  const updateTextBlock = (id: string, updates: Partial<TextBlock>) => {
    setTextBlocks(textBlocks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };
  
  // Funções de drag
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (elementId === "image") {
      setDragOffset({ x: x - imageSettings.x, y: y - imageSettings.y });
    } else {
      const block = textBlocks.find(b => b.id === elementId);
      if (block) {
        setDragOffset({ x: x - block.x, y: y - block.y });
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y));
    
    if (selectedElement === "image") {
      setImageSettings(prev => ({ ...prev, x, y }));
    } else {
      updateTextBlock(selectedElement, { x, y });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Touch events
  const handleTouchStart = (e: React.TouchEvent, elementId: string) => {
    const touch = e.touches[0];
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    if (elementId === "image") {
      setDragOffset({ x: x - imageSettings.x, y: y - imageSettings.y });
    } else {
      const block = textBlocks.find(b => b.id === elementId);
      if (block) {
        setDragOffset({ x: x - block.x, y: y - block.y });
      }
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100 - dragOffset.x));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100 - dragOffset.y));
    
    if (selectedElement === "image") {
      setImageSettings(prev => ({ ...prev, x, y }));
    } else {
      updateTextBlock(selectedElement, { x, y });
    }
  };
  
  // Download
  const handleDownload = async (withText: boolean) => {
    if (downloading) return;
    setDownloading(true);
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Canvas não suportado");
      }
      
      // 1. Preencher fundo
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Desenhar imagem (se existir)
      if (imageUrl) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
        
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              console.log("Imagem carregada:", img.width, "x", img.height);
              resolve();
            };
            img.onerror = (err) => {
              console.error("Erro ao carregar imagem:", err);
              reject(new Error("Falha ao carregar imagem"));
            };
            img.src = proxyUrl;
          });
          
          // Calcular posição e tamanho da imagem
          const imgX = (imageSettings.x / 100) * canvas.width;
          const imgY = (imageSettings.y / 100) * canvas.height;
          const imgWidth = (imageSettings.width / 100) * canvas.width;
          const imgHeight = (imageSettings.height / 100) * canvas.height;
          
          console.log("Desenhando imagem em:", imgX, imgY, imgWidth, imgHeight);
          
          // Desenhar imagem com cover (manter proporção)
          const imgRatio = img.width / img.height;
          const frameRatio = imgWidth / imgHeight;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgRatio > frameRatio) {
            drawHeight = imgHeight;
            drawWidth = imgHeight * imgRatio;
            drawX = imgX + (imgWidth - drawWidth) / 2;
            drawY = imgY;
          } else {
            drawWidth = imgWidth;
            drawHeight = imgWidth / imgRatio;
            drawX = imgX;
            drawY = imgY + (imgHeight - drawHeight) / 2;
          }
          
          // Clip para a área da imagem
          ctx.save();
          ctx.beginPath();
          ctx.rect(imgX, imgY, imgWidth, imgHeight);
          ctx.clip();
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
          
        } catch (imgError) {
          console.error("Erro ao processar imagem:", imgError);
          toast.error("Erro ao carregar imagem, continuando sem ela");
        }
      }
      
      // 3. Desenhar textos (se withText)
      if (withText) {
        const scale = canvas.width / 360; // Escala do preview para o canvas
        
        for (const block of textBlocks) {
          if (!block.text.trim()) continue;
          
          const fontSize = block.fontSize * scale;
          
          ctx.font = `${block.fontWeight} ${fontSize}px ${block.fontFamily}, sans-serif`;
          ctx.fillStyle = block.color;
          ctx.textAlign = block.textAlign;
          ctx.textBaseline = "middle";
          
          // Posição do texto
          let textX: number;
          if (block.textAlign === "center") {
            textX = canvas.width / 2;
          } else if (block.textAlign === "right") {
            textX = canvas.width - 40;
          } else {
            textX = 40;
          }
          const textY = (block.y / 100) * canvas.height;
          
          // Quebrar texto em linhas
          const maxWidth = canvas.width * 0.9;
          const words = block.text.split(" ");
          const lines: string[] = [];
          let currentLine = words[0] || "";
          
          for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + " " + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          // Calcular altura total
          const lineHeight = fontSize * block.lineHeight;
          const totalHeight = lines.length * lineHeight;
          const startY = textY - totalHeight / 2 + lineHeight / 2;
          
          // Desenhar fundo do texto (se habilitado)
          if (block.bgEnabled) {
            ctx.save();
            ctx.fillStyle = block.bgColor;
            const padding = block.bgPadding * scale;
            
            lines.forEach((line, index) => {
              const metrics = ctx.measureText(line);
              const lineY = startY + index * lineHeight;
              let bgX = textX - metrics.width / 2 - padding;
              if (block.textAlign === "left") bgX = textX - padding;
              if (block.textAlign === "right") bgX = textX - metrics.width - padding;
              
              ctx.fillRect(
                bgX,
                lineY - fontSize / 2 - padding / 2,
                metrics.width + padding * 2,
                fontSize + padding
              );
            });
            ctx.restore();
          }
          
          // Configurar sombra
          if (block.shadowEnabled) {
            ctx.shadowColor = block.shadowColor;
            ctx.shadowBlur = block.shadowBlur * scale;
            ctx.shadowOffsetX = block.shadowOffsetX * scale;
            ctx.shadowOffsetY = block.shadowOffsetY * scale;
          }
          
          // Configurar glow
          if (block.glowEnabled) {
            ctx.shadowColor = block.glowColor;
            ctx.shadowBlur = block.glowIntensity * scale;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }
          
          // Desenhar borda/contorno primeiro
          if (block.borderEnabled) {
            ctx.strokeStyle = block.borderColor;
            ctx.lineWidth = block.borderWidth * scale;
            ctx.lineJoin = "round";
            
            lines.forEach((line, index) => {
              ctx.strokeText(line, textX, startY + index * lineHeight);
            });
          }
          
          // Desenhar texto
          ctx.fillStyle = block.color;
          lines.forEach((line, index) => {
            ctx.fillText(line, textX, startY + index * lineHeight);
          });
          
          // Resetar sombra
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      }
      
      // 4. Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `slide_${slideIndex + 1}${withText ? "_com_texto" : "_sem_texto"}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Download iniciado!");
        }
      }, "image/png", 1.0);
      
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao gerar imagem");
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Move className="w-4 h-4" />
              Preview (arraste para mover)
            </h3>
            <div className="text-xs text-muted-foreground">
              Slide {slideIndex + 1}
            </div>
          </div>
          
          <div
            ref={canvasRef}
            className="relative w-full aspect-[4/5] rounded-lg overflow-hidden cursor-crosshair select-none"
            style={{ backgroundColor }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Imagem */}
            {imageUrl && (
              <div
                className={`absolute cursor-move ${selectedElement === "image" ? "ring-2 ring-primary ring-offset-2" : ""}`}
                style={{
                  left: `${imageSettings.x}%`,
                  top: `${imageSettings.y}%`,
                  width: `${imageSettings.width}%`,
                  height: `${imageSettings.height}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, "image")}
                onTouchStart={(e) => handleTouchStart(e, "image")}
              >
                <img
                  src={imageUrl}
                  alt="Slide"
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>
            )}
            
            {/* Textos */}
            {textBlocks.map((block) => (
              <div
                key={block.id}
                className={`absolute cursor-move px-2 py-1 ${selectedElement === block.id ? "ring-2 ring-primary ring-offset-2" : ""}`}
                style={{
                  left: block.textAlign === "center" ? "50%" : block.textAlign === "right" ? "auto" : `${block.x}%`,
                  right: block.textAlign === "right" ? "5%" : "auto",
                  top: `${block.y}%`,
                  transform: block.textAlign === "center" ? "translateX(-50%)" : "none",
                  fontSize: `${block.fontSize}px`,
                  fontFamily: block.fontFamily,
                  fontWeight: block.fontWeight,
                  color: block.color,
                  textAlign: block.textAlign,
                  textShadow: block.shadowEnabled 
                    ? `${block.shadowOffsetX}px ${block.shadowOffsetY}px ${block.shadowBlur}px ${block.shadowColor}`
                    : block.glowEnabled
                      ? `0 0 ${block.glowIntensity}px ${block.glowColor}`
                      : "none",
                  WebkitTextStroke: block.borderEnabled ? `${block.borderWidth}px ${block.borderColor}` : "none",
                  letterSpacing: `${block.letterSpacing}px`,
                  lineHeight: block.lineHeight,
                  backgroundColor: block.bgEnabled ? block.bgColor : "transparent",
                  padding: block.bgEnabled ? `${block.bgPadding}px` : "0",
                  maxWidth: "90%",
                }}
                onMouseDown={(e) => handleMouseDown(e, block.id)}
                onTouchStart={(e) => handleTouchStart(e, block.id)}
              >
                {block.text}
              </div>
            ))}
          </div>
          
          {/* Botões de download */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleDownload(true)}
              disabled={downloading}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Com Texto
            </Button>
            <Button
              onClick={() => handleDownload(false)}
              disabled={downloading}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Sem Texto
            </Button>
          </div>
        </div>
        
        {/* Controles */}
        <div className="space-y-4">
          {/* Seletor de elemento */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedElement === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedElement("image")}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Imagem
            </Button>
            {textBlocks.map((block, i) => (
              <Button
                key={block.id}
                variant={selectedElement === block.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedElement(block.id)}
              >
                <Type className="w-4 h-4 mr-1" />
                Texto {i + 1}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={addTextBlock}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Controles de Imagem */}
          {selectedElement === "image" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Configurações da Imagem
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Posição X: {imageSettings.x.toFixed(0)}%</Label>
                  <Slider
                    value={[imageSettings.x]}
                    onValueChange={([v]) => setImageSettings(prev => ({ ...prev, x: v }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-xs">Posição Y: {imageSettings.y.toFixed(0)}%</Label>
                  <Slider
                    value={[imageSettings.y]}
                    onValueChange={([v]) => setImageSettings(prev => ({ ...prev, y: v }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-xs">Largura: {imageSettings.width}%</Label>
                  <Slider
                    value={[imageSettings.width]}
                    onValueChange={([v]) => setImageSettings(prev => ({ ...prev, width: v }))}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-xs">Altura: {imageSettings.height}%</Label>
                  <Slider
                    value={[imageSettings.height]}
                    onValueChange={([v]) => setImageSettings(prev => ({ ...prev, height: v }))}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Controles de Texto */}
          {selectedTextBlock && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="cores">Cores</TabsTrigger>
                <TabsTrigger value="avancado">Avançado</TabsTrigger>
              </TabsList>
              
              {/* Aba Básico */}
              <TabsContent value="basico" className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Texto {textBlocks.findIndex(b => b.id === selectedTextBlock.id) + 1}</h4>
                  {textBlocks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTextBlock(selectedTextBlock.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label>Texto</Label>
                  <textarea
                    value={selectedTextBlock.text}
                    onChange={(e) => updateTextBlock(selectedTextBlock.id, { text: e.target.value })}
                    className="w-full mt-1 p-2 rounded-md border bg-background text-sm min-h-[80px]"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Tamanho: {selectedTextBlock.fontSize}px</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { fontSize: Math.max(12, selectedTextBlock.fontSize - 2) })}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Slider
                      value={[selectedTextBlock.fontSize]}
                      onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { fontSize: v })}
                      min={12}
                      max={72}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { fontSize: Math.min(72, selectedTextBlock.fontSize + 2) })}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Alinhamento</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={selectedTextBlock.textAlign === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { textAlign: "left" })}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedTextBlock.textAlign === "center" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { textAlign: "center" })}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedTextBlock.textAlign === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { textAlign: "right" })}
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Fonte</Label>
                  <select
                    value={selectedTextBlock.fontFamily}
                    onChange={(e) => updateTextBlock(selectedTextBlock.id, { fontFamily: e.target.value })}
                    className="w-full mt-1 p-2 rounded-md border bg-background text-sm"
                  >
                    {FONT_FAMILIES.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Peso</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={selectedTextBlock.fontWeight === "normal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { fontWeight: "normal" })}
                    >
                      Normal
                    </Button>
                    <Button
                      variant={selectedTextBlock.fontWeight === "bold" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextBlock(selectedTextBlock.id, { fontWeight: "bold" })}
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Posição Y: {selectedTextBlock.y.toFixed(0)}%</Label>
                    <Slider
                      value={[selectedTextBlock.y]}
                      onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { y: v })}
                      min={5}
                      max={95}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Espaçamento: {selectedTextBlock.letterSpacing}px</Label>
                    <Slider
                      value={[selectedTextBlock.letterSpacing]}
                      onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { letterSpacing: v })}
                      min={-5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">Altura da linha: {selectedTextBlock.lineHeight.toFixed(1)}</Label>
                  <Slider
                    value={[selectedTextBlock.lineHeight]}
                    onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { lineHeight: v })}
                    min={0.8}
                    max={2.5}
                    step={0.1}
                  />
                </div>
              </TabsContent>
              
              {/* Aba Cores */}
              <TabsContent value="cores" className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Cor do Texto</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={selectedTextBlock.color}
                      onChange={(e) => updateTextBlock(selectedTextBlock.id, { color: e.target.value })}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <Input
                      value={selectedTextBlock.color}
                      onChange={(e) => updateTextBlock(selectedTextBlock.id, { color: e.target.value })}
                      className="flex-1 h-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Cor de Fundo (Slide)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 h-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Presets de Cores</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          updateTextBlock(selectedTextBlock.id, { color: preset.text });
                          setBackgroundColor(preset.bg);
                        }}
                        className="p-2 rounded border hover:border-primary transition-colors"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <span style={{ color: preset.text }} className="text-xs font-bold">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Fundo do Texto</Label>
                  <Switch
                    checked={selectedTextBlock.bgEnabled}
                    onCheckedChange={(v) => updateTextBlock(selectedTextBlock.id, { bgEnabled: v })}
                  />
                </div>
                
                {selectedTextBlock.bgEnabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={selectedTextBlock.bgColor}
                        onChange={(e) => updateTextBlock(selectedTextBlock.id, { bgColor: e.target.value })}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <Input
                        value={selectedTextBlock.bgColor}
                        onChange={(e) => updateTextBlock(selectedTextBlock.id, { bgColor: e.target.value })}
                        className="flex-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Padding: {selectedTextBlock.bgPadding}px</Label>
                      <Slider
                        value={[selectedTextBlock.bgPadding]}
                        onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { bgPadding: v })}
                        min={0}
                        max={32}
                        step={1}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Aba Avançado */}
              <TabsContent value="avancado" className="space-y-4 p-4 bg-muted/50 rounded-lg">
                {/* Sombra */}
                <div className="flex items-center justify-between">
                  <Label>Sombra</Label>
                  <Switch
                    checked={selectedTextBlock.shadowEnabled}
                    onCheckedChange={(v) => updateTextBlock(selectedTextBlock.id, { shadowEnabled: v, glowEnabled: v ? false : selectedTextBlock.glowEnabled })}
                  />
                </div>
                
                {selectedTextBlock.shadowEnabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={selectedTextBlock.shadowColor}
                        onChange={(e) => updateTextBlock(selectedTextBlock.id, { shadowColor: e.target.value })}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <span className="text-xs text-muted-foreground">Cor da sombra</span>
                    </div>
                    <div>
                      <Label className="text-xs">Blur: {selectedTextBlock.shadowBlur}px</Label>
                      <Slider
                        value={[selectedTextBlock.shadowBlur]}
                        onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { shadowBlur: v })}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Offset X: {selectedTextBlock.shadowOffsetX}px</Label>
                        <Slider
                          value={[selectedTextBlock.shadowOffsetX]}
                          onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { shadowOffsetX: v })}
                          min={-10}
                          max={10}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Offset Y: {selectedTextBlock.shadowOffsetY}px</Label>
                        <Slider
                          value={[selectedTextBlock.shadowOffsetY]}
                          onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { shadowOffsetY: v })}
                          min={-10}
                          max={10}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Borda/Contorno */}
                <div className="flex items-center justify-between">
                  <Label>Contorno</Label>
                  <Switch
                    checked={selectedTextBlock.borderEnabled}
                    onCheckedChange={(v) => updateTextBlock(selectedTextBlock.id, { borderEnabled: v })}
                  />
                </div>
                
                {selectedTextBlock.borderEnabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={selectedTextBlock.borderColor}
                        onChange={(e) => updateTextBlock(selectedTextBlock.id, { borderColor: e.target.value })}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <span className="text-xs text-muted-foreground">Cor do contorno</span>
                    </div>
                    <div>
                      <Label className="text-xs">Espessura: {selectedTextBlock.borderWidth}px</Label>
                      <Slider
                        value={[selectedTextBlock.borderWidth]}
                        onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { borderWidth: v })}
                        min={1}
                        max={8}
                        step={0.5}
                      />
                    </div>
                  </div>
                )}
                
                {/* Glow */}
                <div className="flex items-center justify-between">
                  <Label>Efeito Glow</Label>
                  <Switch
                    checked={selectedTextBlock.glowEnabled}
                    onCheckedChange={(v) => updateTextBlock(selectedTextBlock.id, { glowEnabled: v, shadowEnabled: v ? false : selectedTextBlock.shadowEnabled })}
                  />
                </div>
                
                {selectedTextBlock.glowEnabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={selectedTextBlock.glowColor}
                        onChange={(e) => updateTextBlock(selectedTextBlock.id, { glowColor: e.target.value })}
                        className="w-12 h-8 p-0 border-0"
                      />
                      <span className="text-xs text-muted-foreground">Cor do glow</span>
                    </div>
                    <div>
                      <Label className="text-xs">Intensidade: {selectedTextBlock.glowIntensity}px</Label>
                      <Slider
                        value={[selectedTextBlock.glowIntensity]}
                        onValueChange={([v]) => updateTextBlock(selectedTextBlock.id, { glowIntensity: v })}
                        min={1}
                        max={30}
                        step={1}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          {/* Mensagem quando nada selecionado */}
          {!selectedElement && (
            <div className="p-8 text-center text-muted-foreground bg-muted/50 rounded-lg">
              <Move className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Clique em um elemento no preview para editar</p>
              <p className="text-xs mt-1">Ou arraste para reposicionar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
