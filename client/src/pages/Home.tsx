import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Sparkles, Zap, Image, Users, TrendingUp, Download } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // useEffect DEVE vir antes de qualquer return condicional
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <img src="/logo.png" alt="Gerador 3" className="w-16 h-16" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Gerador 3" className="w-8 h-8" />
            <span className="font-bold text-lg">Gerador 3</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Crie conteúdo <span className="text-primary">viral</span> em minutos
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gere carrosséis, imagens e vídeos profissionais para Instagram e TikTok 
            com inteligência artificial. Do texto ao download em poucos cliques.
          </p>
          <Button size="lg" asChild className="text-lg px-8">
            <a href={getLoginUrl()}>Começar Agora</a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Geração Rápida"
              description="Crie conteúdo completo com um clique. Texto, imagens e design prontos para postar."
            />
            <FeatureCard
              icon={<Image className="w-6 h-6" />}
              title="Templates Profissionais"
              description="12+ templates visuais inspirados nos melhores perfis do Instagram."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Influenciadores Virtuais"
              description="Crie personas consistentes para suas campanhas de marketing."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Trends & Virais"
              description="Acompanhe tendências do Google e TikTok em tempo real."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Copywriting com IA"
              description="46+ templates de texto com fórmulas AIDA, PAS, BAB e mais."
            />
            <FeatureCard
              icon={<Download className="w-6 h-6" />}
              title="Download Fácil"
              description="Baixe suas imagens em alta qualidade (1080x1350) prontas para postar."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para criar conteúdo viral?
          </h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a milhares de criadores que já usam o Gerador 3.
          </p>
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Criar Conta Grátis</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Gerador 3. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
