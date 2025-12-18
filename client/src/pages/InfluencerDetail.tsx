import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Trash2, Loader2, User, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

interface InfluencerContent {
  id: number;
  title: string | null;
  template: string;
}

export default function InfluencerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const influencerId = parseInt(id || "0");

  const { data: influencer, isLoading } = trpc.influencers.get.useQuery({ id: influencerId });

  const deleteInfluencer = trpc.influencers.delete.useMutation({
    onSuccess: () => {
      toast.success("Influenciador excluído");
      setLocation("/influencers");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Influenciador não encontrado</p>
      </div>
    );
  }

  const contents = (influencer.contents || []) as InfluencerContent[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/influencers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="ml-2 font-medium truncate">{influencer.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => {
              if (confirm("Excluir influenciador?")) {
                deleteInfluencer.mutate({ id: influencerId });
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
            {influencer.referenceImageUrl ? (
              <img src={influencer.referenceImageUrl} alt={influencer.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{influencer.name}</h1>
            <p className="text-muted-foreground">{influencer.niche}</p>
            <p className="text-sm text-muted-foreground capitalize">{influencer.type}</p>
          </div>
        </div>

        {/* Actions */}
        <Button className="w-full" onClick={() => setLocation(`/influencer/${influencerId}/content/new`)}>
          <Zap className="w-4 h-4 mr-2" />
          Gerar Conteúdo
        </Button>

        {/* Contents */}
        <div className="space-y-4">
          <h2 className="font-medium">Conteúdos</h2>
          {contents.length > 0 ? (
            contents.map((content: InfluencerContent) => (
              <Link key={content.id} href={`/influencer/${influencerId}/content/${content.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{content.title || "Sem título"}</div>
                      <div className="text-xs text-muted-foreground">{content.template}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum conteúdo ainda</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
