import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NewLead = () => {
  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Novo Lead</h1>
      <p className="text-foreground/75 text-sm mb-8">
        Preencha as informações do lead. Este formulário será substituído por um componente customizado.
      </p>

      <form className="space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground/75">Nome completo</Label>
            <Input placeholder="Nome do candidato" className="bg-surface border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/75">Email</Label>
            <Input type="email" placeholder="email@exemplo.com" className="bg-surface border-border text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground/75">Telefone</Label>
            <Input placeholder="+55 11 99999-9999" className="bg-surface border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/75">País de origem</Label>
            <Input placeholder="Brasil" className="bg-surface border-border text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground/75">Tipo de visto desejado</Label>
          <Input placeholder="EB-2, EB-5, L-1, etc." className="bg-surface border-border text-foreground placeholder:text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground/75">Observações</Label>
          <textarea
            placeholder="Informações adicionais..."
            className="w-full min-h-[100px] rounded-md border border-border bg-surface p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="gold">Enviar Lead</Button>
        </div>
      </form>
    </div>
  );
};

export default NewLead;
