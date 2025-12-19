// Templates Visuais Completos com Layouts Profissionais
// Cada template é uma "moldura" com área fixa para imagem e texto

export interface TextStyle {
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  alignment: 'left' | 'center' | 'right';
  fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  maxWidth: string; // CSS value like '60%', '80%'
  padding: string; // CSS value like '24px', '32px'
  textShadow: boolean;
  lineHeight: 'tight' | 'normal' | 'relaxed';
}

export interface ImageFrame {
  position: 'top' | 'bottom' | 'left' | 'right' | 'full' | 'center' | 'none';
  // Área do quadro/moldura (porcentagem do slide)
  x: string; // CSS left position
  y: string; // CSS top position
  width: string; // CSS width
  height: string; // CSS height
  borderRadius: string; // CSS border-radius
  objectFit: 'cover' | 'contain';
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'split' | 'card' | 'fullbleed' | 'minimal' | 'bold' | 'editorial';
  description: string;
  // Moldura/quadro da imagem
  imageFrame: ImageFrame;
  // Estilo do texto
  textStyle: TextStyle;
  // Posição do logo
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  // Cores padrão
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  // Overlay sobre a imagem (para legibilidade do texto)
  overlay?: {
    type: 'gradient-bottom' | 'gradient-top' | 'gradient-left' | 'gradient-right' | 'solid' | 'none';
    opacity: number; // 0-1
  };
}

export const designTemplates: DesignTemplate[] = [
  // === SPLIT HORIZONTAL ===
  {
    id: 'split-top-image',
    name: 'Imagem Topo',
    category: 'split',
    description: 'Imagem ocupa metade superior, texto na metade inferior',
    imageFrame: {
      position: 'top',
      x: '0',
      y: '0',
      width: '100%',
      height: '50%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: '2xl',
      fontWeight: 'bold',
      maxWidth: '90%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#8b5cf6'
    }
  },
  {
    id: 'split-bottom-image',
    name: 'Imagem Base',
    category: 'split',
    description: 'Texto na metade superior, imagem na metade inferior',
    imageFrame: {
      position: 'bottom',
      x: '0',
      y: '50%',
      width: '100%',
      height: '50%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'top-center',
      alignment: 'center',
      fontSize: '2xl',
      fontWeight: 'bold',
      maxWidth: '90%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'top-left',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#10b981'
    }
  },
  {
    id: 'split-60-40',
    name: 'Split 60/40',
    category: 'split',
    description: 'Imagem 60% topo, texto 40% base',
    imageFrame: {
      position: 'top',
      x: '0',
      y: '0',
      width: '100%',
      height: '60%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-left',
      alignment: 'left',
      fontSize: 'xl',
      fontWeight: 'bold',
      maxWidth: '85%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'normal'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#1a1a2e',
      text: '#ffffff',
      accent: '#f59e0b'
    }
  },
  {
    id: 'split-30-70',
    name: 'Texto Destaque',
    category: 'split',
    description: 'Pequena imagem topo, grande área de texto',
    imageFrame: {
      position: 'top',
      x: '0',
      y: '0',
      width: '100%',
      height: '30%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: '3xl',
      fontWeight: 'black',
      maxWidth: '90%',
      padding: '32px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0f172a',
      text: '#ffffff',
      accent: '#3b82f6'
    }
  },

  // === SPLIT VERTICAL ===
  {
    id: 'split-left-image',
    name: 'Imagem Esquerda',
    category: 'split',
    description: 'Imagem à esquerda, texto à direita',
    imageFrame: {
      position: 'left',
      x: '0',
      y: '0',
      width: '50%',
      height: '100%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center-right',
      alignment: 'left',
      fontSize: 'xl',
      fontWeight: 'bold',
      maxWidth: '90%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'normal'
    },
    logoPosition: 'top-right',
    colors: {
      background: '#18181b',
      text: '#ffffff',
      accent: '#ec4899'
    }
  },
  {
    id: 'split-right-image',
    name: 'Imagem Direita',
    category: 'split',
    description: 'Texto à esquerda, imagem à direita',
    imageFrame: {
      position: 'right',
      x: '50%',
      y: '0',
      width: '50%',
      height: '100%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center-left',
      alignment: 'left',
      fontSize: 'xl',
      fontWeight: 'bold',
      maxWidth: '90%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'normal'
    },
    logoPosition: 'top-left',
    colors: {
      background: '#1e1e1e',
      text: '#ffffff',
      accent: '#22c55e'
    }
  },

  // === CARD / MOLDURA ===
  {
    id: 'card-centered',
    name: 'Card Central',
    category: 'card',
    description: 'Imagem em card centralizado, texto abaixo',
    imageFrame: {
      position: 'center',
      x: '10%',
      y: '8%',
      width: '80%',
      height: '50%',
      borderRadius: '12px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: 'lg',
      fontWeight: 'semibold',
      maxWidth: '85%',
      padding: '20px',
      textShadow: false,
      lineHeight: 'normal'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#a855f7'
    }
  },
  {
    id: 'card-rounded',
    name: 'Card Arredondado',
    category: 'card',
    description: 'Card com cantos muito arredondados',
    imageFrame: {
      position: 'top',
      x: '5%',
      y: '5%',
      width: '90%',
      height: '55%',
      borderRadius: '24px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: 'xl',
      fontWeight: 'bold',
      maxWidth: '85%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#1a1a1a',
      text: '#ffffff',
      accent: '#06b6d4'
    }
  },
  {
    id: 'card-polaroid',
    name: 'Polaroid',
    category: 'card',
    description: 'Estilo polaroid com margem',
    imageFrame: {
      position: 'top',
      x: '10%',
      y: '8%',
      width: '80%',
      height: '58%',
      borderRadius: '4px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: 'lg',
      fontWeight: 'medium',
      maxWidth: '80%',
      padding: '20px',
      textShadow: false,
      lineHeight: 'normal'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#fafafa',
      text: '#1a1a1a',
      accent: '#ef4444'
    }
  },
  {
    id: 'card-neon',
    name: 'Card Neon',
    category: 'card',
    description: 'Card com borda neon brilhante',
    imageFrame: {
      position: 'center',
      x: '10%',
      y: '10%',
      width: '80%',
      height: '50%',
      borderRadius: '16px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: 'xl',
      fontWeight: 'bold',
      maxWidth: '85%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'top-left',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#00ff88'
    }
  },

  // === FULL BLEED ===
  {
    id: 'fullbleed-bottom',
    name: 'Full + Texto Base',
    category: 'fullbleed',
    description: 'Imagem full, texto sobreposto na base',
    imageFrame: {
      position: 'full',
      x: '0',
      y: '0',
      width: '100%',
      height: '100%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-left',
      alignment: 'left',
      fontSize: '2xl',
      fontWeight: 'black',
      maxWidth: '85%',
      padding: '32px',
      textShadow: true,
      lineHeight: 'tight'
    },
    logoPosition: 'top-right',
    colors: {
      background: '#000000',
      text: '#ffffff',
      accent: '#fbbf24'
    },
    overlay: {
      type: 'gradient-bottom',
      opacity: 0.7
    }
  },
  {
    id: 'fullbleed-center',
    name: 'Full + Texto Central',
    category: 'fullbleed',
    description: 'Imagem full, texto centralizado',
    imageFrame: {
      position: 'full',
      x: '0',
      y: '0',
      width: '100%',
      height: '100%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center',
      alignment: 'center',
      fontSize: '3xl',
      fontWeight: 'black',
      maxWidth: '80%',
      padding: '32px',
      textShadow: true,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#000000',
      text: '#ffffff',
      accent: '#f43f5e'
    },
    overlay: {
      type: 'solid',
      opacity: 0.5
    }
  },
  {
    id: 'fullbleed-top',
    name: 'Full + Texto Topo',
    category: 'fullbleed',
    description: 'Imagem full, texto sobreposto no topo',
    imageFrame: {
      position: 'full',
      x: '0',
      y: '0',
      width: '100%',
      height: '100%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'top-left',
      alignment: 'left',
      fontSize: '2xl',
      fontWeight: 'bold',
      maxWidth: '85%',
      padding: '32px',
      textShadow: true,
      lineHeight: 'normal'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#000000',
      text: '#ffffff',
      accent: '#14b8a6'
    },
    overlay: {
      type: 'gradient-top',
      opacity: 0.6
    }
  },

  // === MINIMAL ===
  {
    id: 'minimal-text-only',
    name: 'Só Texto',
    category: 'minimal',
    description: 'Apenas texto centralizado, sem imagem',
    imageFrame: {
      position: 'none',
      x: '0',
      y: '0',
      width: '0',
      height: '0',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center',
      alignment: 'center',
      fontSize: '3xl',
      fontWeight: 'black',
      maxWidth: '80%',
      padding: '40px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#8b5cf6'
    }
  },
  {
    id: 'minimal-left-aligned',
    name: 'Texto Alinhado Esquerda',
    category: 'minimal',
    description: 'Texto alinhado à esquerda, sem imagem',
    imageFrame: {
      position: 'none',
      x: '0',
      y: '0',
      width: '0',
      height: '0',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center-left',
      alignment: 'left',
      fontSize: '2xl',
      fontWeight: 'bold',
      maxWidth: '75%',
      padding: '40px',
      textShadow: false,
      lineHeight: 'normal'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0f0f0f',
      text: '#ffffff',
      accent: '#22c55e'
    }
  },
  {
    id: 'minimal-quote',
    name: 'Citação',
    category: 'minimal',
    description: 'Estilo citação com aspas grandes',
    imageFrame: {
      position: 'none',
      x: '0',
      y: '0',
      width: '0',
      height: '0',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center',
      alignment: 'center',
      fontSize: '2xl',
      fontWeight: 'medium',
      maxWidth: '75%',
      padding: '48px',
      textShadow: false,
      lineHeight: 'relaxed'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#1a1a1a',
      text: '#e5e5e5',
      accent: '#f59e0b'
    }
  },

  // === BOLD / IMPACTO ===
  {
    id: 'bold-statement',
    name: 'Declaração Bold',
    category: 'bold',
    description: 'Texto grande e impactante, imagem pequena',
    imageFrame: {
      position: 'bottom',
      x: '25%',
      y: '70%',
      width: '50%',
      height: '25%',
      borderRadius: '8px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'top-center',
      alignment: 'center',
      fontSize: '3xl',
      fontWeight: 'black',
      maxWidth: '90%',
      padding: '48px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#ef4444'
    }
  },
  {
    id: 'bold-number',
    name: 'Número Destaque',
    category: 'bold',
    description: 'Para estatísticas e números grandes',
    imageFrame: {
      position: 'right',
      x: '60%',
      y: '20%',
      width: '35%',
      height: '60%',
      borderRadius: '12px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center-left',
      alignment: 'left',
      fontSize: '3xl',
      fontWeight: 'black',
      maxWidth: '55%',
      padding: '32px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-left',
    colors: {
      background: '#0f172a',
      text: '#ffffff',
      accent: '#3b82f6'
    }
  },
  {
    id: 'bold-cta',
    name: 'Call to Action',
    category: 'bold',
    description: 'Slide de CTA com texto grande',
    imageFrame: {
      position: 'top',
      x: '20%',
      y: '5%',
      width: '60%',
      height: '40%',
      borderRadius: '16px',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: '2xl',
      fontWeight: 'black',
      maxWidth: '85%',
      padding: '28px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#0a0a0a',
      text: '#ffffff',
      accent: '#10b981'
    }
  },

  // === EDITORIAL ===
  {
    id: 'editorial-magazine',
    name: 'Magazine',
    category: 'editorial',
    description: 'Estilo revista com layout elegante',
    imageFrame: {
      position: 'left',
      x: '0',
      y: '0',
      width: '45%',
      height: '100%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'center-right',
      alignment: 'left',
      fontSize: 'xl',
      fontWeight: 'medium',
      maxWidth: '90%',
      padding: '32px',
      textShadow: false,
      lineHeight: 'relaxed'
    },
    logoPosition: 'top-right',
    colors: {
      background: '#fafafa',
      text: '#1a1a1a',
      accent: '#dc2626'
    }
  },
  {
    id: 'editorial-news',
    name: 'Breaking News',
    category: 'editorial',
    description: 'Estilo notícia urgente',
    imageFrame: {
      position: 'top',
      x: '0',
      y: '15%',
      width: '100%',
      height: '50%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-left',
      alignment: 'left',
      fontSize: 'xl',
      fontWeight: 'bold',
      maxWidth: '95%',
      padding: '20px',
      textShadow: false,
      lineHeight: 'tight'
    },
    logoPosition: 'top-left',
    colors: {
      background: '#dc2626',
      text: '#ffffff',
      accent: '#fbbf24'
    }
  },
  {
    id: 'editorial-story',
    name: 'Storytelling',
    category: 'editorial',
    description: 'Layout para contar histórias',
    imageFrame: {
      position: 'full',
      x: '0',
      y: '0',
      width: '100%',
      height: '65%',
      borderRadius: '0',
      objectFit: 'cover'
    },
    textStyle: {
      position: 'bottom-center',
      alignment: 'center',
      fontSize: 'lg',
      fontWeight: 'medium',
      maxWidth: '90%',
      padding: '24px',
      textShadow: false,
      lineHeight: 'relaxed'
    },
    logoPosition: 'bottom-right',
    colors: {
      background: '#1a1a1a',
      text: '#e5e5e5',
      accent: '#8b5cf6'
    }
  },
];

// Paletas de cores
export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    accent: string;
  };
}

export const colorPalettes: ColorPalette[] = [
  // Paletas com fundos coloridos distintos para variedade visual
  { id: 'dark-purple', name: 'Roxo Escuro', colors: { background: '#1e1033', text: '#ffffff', accent: '#a78bfa' } },
  { id: 'dark-green', name: 'Verde Escuro', colors: { background: '#0d2818', text: '#ffffff', accent: '#34d399' } },
  { id: 'dark-blue', name: 'Azul Escuro', colors: { background: '#0f172a', text: '#ffffff', accent: '#60a5fa' } },
  { id: 'dark-red', name: 'Vermelho Escuro', colors: { background: '#2a0f0f', text: '#ffffff', accent: '#f87171' } },
  { id: 'dark-orange', name: 'Laranja Escuro', colors: { background: '#2a1a0f', text: '#ffffff', accent: '#fb923c' } },
  { id: 'dark-pink', name: 'Rosa Escuro', colors: { background: '#2a0f1e', text: '#ffffff', accent: '#f472b6' } },
  { id: 'dark-cyan', name: 'Ciano Escuro', colors: { background: '#0f2a2a', text: '#ffffff', accent: '#22d3ee' } },
  { id: 'dark-gold', name: 'Dourado Escuro', colors: { background: '#2a2510', text: '#ffffff', accent: '#fcd34d' } },
  { id: 'light-minimal', name: 'Claro Minimalista', colors: { background: '#fafafa', text: '#1a1a1a', accent: '#0a0a0a' } },
  { id: 'light-warm', name: 'Claro Quente', colors: { background: '#fffbeb', text: '#1a1a1a', accent: '#d97706' } },
  { id: 'neon-green', name: 'Neon Verde', colors: { background: '#0a0a0a', text: '#ffffff', accent: '#00ff88' } },
  { id: 'neon-pink', name: 'Neon Rosa', colors: { background: '#0a0a0a', text: '#ffffff', accent: '#ff00ff' } },
  { id: 'gradient-sunset', name: 'Gradiente Sunset', colors: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', accent: '#fbbf24' } },
  { id: 'gradient-ocean', name: 'Gradiente Ocean', colors: { background: 'linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)', text: '#ffffff', accent: '#22d3ee' } },
];

// Helper para obter template por ID
export function getDesignTemplate(id: string): DesignTemplate | undefined {
  return designTemplates.find(t => t.id === id);
}

// Helper para obter paleta por ID
export function getColorPalette(id: string): ColorPalette | undefined {
  return colorPalettes.find(p => p.id === id);
}
