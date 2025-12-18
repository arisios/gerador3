// Templates Visuais Completos com Layouts Profissionais
// Cada template tem layout fixo, posicionamento de texto, imagem e logo

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'split' | 'card' | 'fullbleed' | 'minimal' | 'bold' | 'editorial';
  description: string;
  layout: {
    // Área da imagem (porcentagem)
    image: {
      position: 'top' | 'bottom' | 'left' | 'right' | 'full' | 'center' | 'none';
      width: number; // 0-100%
      height: number; // 0-100%
    };
    // Área do texto
    text: {
      position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'overlay-top' | 'overlay-bottom' | 'overlay-center';
      alignment: 'left' | 'center' | 'right';
      maxWidth: number; // 0-100%
    };
    // Posição do logo
    logo: {
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
      size: 'small' | 'medium' | 'large';
    };
    // Elementos decorativos
    decorations: {
      type: 'none' | 'line' | 'border' | 'gradient-overlay' | 'shape' | 'dots' | 'grid';
      position?: string;
    };
  };
  // Estilos padrão
  defaultStyle: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontWeight: 'normal' | 'medium' | 'bold' | 'black';
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  };
}

export const designTemplates: DesignTemplate[] = [
  // === SPLIT HORIZONTAL ===
  {
    id: 'split-top-image',
    name: 'Imagem Topo',
    category: 'split',
    description: 'Imagem ocupa metade superior, texto na metade inferior',
    layout: {
      image: { position: 'top', width: 100, height: 50 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 90 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'none' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      accentColor: '#8b5cf6',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'split-bottom-image',
    name: 'Imagem Base',
    category: 'split',
    description: 'Texto na metade superior, imagem na metade inferior',
    layout: {
      image: { position: 'bottom', width: 100, height: 50 },
      text: { position: 'top', alignment: 'center', maxWidth: 90 },
      logo: { position: 'top-left', size: 'small' },
      decorations: { type: 'none' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      accentColor: '#10b981',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'split-60-40',
    name: 'Split 60/40',
    category: 'split',
    description: 'Imagem 60% topo, texto 40% base com destaque',
    layout: {
      image: { position: 'top', width: 100, height: 60 },
      text: { position: 'bottom', alignment: 'left', maxWidth: 85 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'line', position: 'left' }
    },
    defaultStyle: {
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      accentColor: '#f59e0b',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'split-30-70',
    name: 'Texto Destaque',
    category: 'split',
    description: 'Pequena imagem topo, grande área de texto',
    layout: {
      image: { position: 'top', width: 100, height: 30 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 90 },
      logo: { position: 'bottom-center', size: 'medium' },
      decorations: { type: 'gradient-overlay' }
    },
    defaultStyle: {
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      accentColor: '#3b82f6',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },

  // === SPLIT VERTICAL ===
  {
    id: 'split-left-image',
    name: 'Imagem Esquerda',
    category: 'split',
    description: 'Imagem à esquerda, texto à direita',
    layout: {
      image: { position: 'left', width: 50, height: 100 },
      text: { position: 'right', alignment: 'left', maxWidth: 90 },
      logo: { position: 'top-right', size: 'small' },
      decorations: { type: 'none' }
    },
    defaultStyle: {
      backgroundColor: '#18181b',
      textColor: '#ffffff',
      accentColor: '#ec4899',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'split-right-image',
    name: 'Imagem Direita',
    category: 'split',
    description: 'Texto à esquerda, imagem à direita',
    layout: {
      image: { position: 'right', width: 50, height: 100 },
      text: { position: 'left', alignment: 'left', maxWidth: 90 },
      logo: { position: 'top-left', size: 'small' },
      decorations: { type: 'line', position: 'bottom' }
    },
    defaultStyle: {
      backgroundColor: '#1e1e1e',
      textColor: '#ffffff',
      accentColor: '#22c55e',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'split-diagonal',
    name: 'Diagonal',
    category: 'split',
    description: 'Divisão diagonal entre imagem e texto',
    layout: {
      image: { position: 'left', width: 55, height: 100 },
      text: { position: 'right', alignment: 'left', maxWidth: 85 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'shape', position: 'diagonal' }
    },
    defaultStyle: {
      backgroundColor: '#0c0c0c',
      textColor: '#ffffff',
      accentColor: '#f97316',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },

  // === CARD / MOLDURA ===
  {
    id: 'card-centered',
    name: 'Card Central',
    category: 'card',
    description: 'Card centralizado com borda e sombra',
    layout: {
      image: { position: 'center', width: 85, height: 50 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 85 },
      logo: { position: 'top-center', size: 'medium' },
      decorations: { type: 'border' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      accentColor: '#a855f7',
      fontWeight: 'medium',
      fontSize: 'medium'
    }
  },
  {
    id: 'card-rounded',
    name: 'Card Arredondado',
    category: 'card',
    description: 'Card com cantos muito arredondados',
    layout: {
      image: { position: 'top', width: 90, height: 55 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 85 },
      logo: { position: 'bottom-center', size: 'small' },
      decorations: { type: 'border' }
    },
    defaultStyle: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      accentColor: '#06b6d4',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'card-polaroid',
    name: 'Polaroid',
    category: 'card',
    description: 'Estilo polaroid com margem branca',
    layout: {
      image: { position: 'top', width: 85, height: 60 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 80 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'border' }
    },
    defaultStyle: {
      backgroundColor: '#fafafa',
      textColor: '#1a1a1a',
      accentColor: '#ef4444',
      fontWeight: 'medium',
      fontSize: 'medium'
    }
  },
  {
    id: 'card-neon',
    name: 'Card Neon',
    category: 'card',
    description: 'Card com borda neon brilhante',
    layout: {
      image: { position: 'center', width: 80, height: 50 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 85 },
      logo: { position: 'top-left', size: 'small' },
      decorations: { type: 'border' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      accentColor: '#00ff88',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },

  // === FULL BLEED ===
  {
    id: 'fullbleed-overlay-bottom',
    name: 'Texto Sobreposto Base',
    category: 'fullbleed',
    description: 'Imagem full, texto sobreposto na base com gradiente',
    layout: {
      image: { position: 'full', width: 100, height: 100 },
      text: { position: 'overlay-bottom', alignment: 'left', maxWidth: 90 },
      logo: { position: 'top-right', size: 'small' },
      decorations: { type: 'gradient-overlay' }
    },
    defaultStyle: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },
  {
    id: 'fullbleed-overlay-center',
    name: 'Texto Central',
    category: 'fullbleed',
    description: 'Imagem full, texto centralizado com overlay escuro',
    layout: {
      image: { position: 'full', width: 100, height: 100 },
      text: { position: 'overlay-center', alignment: 'center', maxWidth: 85 },
      logo: { position: 'bottom-center', size: 'medium' },
      decorations: { type: 'gradient-overlay' }
    },
    defaultStyle: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      accentColor: '#f43f5e',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },
  {
    id: 'fullbleed-overlay-top',
    name: 'Texto Sobreposto Topo',
    category: 'fullbleed',
    description: 'Imagem full, texto sobreposto no topo',
    layout: {
      image: { position: 'full', width: 100, height: 100 },
      text: { position: 'overlay-top', alignment: 'left', maxWidth: 90 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'gradient-overlay' }
    },
    defaultStyle: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      accentColor: '#14b8a6',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },

  // === MINIMAL ===
  {
    id: 'minimal-text-only',
    name: 'Só Texto',
    category: 'minimal',
    description: 'Apenas texto centralizado, sem imagem',
    layout: {
      image: { position: 'none', width: 0, height: 0 },
      text: { position: 'center', alignment: 'center', maxWidth: 80 },
      logo: { position: 'bottom-center', size: 'small' },
      decorations: { type: 'none' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      accentColor: '#8b5cf6',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },
  {
    id: 'minimal-quote',
    name: 'Citação',
    category: 'minimal',
    description: 'Texto estilo citação com aspas grandes',
    layout: {
      image: { position: 'none', width: 0, height: 0 },
      text: { position: 'center', alignment: 'center', maxWidth: 75 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'shape', position: 'quotes' }
    },
    defaultStyle: {
      backgroundColor: '#18181b',
      textColor: '#ffffff',
      accentColor: '#d946ef',
      fontWeight: 'medium',
      fontSize: 'large'
    }
  },
  {
    id: 'minimal-left-align',
    name: 'Alinhado Esquerda',
    category: 'minimal',
    description: 'Texto alinhado à esquerda com linha de destaque',
    layout: {
      image: { position: 'none', width: 0, height: 0 },
      text: { position: 'center', alignment: 'left', maxWidth: 85 },
      logo: { position: 'top-left', size: 'medium' },
      decorations: { type: 'line', position: 'left' }
    },
    defaultStyle: {
      backgroundColor: '#0c0c0c',
      textColor: '#ffffff',
      accentColor: '#22c55e',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  },
  {
    id: 'minimal-gradient-bg',
    name: 'Gradiente',
    category: 'minimal',
    description: 'Texto sobre fundo gradiente',
    layout: {
      image: { position: 'none', width: 0, height: 0 },
      text: { position: 'center', alignment: 'center', maxWidth: 80 },
      logo: { position: 'bottom-center', size: 'medium' },
      decorations: { type: 'gradient-overlay' }
    },
    defaultStyle: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },

  // === BOLD / IMPACTO ===
  {
    id: 'bold-big-number',
    name: 'Número Grande',
    category: 'bold',
    description: 'Destaque para números/estatísticas',
    layout: {
      image: { position: 'none', width: 0, height: 0 },
      text: { position: 'center', alignment: 'center', maxWidth: 90 },
      logo: { position: 'bottom-right', size: 'small' },
      decorations: { type: 'shape', position: 'circle' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      accentColor: '#ef4444',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },
  {
    id: 'bold-breaking',
    name: 'Breaking News',
    category: 'bold',
    description: 'Estilo urgente/notícia',
    layout: {
      image: { position: 'bottom', width: 100, height: 40 },
      text: { position: 'top', alignment: 'left', maxWidth: 95 },
      logo: { position: 'top-right', size: 'small' },
      decorations: { type: 'line', position: 'top' }
    },
    defaultStyle: {
      backgroundColor: '#1a0a0a',
      textColor: '#ffffff',
      accentColor: '#dc2626',
      fontWeight: 'black',
      fontSize: 'xlarge'
    }
  },
  {
    id: 'bold-checklist',
    name: 'Checklist',
    category: 'bold',
    description: 'Lista com checkmarks',
    layout: {
      image: { position: 'none', width: 0, height: 0 },
      text: { position: 'center', alignment: 'left', maxWidth: 85 },
      logo: { position: 'top-left', size: 'small' },
      decorations: { type: 'dots' }
    },
    defaultStyle: {
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      accentColor: '#10b981',
      fontWeight: 'medium',
      fontSize: 'medium'
    }
  },

  // === EDITORIAL ===
  {
    id: 'editorial-magazine',
    name: 'Magazine',
    category: 'editorial',
    description: 'Estilo revista com tipografia elegante',
    layout: {
      image: { position: 'top', width: 100, height: 55 },
      text: { position: 'bottom', alignment: 'left', maxWidth: 90 },
      logo: { position: 'top-left', size: 'small' },
      decorations: { type: 'line', position: 'bottom' }
    },
    defaultStyle: {
      backgroundColor: '#fafaf9',
      textColor: '#1c1917',
      accentColor: '#b91c1c',
      fontWeight: 'medium',
      fontSize: 'large'
    }
  },
  {
    id: 'editorial-luxury',
    name: 'Luxo',
    category: 'editorial',
    description: 'Estilo luxuoso com dourado',
    layout: {
      image: { position: 'center', width: 75, height: 55 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 80 },
      logo: { position: 'top-center', size: 'medium' },
      decorations: { type: 'border' }
    },
    defaultStyle: {
      backgroundColor: '#0a0a0a',
      textColor: '#fafafa',
      accentColor: '#d4af37',
      fontWeight: 'medium',
      fontSize: 'large'
    }
  },
  {
    id: 'editorial-clean',
    name: 'Clean',
    category: 'editorial',
    description: 'Design limpo e profissional',
    layout: {
      image: { position: 'top', width: 100, height: 45 },
      text: { position: 'bottom', alignment: 'center', maxWidth: 85 },
      logo: { position: 'bottom-center', size: 'small' },
      decorations: { type: 'none' }
    },
    defaultStyle: {
      backgroundColor: '#ffffff',
      textColor: '#171717',
      accentColor: '#2563eb',
      fontWeight: 'bold',
      fontSize: 'large'
    }
  }
];

// Paletas de cores predefinidas
export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
  };
}

export const colorPalettes: ColorPalette[] = [
  {
    id: 'dark-purple',
    name: 'Roxo Escuro',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#8b5cf6', secondary: '#a78bfa' }
  },
  {
    id: 'dark-green',
    name: 'Verde Escuro',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#10b981', secondary: '#34d399' }
  },
  {
    id: 'dark-blue',
    name: 'Azul Escuro',
    colors: { background: '#0f172a', text: '#ffffff', accent: '#3b82f6', secondary: '#60a5fa' }
  },
  {
    id: 'dark-red',
    name: 'Vermelho Escuro',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#ef4444', secondary: '#f87171' }
  },
  {
    id: 'dark-orange',
    name: 'Laranja Escuro',
    colors: { background: '#0c0c0c', text: '#ffffff', accent: '#f97316', secondary: '#fb923c' }
  },
  {
    id: 'dark-pink',
    name: 'Rosa Escuro',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#ec4899', secondary: '#f472b6' }
  },
  {
    id: 'dark-cyan',
    name: 'Ciano Escuro',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#06b6d4', secondary: '#22d3ee' }
  },
  {
    id: 'dark-gold',
    name: 'Dourado Escuro',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#d4af37', secondary: '#fbbf24' }
  },
  {
    id: 'light-blue',
    name: 'Azul Claro',
    colors: { background: '#ffffff', text: '#1e293b', accent: '#2563eb', secondary: '#3b82f6' }
  },
  {
    id: 'light-green',
    name: 'Verde Claro',
    colors: { background: '#fafafa', text: '#166534', accent: '#16a34a', secondary: '#22c55e' }
  },
  {
    id: 'light-red',
    name: 'Vermelho Claro',
    colors: { background: '#fafaf9', text: '#1c1917', accent: '#dc2626', secondary: '#ef4444' }
  },
  {
    id: 'neon-green',
    name: 'Neon Verde',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#00ff88', secondary: '#39ff14' }
  },
  {
    id: 'neon-pink',
    name: 'Neon Rosa',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#ff00ff', secondary: '#ff69b4' }
  },
  {
    id: 'neon-blue',
    name: 'Neon Azul',
    colors: { background: '#0a0a0a', text: '#ffffff', accent: '#00f5ff', secondary: '#00bfff' }
  },
  {
    id: 'gradient-purple',
    name: 'Gradiente Roxo',
    colors: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', accent: '#fbbf24', secondary: '#f59e0b' }
  },
  {
    id: 'gradient-sunset',
    name: 'Gradiente Pôr do Sol',
    colors: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#ffffff', accent: '#fbbf24', secondary: '#ffffff' }
  }
];

// Função para obter template por ID
export function getTemplateById(id: string): DesignTemplate | undefined {
  return designTemplates.find(t => t.id === id);
}

// Função para obter templates por categoria
export function getTemplatesByCategory(category: DesignTemplate['category']): DesignTemplate[] {
  return designTemplates.filter(t => t.category === category);
}

// Função para obter paleta por ID
export function getPaletteById(id: string): ColorPalette | undefined {
  return colorPalettes.find(p => p.id === id);
}

// Função para selecionar templates variados para um carrossel
export function selectVariedTemplates(count: number, preferredCategories?: string[]): DesignTemplate[] {
  const selected: DesignTemplate[] = [];
  const availableTemplates = [...designTemplates];
  
  // Embaralhar templates
  for (let i = availableTemplates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableTemplates[i], availableTemplates[j]] = [availableTemplates[j], availableTemplates[i]];
  }
  
  // Selecionar templates variados (evitando repetir categoria consecutivamente)
  let lastCategory = '';
  let index = 0;
  
  while (selected.length < count && index < availableTemplates.length * 2) {
    const template = availableTemplates[index % availableTemplates.length];
    
    // Evitar mesma categoria consecutiva
    if (template.category !== lastCategory || selected.length === 0) {
      selected.push(template);
      lastCategory = template.category;
    }
    
    index++;
  }
  
  return selected;
}
