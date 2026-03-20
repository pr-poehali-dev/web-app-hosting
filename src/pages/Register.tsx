import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    nickname: "",
    email: "",
    password: "",
    gdpr_consent: false,
    invite_code: searchParams.get("invite") || "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.gdpr_consent) { setError("Необходимо согласие на обработку персональных данных"); return; }
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Icon name="TrendingUp" size={24} className="text-primary" />
          </div>
          <h1 className="font-display text-xl tracking-widest text-foreground uppercase mb-1">TradeClub</h1>
          <p className="text-sm text-muted-foreground">Закрытый трейдинг-клуб</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-5">Регистрация</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nickname" className="text-xs text-muted-foreground mb-1.5 block">Никнейм</Label>
              <Input
                id="nickname"
                placeholder="trader_pro"
                value={form.nickname}
                onChange={e => set("nickname", e.target.value)}
                required
                maxLength={50}
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.ru"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground mb-1.5 block">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Минимум 6 символов"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={15} />
                </button>
              </div>
            </div>

            {!searchParams.get("invite") && (
              <div>
                <Label htmlFor="invite" className="text-xs text-muted-foreground mb-1.5 block">
                  Код приглашения <span className="text-muted-foreground/50">(если есть)</span>
                </Label>
                <Input
                  id="invite"
                  placeholder="invite-код"
                  value={form.invite_code}
                  onChange={e => set("invite_code", e.target.value)}
                />
              </div>
            )}

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="gdpr"
                checked={form.gdpr_consent}
                onCheckedChange={v => set("gdpr_consent", !!v)}
                className="mt-0.5"
              />
              <Label htmlFor="gdpr" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Я согласен на{" "}
                <span className="text-foreground underline underline-offset-2">обработку персональных данных</span>{" "}
                в соответствии с ФЗ-152. Дата и IP фиксируются.
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Icon name="Loader2" size={15} className="animate-spin mr-2" /> : null}
              Создать аккаунт
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-foreground hover:underline">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
