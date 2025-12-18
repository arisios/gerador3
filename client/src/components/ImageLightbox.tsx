import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X, Download, Trash2, RefreshCw, Edit2, Check, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt?: string;
  onRegenerate?: (newPrompt: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  title?: string;
  showPrompt?: boolean;
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  prompt = "",
  onRegenerate,
  onDelete,
  title = "Imagem",
  showPrompt = true,
}: ImageLightboxProps) {
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCurrentPrompt(prompt);
  }, [prompt]);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro ao baixar imagem");
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate(currentPrompt);
      setEditingPrompt(false);
      toast.success("Imagem regenerada!");
    } catch (error) {
      toast.error("Erro ao regenerar imagem");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
      toast.success("Imagem excluída!");
    } catch (error) {
      toast.error("Erro ao excluir imagem");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    toast.success("Prompt copiado!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem em tela cheia */}
          <div className="relative bg-black/50 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto max-h-[60vh] object-contain mx-auto"
            />
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>

            {onRegenerate && (
              <Button
                variant="outline"
                onClick={() => setEditingPrompt(!editingPrompt)}
                disabled={isRegenerating}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {editingPrompt ? "Cancelar Edição" : "Editar Prompt"}
              </Button>
            )}

            {onRegenerate && (
              <Button
                variant="default"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerar
              </Button>
            )}

            {onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Excluir
              </Button>
            )}
          </div>

          {/* Prompt */}
          {showPrompt && currentPrompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Prompt usado (orientação para upload)
                </label>
                <Button variant="ghost" size="sm" onClick={handleCopyPrompt}>
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              </div>

              {editingPrompt ? (
                <div className="space-y-2">
                  <Textarea
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    rows={4}
                    placeholder="Descreva a imagem que deseja gerar..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Edite o prompt e clique em "Regenerar" para criar uma nova imagem
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  {currentPrompt}
                </div>
              )}
            </div>
          )}

          {/* Dica */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Use o prompt como orientação para fazer upload de uma imagem similar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageLightbox;
