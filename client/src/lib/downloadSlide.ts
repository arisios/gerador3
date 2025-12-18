import type { SlideStyle } from "@/components/SlideComposer";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

/**
 * Carrega uma imagem via proxy para evitar CORS
 */
async function loadImageWithProxy(imageUrl: string): Promise<HTMLImageElement> {
  // Primeiro, buscar a imagem via proxy e converter para data URL
  const proxyUrl = `/api/trpc/proxy.getImage?input=${encodeURIComponent(JSON.stringify({ json: { url: imageUrl } }))}`;
  
  try {
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.result?.data?.json?.data) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Falha ao carregar imagem do proxy"));
        img.src = data.result.data.json.data;
      });
    }
  } catch (error) {
    console.warn("Proxy falhou, tentando diretamente:", error);
  }
  
  // Fallback: tentar carregar diretamente
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = imageUrl;
  });
}

/**
 * Quebra texto em múltiplas linhas para caber no canvas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

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

  return lines;
}

/**
 * Desenha o texto no canvas com todos os estilos aplicados
 */
function drawStyledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: SlideStyle
) {
  const maxWidth = CANVAS_WIDTH - style.padding * 2;
  const fontSize = style.fontSize * (CANVAS_WIDTH / 400); // Escalar para canvas maior
  
  ctx.font = `bold ${fontSize}px ${style.fontFamily}, sans-serif`;
  ctx.textAlign = style.textAlign;
  ctx.fillStyle = style.textColor;

  // Configurar sombra
  if (style.shadowEnabled) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur * 2;
    ctx.shadowOffsetX = style.shadowOffsetX * 2;
    ctx.shadowOffsetY = style.shadowOffsetY * 2;
  }

  // Quebrar texto em linhas
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * style.lineHeight;
  const totalHeight = lines.length * lineHeight;

  // Calcular posição Y
  const startY = (CANVAS_HEIGHT * style.positionY) / 100 - totalHeight / 2;

  // Calcular posição X baseado no alinhamento
  let x: number;
  switch (style.textAlign) {
    case "left":
      x = style.padding;
      break;
    case "right":
      x = CANVAS_WIDTH - style.padding;
      break;
    default:
      x = CANVAS_WIDTH / 2;
  }

  // Desenhar borda do texto primeiro (se habilitada)
  if (style.borderEnabled) {
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = style.borderWidth * 2;
    ctx.lineJoin = "round";
    
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight + fontSize;
      ctx.strokeText(line, x, y);
    });
  }

  // Desenhar glow (se habilitado)
  if (style.glowEnabled) {
    ctx.shadowColor = style.glowColor;
    ctx.shadowBlur = style.glowIntensity * 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Desenhar múltiplas vezes para intensificar o glow
    for (let i = 0; i < 3; i++) {
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight + fontSize;
        ctx.fillText(line, x, y);
      });
    }
  }

  // Resetar sombra para o texto principal
  if (style.shadowEnabled) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur * 2;
    ctx.shadowOffsetX = style.shadowOffsetX * 2;
    ctx.shadowOffsetY = style.shadowOffsetY * 2;
  } else {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Desenhar texto principal
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight + fontSize;
    ctx.fillText(line, x, y);
  });
}

/**
 * Desenha overlay gradiente
 */
function drawOverlay(
  ctx: CanvasRenderingContext2D,
  style: SlideStyle
) {
  const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT * 0.3);
  const alpha = style.overlayOpacity / 100;
  
  gradient.addColorStop(0, `${style.backgroundColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(0.5, `${style.backgroundColor}${Math.round(alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(1, "transparent");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/**
 * Baixa um slide como PNG
 */
export async function downloadSlide(
  imageUrl: string | undefined,
  text: string,
  style: SlideStyle,
  withText: boolean,
  filename: string = "slide"
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível criar contexto do canvas");

  // Fundo preto padrão
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Carregar e desenhar imagem de fundo
  if (imageUrl) {
    try {
      const img = await loadImageWithProxy(imageUrl);
      
      // Calcular dimensões para cover
      const imgRatio = img.width / img.height;
      const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgRatio > canvasRatio) {
        drawHeight = CANVAS_HEIGHT;
        drawWidth = img.width * (CANVAS_HEIGHT / img.height);
        drawX = (CANVAS_WIDTH - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = CANVAS_WIDTH;
        drawHeight = img.height * (CANVAS_WIDTH / img.width);
        drawX = 0;
        drawY = (CANVAS_HEIGHT - drawHeight) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
    }
  }

  // Desenhar overlay e texto se solicitado
  if (withText && style.showText) {
    drawOverlay(ctx, style);
    drawStyledText(ctx, text, style);
  }

  // Converter para blob e baixar
  canvas.toBlob((blob) => {
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png", 1.0);
}

/**
 * Baixa múltiplos slides em sequência
 */
export async function downloadAllSlides(
  slides: Array<{
    imageUrl?: string;
    text: string;
    style: SlideStyle;
  }>,
  withText: boolean,
  baseFilename: string = "slide"
): Promise<void> {
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    await downloadSlide(
      slide.imageUrl,
      slide.text,
      slide.style,
      withText,
      `${baseFilename}_${i + 1}`
    );
    // Pequeno delay entre downloads
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
