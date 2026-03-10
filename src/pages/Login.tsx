import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError("Email ou senha incorretos. Verifique e tente novamente.");
      } else {
        navigate("/");
      }
    } else {
      if (!nome.trim()) {
        setError("Por favor, informe seu nome completo.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nome);
      if (error) {
        setError(error.message === "User already registered"
          ? "Este email já está cadastrado. Faça login."
          : "Erro ao criar conta. Tente novamente.");
      } else {
        setSuccessMsg("Conta criada! Verifique seu email para confirmar o cadastro.");
        setIsLogin(true);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg border border-primary/40 bg-card">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-wide">THE BRIDGE</h1>
          <p className="text-sm text-primary font-medium tracking-widest">Consulting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground/75">Nome completo</Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="bg-surface border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/75">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-surface border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/75">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-surface border-border text-foreground placeholder:text-muted-foreground"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {successMsg}
            </div>
          )}

          <Button type="submit" variant="gold" className="w-full" disabled={loading}>
            {loading ? "Aguarde..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-foreground/60">
          {isLogin ? "Não tem uma conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
