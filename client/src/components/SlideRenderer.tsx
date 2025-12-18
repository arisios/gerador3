import { useRef, useEffect, useState } from "react";
import { designTemplates, colorPalettes, type DesignTemplate, type ColorPalette } from "../../../shared/designTemplates";

interface SlideRendererProps {
  text: string;
  imageUrl?: string;
  templateId: string;
  paletteId?: string;
  customColors?: {
    background?: string;
    text?: string;
    accent?: string;
  };
  logoUrl?: string;
  width?: number;
  height?: number;
  onRender?: (dataUrl: string) => void;
  className?: string;
}

export function SlideRenderer({
  text,
  imageUrl,
  templateId,
  paletteId,
  customColors,
  logoUrl,
  width = 1080,
  height = 1080,
  onRender,
  className = ""
}: SlideRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  const template = designTemplates.find(t => t.id === templateId) || designTemplates[0];
  const palette = paletteId ? colorPalettes.find(p => p.id === paletteId) : null;

  // Cores finais (customColors > palette > template default)
  const colors = {
    background: customColors?.background || palette?.colors.background || template.defaultStyle.backgroundColor,
    text: customColors?.text || palette?.colors.text || template.defaultStyle.textColor,
    accent: customColors?.accent || palette?.colors.accent || template.defaultStyle.accentColor,
  };

  useEffect(() => {
    renderSlide();
  }, [text, imageUrl, templateId, paletteId, customColors, logoUrl]);

  const renderSlide = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    // Desenhar fundo
    await drawBackground(ctx, colors.background, width, height);

    // Desenhar imagem se houver
    if (imageUrl && template.layout.image.position !== 'none') {
      await drawImage(ctx, imageUrl, template.layout.image, width, height);
    }

    // Desenhar overlay se for fullbleed
    if (template.category === 'fullbleed' || template.layout.decorations.type === 'gradient-overlay') {
      drawOverlay(ctx, template.layout.text.position, width, height);
    }

    // Desenhar decorações
    drawDecorations(ctx, template.layout.decorations, colors.accent, width, height);

    // Desenhar texto
    drawText(ctx, text, template, colors, width, height);

    // Desenhar logo se houver
    if (logoUrl) {
      await drawLogo(ctx, logoUrl, template.layout.logo, width, height);
    }

    setRendered(true);

    // Callback com dataUrl
    if (onRender) {
      const dataUrl = canvas.toDataURL('image/png');
      onRender(dataUrl);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}

// Funções auxiliares de desenho

async function drawBackground(ctx: CanvasRenderingContext2D, color: string, width: number, height: number) {
  if (color.startsWith('linear-gradient')) {
    // Parse gradient
    const gradientMatch = color.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
    if (gradientMatch) {
      const angle = parseInt(gradientMatch[1]);
      const colorStops = gradientMatch[2].split(',').map(s => s.trim());
      
      const rad = (angle - 90) * Math.PI / 180;
      const x1 = width / 2 - Math.cos(rad) * width / 2;
      const y1 = height / 2 - Math.sin(rad) * height / 2;
      const x2 = width / 2 + Math.cos(rad) * width / 2;
      const y2 = height / 2 + Math.sin(rad) * height / 2;
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      
      colorStops.forEach((stop, i) => {
        const match = stop.match(/(#[a-fA-F0-9]+)\s*(\d+)?%?/);
        if (match) {
          const position = match[2] ? parseInt(match[2]) / 100 : i / (colorStops.length - 1);
          gradient.addColorStop(position, match[1]);
        }
      });
      
      ctx.fillStyle = gradient;
    }
  } else {
    ctx.fillStyle = color;
  }
  ctx.fillRect(0, 0, width, height);
}

async function drawImage(
  ctx: CanvasRenderingContext2D, 
  url: string, 
  layout: DesignTemplate['layout']['image'],
  width: number,
  height: number
) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let dx = 0, dy = 0, dw = width, dh = height;
      
      switch (layout.position) {
        case 'top':
          dh = height * (layout.height / 100);
          break;
        case 'bottom':
          dy = height * (1 - layout.height / 100);
          dh = height * (layout.height / 100);
          break;
        case 'left':
          dw = width * (layout.width / 100);
          break;
        case 'right':
          dx = width * (1 - layout.width / 100);
          dw = width * (layout.width / 100);
          break;
        case 'center':
          dx = width * ((100 - layout.width) / 200);
          dy = height * ((100 - layout.height) / 200);
          dw = width * (layout.width / 100);
          dh = height * (layout.height / 100);
          break;
        case 'full':
          // Já está configurado para full
          break;
      }
      
      // Calcular crop para manter aspect ratio
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
    img.src = url;
  });
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  textPosition: string,
  width: number,
  height: number
) {
  let gradient: CanvasGradient;
  
  if (textPosition === 'overlay-bottom') {
    gradient = ctx.createLinearGradient(0, height * 0.4, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
  } else if (textPosition === 'overlay-top') {
    gradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    // Center overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    return;
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  decorations: DesignTemplate['layout']['decorations'],
  accentColor: string,
  width: number,
  height: number
) {
  ctx.strokeStyle = accentColor;
  ctx.fillStyle = accentColor;
  
  switch (decorations.type) {
    case 'line':
      ctx.lineWidth = 6;
      if (decorations.position === 'left') {
        ctx.beginPath();
        ctx.moveTo(40, height * 0.55);
        ctx.lineTo(40, height * 0.85);
        ctx.stroke();
      } else if (decorations.position === 'top') {
        ctx.fillRect(40, 40, width * 0.3, 8);
      } else if (decorations.position === 'bottom') {
        ctx.fillRect(width * 0.35, height - 48, width * 0.3, 8);
      }
      break;
      
    case 'border':
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, width - 60, height - 60);
      break;
      
    case 'shape':
      if (decorations.position === 'quotes') {
        ctx.font = 'bold 200px serif';
        ctx.globalAlpha = 0.15;
        ctx.fillText('"', 30, 180);
        ctx.fillText('"', width - 150, height - 50);
        ctx.globalAlpha = 1;
      } else if (decorations.position === 'circle') {
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (decorations.position === 'diagonal') {
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(width * 0.5, 0);
        ctx.lineTo(width * 0.55, height);
        ctx.lineTo(width * 0.52, height);
        ctx.lineTo(width * 0.47, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
      
    case 'dots':
      ctx.globalAlpha = 0.1;
      for (let x = 0; x < width; x += 40) {
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      break;
      
    case 'grid':
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  template: DesignTemplate,
  colors: { text: string; accent: string },
  width: number,
  height: number
) {
  const layout = template.layout.text;
  const style = template.defaultStyle;
  
  // Configurar fonte
  const fontSizes = {
    small: Math.floor(width * 0.035),
    medium: Math.floor(width * 0.045),
    large: Math.floor(width * 0.055),
    xlarge: Math.floor(width * 0.07)
  };
  
  const fontWeights = {
    normal: '400',
    medium: '500',
    bold: '700',
    black: '900'
  };
  
  const fontSize = fontSizes[style.fontSize];
  const fontWeight = fontWeights[style.fontWeight];
  
  ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = colors.text;
  ctx.textAlign = layout.alignment as CanvasTextAlign;
  
  // Calcular área do texto
  const maxWidth = width * (layout.maxWidth / 100);
  const padding = width * 0.05;
  
  let textX: number;
  let textY: number;
  
  switch (layout.position) {
    case 'top':
      textX = layout.alignment === 'center' ? width / 2 : 
              layout.alignment === 'right' ? width - padding : padding;
      textY = height * 0.15;
      break;
    case 'bottom':
      textX = layout.alignment === 'center' ? width / 2 : 
              layout.alignment === 'right' ? width - padding : padding;
      textY = height * 0.6;
      break;
    case 'left':
      textX = padding;
      textY = height * 0.35;
      break;
    case 'right':
      textX = width - padding;
      textY = height * 0.35;
      break;
    case 'center':
    case 'overlay-center':
      textX = width / 2;
      textY = height * 0.4;
      break;
    case 'overlay-bottom':
      textX = layout.alignment === 'center' ? width / 2 : padding;
      textY = height * 0.65;
      break;
    case 'overlay-top':
      textX = layout.alignment === 'center' ? width / 2 : padding;
      textY = height * 0.15;
      break;
    default:
      textX = width / 2;
      textY = height / 2;
  }
  
  // Quebrar texto em linhas
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
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
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Desenhar cada linha
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  let startY = textY - totalHeight / 2 + lineHeight / 2;
  
  for (const line of lines) {
    // Verificar se há texto destacado com **
    const parts = line.split(/(\*\*[^*]+\*\*)/);
    let lineX = textX;
    
    if (layout.alignment === 'center') {
      // Para centralizado, desenhar linha inteira
      const cleanLine = line.replace(/\*\*/g, '');
      const lineWidth = ctx.measureText(cleanLine).width;
      lineX = textX - lineWidth / 2;
      ctx.textAlign = 'left';
    }
    
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Texto destacado
        const highlightText = part.slice(2, -2);
        ctx.fillStyle = colors.accent;
        ctx.fillText(highlightText, lineX, startY);
        lineX += ctx.measureText(highlightText).width;
        ctx.fillStyle = colors.text;
      } else if (part) {
        ctx.fillText(part, lineX, startY);
        lineX += ctx.measureText(part).width;
      }
    }
    
    ctx.textAlign = layout.alignment as CanvasTextAlign;
    startY += lineHeight;
  }
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  url: string,
  layout: DesignTemplate['layout']['logo'],
  width: number,
  height: number
) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sizes = {
        small: width * 0.08,
        medium: width * 0.12,
        large: width * 0.16
      };
      
      const logoSize = sizes[layout.size];
      const padding = width * 0.03;
      
      let x: number, y: number;
      
      switch (layout.position) {
        case 'top-left':
          x = padding;
          y = padding;
          break;
        case 'top-right':
          x = width - logoSize - padding;
          y = padding;
          break;
        case 'top-center':
          x = (width - logoSize) / 2;
          y = padding;
          break;
        case 'bottom-left':
          x = padding;
          y = height - logoSize - padding;
          break;
        case 'bottom-right':
          x = width - logoSize - padding;
          y = height - logoSize - padding;
          break;
        case 'bottom-center':
          x = (width - logoSize) / 2;
          y = height - logoSize - padding;
          break;
        default:
          x = padding;
          y = padding;
      }
      
      // Manter aspect ratio do logo
      const imgRatio = img.width / img.height;
      let drawWidth = logoSize;
      let drawHeight = logoSize / imgRatio;
      
      if (drawHeight > logoSize) {
        drawHeight = logoSize;
        drawWidth = logoSize * imgRatio;
      }
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

// Componente de seleção de template
interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  showPreview?: boolean;
}

export function DesignTemplateSelector({ selectedId, onSelect, showPreview = true }: TemplateSelectorProps) {
  const [category, setCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);
  
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'split', name: 'Split' },
    { id: 'card', name: 'Card' },
    { id: 'fullbleed', name: 'Full Bleed' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'bold', name: 'Impacto' },
    { id: 'editorial', name: 'Editorial' }
  ];
  
  const filteredTemplates = category === 'all' 
    ? designTemplates 
    : designTemplates.filter(t => t.category === category);
  
  const displayTemplates = expanded ? filteredTemplates : filteredTemplates.slice(0, 6);
  
  return (
    <div className="space-y-3">
      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              category === cat.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      {/* Grid de templates */}
      <div className="grid grid-cols-3 gap-2">
        {displayTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedId === template.id 
                ? 'border-primary ring-2 ring-primary/50' 
                : 'border-transparent hover:border-muted-foreground/30'
            }`}
          >
            {/* Mini preview do template */}
            <div 
              className="w-full h-full flex items-center justify-center p-2"
              style={{ backgroundColor: template.defaultStyle.backgroundColor }}
            >
              <TemplatePreviewMini template={template} />
            </div>
            
            {/* Nome do template */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
              <span className="text-[10px] text-white truncate block">{template.name}</span>
            </div>
            
            {/* Check se selecionado */}
            {selectedId === template.id && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Botão ver mais */}
      {filteredTemplates.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Ver menos' : `Ver mais (${filteredTemplates.length - 6})`}
        </button>
      )}
    </div>
  );
}

// Mini preview do layout do template
function TemplatePreviewMini({ template }: { template: DesignTemplate }) {
  const { layout, defaultStyle } = template;
  
  return (
    <div className="w-full h-full relative">
      {/* Área da imagem */}
      {layout.image.position !== 'none' && (
        <div 
          className="absolute bg-muted-foreground/30"
          style={{
            ...(layout.image.position === 'top' && { 
              top: 0, left: 0, right: 0, 
              height: `${layout.image.height}%` 
            }),
            ...(layout.image.position === 'bottom' && { 
              bottom: 0, left: 0, right: 0, 
              height: `${layout.image.height}%` 
            }),
            ...(layout.image.position === 'left' && { 
              top: 0, left: 0, bottom: 0, 
              width: `${layout.image.width}%` 
            }),
            ...(layout.image.position === 'right' && { 
              top: 0, right: 0, bottom: 0, 
              width: `${layout.image.width}%` 
            }),
            ...(layout.image.position === 'full' && { 
              top: 0, left: 0, right: 0, bottom: 0 
            }),
            ...(layout.image.position === 'center' && { 
              top: '10%', left: '10%', 
              width: '80%', height: '50%' 
            }),
          }}
        />
      )}
      
      {/* Área do texto */}
      <div 
        className="absolute flex items-center"
        style={{
          ...(layout.text.position === 'bottom' && { 
            bottom: '5%', left: '5%', right: '5%', 
            height: '35%',
            justifyContent: layout.text.alignment === 'center' ? 'center' : 
                           layout.text.alignment === 'right' ? 'flex-end' : 'flex-start'
          }),
          ...(layout.text.position === 'top' && { 
            top: '5%', left: '5%', right: '5%', 
            height: '35%',
            justifyContent: layout.text.alignment === 'center' ? 'center' : 
                           layout.text.alignment === 'right' ? 'flex-end' : 'flex-start'
          }),
          ...(layout.text.position === 'center' && { 
            top: '30%', left: '10%', right: '10%', 
            height: '40%',
            justifyContent: 'center'
          }),
          ...((layout.text.position === 'overlay-bottom' || layout.text.position === 'overlay-center' || layout.text.position === 'overlay-top') && { 
            top: layout.text.position === 'overlay-top' ? '10%' : 
                 layout.text.position === 'overlay-center' ? '35%' : '60%',
            left: '5%', right: '5%', 
            height: '30%',
            justifyContent: layout.text.alignment === 'center' ? 'center' : 'flex-start'
          }),
          ...(layout.text.position === 'left' && { 
            top: '20%', left: '5%', 
            width: '40%', height: '60%',
            justifyContent: 'flex-start'
          }),
          ...(layout.text.position === 'right' && { 
            top: '20%', right: '5%', 
            width: '40%', height: '60%',
            justifyContent: 'flex-end'
          }),
        }}
      >
        <div className="space-y-1">
          <div 
            className="h-1.5 rounded"
            style={{ 
              backgroundColor: defaultStyle.textColor,
              width: '100%',
              opacity: 0.8
            }}
          />
          <div 
            className="h-1 rounded"
            style={{ 
              backgroundColor: defaultStyle.textColor,
              width: '70%',
              opacity: 0.5
            }}
          />
        </div>
      </div>
      
      {/* Indicador de cor de destaque */}
      <div 
        className="absolute w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: defaultStyle.accentColor,
          bottom: '5%',
          right: '5%'
        }}
      />
    </div>
  );
}

// Seletor de paleta de cores
interface ColorPaletteSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ColorPaletteSelector({ selectedId, onSelect }: ColorPaletteSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {colorPalettes.map(palette => (
        <button
          key={palette.id}
          onClick={() => onSelect(palette.id)}
          className={`relative p-2 rounded-lg border-2 transition-all ${
            selectedId === palette.id 
              ? 'border-primary ring-2 ring-primary/50' 
              : 'border-transparent hover:border-muted-foreground/30'
          }`}
        >
          {/* Preview das cores */}
          <div className="flex gap-1 mb-1">
            <div 
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ 
                background: palette.colors.background.startsWith('linear') 
                  ? palette.colors.background 
                  : palette.colors.background 
              }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ backgroundColor: palette.colors.accent }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground truncate block">
            {palette.name}
          </span>
          
          {selectedId === palette.id && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export { designTemplates, colorPalettes };
