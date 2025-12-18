import { useMemo } from "react";
import { visualTemplates, accentColors, overlayTypes, textPositions } from "@shared/visualTemplates";

interface SlidePreviewProps {
  text: string;
  imageUrl?: string;
  templateId?: string;
  accentColorId?: string;
  className?: string;
  showOverlay?: boolean;
}

export default function SlidePreview({
  text,
  imageUrl,
  templateId = "lifestyle-editorial",
  accentColorId = "neon-green",
  className = "",
  showOverlay = true,
}: SlidePreviewProps) {
  const template = useMemo(() => 
    visualTemplates.find(t => t.id === templateId) || visualTemplates[0],
    [templateId]
  );

  const accentColor = useMemo(() =>
    accentColors.find(c => c.id === accentColorId) || accentColors[0],
    [accentColorId]
  );

  const overlayStyle = useMemo(() => {
    if (!showOverlay) return {};
    
    const opacity = template.style.overlayOpacity;
    
    switch (template.style.overlayType) {
      case "gradient-bottom":
        return {
          background: `linear-gradient(to top, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.5}) 50%, transparent 100%)`,
        };
      case "gradient-top":
        return {
          background: `linear-gradient(to bottom, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.5}) 50%, transparent 100%)`,
        };
      case "gradient-radial":
        return {
          background: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,${opacity}) 100%)`,
        };
      case "gradient-diagonal":
        return {
          background: `linear-gradient(to bottom right, rgba(0,0,0,${opacity}) 0%, transparent 100%)`,
        };
      case "solid":
        return {
          background: `rgba(0,0,0,${opacity})`,
        };
      default:
        return {};
    }
  }, [template, showOverlay]);

  const textPositionStyle = useMemo(() => {
    switch (template.style.textPosition) {
      case "top":
        return "items-start pt-8";
      case "center":
        return "items-center";
      case "bottom":
        return "items-end pb-8";
      default:
        return "items-end pb-8";
    }
  }, [template]);

  const textAlignStyle = useMemo(() => {
    switch (template.style.textAlign) {
      case "left":
        return "text-left";
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  }, [template]);

  // Processar texto para destacar palavras-chave com cor de destaque
  const processedText = useMemo(() => {
    if (!text) return null;
    
    // Encontrar palavras entre ** ** para destacar
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const word = part.slice(2, -2);
        return (
          <span 
            key={index} 
            style={{ 
              color: accentColor.hex,
              textShadow: `0 0 20px ${accentColor.hex}, 0 0 40px ${accentColor.hex}`,
            }}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [text, accentColor]);

  const getFontWeight = () => {
    switch (template.style.fontWeight) {
      case "900": return "font-black";
      case "800": return "font-extrabold";
      case "700": return "font-bold";
      case "600": return "font-semibold";
      case "500": return "font-medium";
      default: return "font-bold";
    }
  };

  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-lg ${className}`}>
      {/* Background Image */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0" style={overlayStyle} />

      {/* Decorations (linhas, formas) */}
      {template.style.hasDecorations && (
        <>
          {/* Linha superior */}
          <div 
            className="absolute top-4 left-4 right-4 h-0.5 opacity-30"
            style={{ backgroundColor: accentColor.hex }}
          />
          {/* Linha inferior */}
          <div 
            className="absolute bottom-4 left-4 right-4 h-0.5 opacity-30"
            style={{ backgroundColor: accentColor.hex }}
          />
        </>
      )}

      {/* Text Container */}
      <div className={`absolute inset-0 flex flex-col justify-end ${textPositionStyle} px-6`}>
        {/* Main Text */}
        <div className={`${textAlignStyle} ${getFontWeight()}`}>
          <p 
            className="text-white leading-tight"
            style={{
              fontSize: "clamp(1.25rem, 5vw, 2rem)",
              textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.9)",
              letterSpacing: "-0.02em",
            }}
          >
            {processedText || "Seu texto aqui"}
          </p>
        </div>

        {/* Subtitle (se habilitado) */}
        {template.style.hasSubtitle && (
          <p 
            className={`text-white/70 text-sm mt-2 ${textAlignStyle}`}
            style={{
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            Subtítulo opcional
          </p>
        )}

        {/* CTA (se habilitado) */}
        {template.style.hasCTA && (
          <div className={`mt-4 ${textAlignStyle}`}>
            <span 
              className="inline-block px-4 py-2 text-xs font-bold uppercase tracking-wider rounded"
              style={{
                backgroundColor: accentColor.hex,
                color: "#000",
              }}
            >
              Saiba mais
            </span>
          </div>
        )}
      </div>

      {/* Template Badge */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-[10px] text-white/60">
        {template.name}
      </div>
    </div>
  );
}

// Componente para seleção de template
export function TemplateSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {visualTemplates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`p-2 rounded-lg border-2 transition-all text-left ${
            selectedId === template.id
              ? "border-primary bg-primary/10"
              : "border-transparent bg-muted/50 hover:bg-muted"
          }`}
        >
          <div 
            className="w-full aspect-[4/5] rounded mb-1 flex items-end p-1"
            style={{
              background: `linear-gradient(135deg, ${
                accentColors.find(c => c.hex === template.style.accentColor)?.hex || template.style.accentColor
              }20, #000)`,
            }}
          >
            <div 
              className="w-full h-1 rounded"
              style={{ backgroundColor: template.style.accentColor }}
            />
          </div>
          <p className="text-[10px] font-medium truncate">{template.name}</p>
          <p className="text-[8px] text-muted-foreground truncate">{template.category}</p>
        </button>
      ))}
    </div>
  );
}

// Componente para seleção de cor de destaque
export function AccentColorSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {accentColors.map((color) => (
        <button
          key={color.id}
          onClick={() => onSelect(color.id)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            selectedId === color.id
              ? "border-white scale-110"
              : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: color.hex }}
          title={color.name}
        />
      ))}
    </div>
  );
}
