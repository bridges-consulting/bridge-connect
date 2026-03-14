import { GraduationCap } from "lucide-react";

const Academy = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Academy</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Materiais de estudo, treinamentos e recursos do Programa Bridges.
        </p>
      </div>

      {/* Em breve */}
      <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-primary/20 bg-primary/[0.03]">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
        <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-3">Em breve</p>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Bridges <span className="text-primary italic font-light">Academy</span>
        </h2>
        <p className="text-sm text-foreground/40 max-w-sm leading-relaxed">
          Aqui você encontrará vídeos, documentos, e-books e tudo que precisa para se tornar um Conector de alto desempenho.
        </p>
      </div>
    </div>
  );
};

export default Academy;
