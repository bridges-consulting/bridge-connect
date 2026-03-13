import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    if (error) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
    } else {
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-1">
            Bem-vindo ao
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">
            Programa Bridges
          </h1>
          <p className="text-xs text-foreground/40 mt-1">by AllGreen Consulting</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-foreground mb-6">Entrar na plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold tracking-widest uppercase text-primary/80">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-white/[0.05] border-white/10 text-foreground placeholder:text-foreground/25 focus:border-primary/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold tracking-widest uppercase text-primary/80">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/[0.05] border-white/10 text-foreground placeholder:text-foreground/25 focus:border-primary/60"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        {/* Link para candidatura */}
        <p className="text-center text-sm text-foreground/40 mt-6">
          Quer ser um Conector?{" "}
          <Link
            to="/cadastro"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Envie sua candidatura
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
