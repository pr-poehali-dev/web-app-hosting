import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;

export default function Profile() {
  const { user, token, subscription } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [nickLoading, setNickLoading] = useState(false);
  const [nickError, setNickError] = useState("");
  const [nickSuccess, setNickSuccess] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const handleNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNickError(""); setNickSuccess("");
    setNickLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=change_nickname`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token! },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setNickSuccess("Никнейм обновлён");
    } catch (err: unknown) {
      setNickError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setNickLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(""); setPassSuccess("");
    if (newPassword !== newPassword2) {
      setPassError("Пароли не совпадают");
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token! },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setPassSuccess("Пароль успешно изменён");
      setOldPassword(""); setNewPassword(""); setNewPassword2("");
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPassLoading(false);
    }
  };

  const roleLabel: Record<string, string> = { owner: "Владелец", admin: "Администратор", subscriber: "Подписчик" };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <h1 className="text-base font-semibold text-foreground">Профиль</h1>
        </div>

        {/* Инфо */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="User" size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{user?.nickname}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {roleLabel[user?.role || ""] || user?.role}
              </span>
            </div>
          </div>
          {subscription && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 border-t border-border pt-3">
              <Icon name="CheckCircle" size={12} className="text-green-500" />
              Подписка активна до {new Date(subscription.expires_at).toLocaleDateString("ru")}
            </div>
          )}
        </div>

        {/* Смена никнейма */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Сменить никнейм</h2>
          <form onSubmit={handleNickname} className="space-y-3">
            {nickError && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <Icon name="AlertCircle" size={12} /> {nickError}
              </div>
            )}
            {nickSuccess && (
              <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-600 flex items-center gap-2">
                <Icon name="CheckCircle" size={12} /> {nickSuccess}
              </div>
            )}
            <div>
              <Label htmlFor="nickname" className="text-xs text-muted-foreground mb-1.5 block">Новый никнейм</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Твой никнейм"
                minLength={2}
                maxLength={30}
                required
              />
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={nickLoading}>
              {nickLoading && <Icon name="Loader2" size={13} className="animate-spin mr-1.5" />}
              Сохранить
            </Button>
          </form>
        </div>

        {/* Смена пароля */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Сменить пароль</h2>
          <form onSubmit={handlePassword} className="space-y-3">
            {passError && (
              <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <Icon name="AlertCircle" size={12} /> {passError}
              </div>
            )}
            {passSuccess && (
              <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-600 flex items-center gap-2">
                <Icon name="CheckCircle" size={12} /> {passSuccess}
              </div>
            )}
            <div>
              <Label htmlFor="old-pass" className="text-xs text-muted-foreground mb-1.5 block">Текущий пароль</Label>
              <div className="relative">
                <Input
                  id="old-pass"
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-9"
                />
                <button type="button" onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name={showOld ? "EyeOff" : "Eye"} size={13} />
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-pass" className="text-xs text-muted-foreground mb-1.5 block">Новый пароль</Label>
              <div className="relative">
                <Input
                  id="new-pass"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  required
                  className="pr-9"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name={showNew ? "EyeOff" : "Eye"} size={13} />
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-pass2" className="text-xs text-muted-foreground mb-1.5 block">Повтори новый пароль</Label>
              <Input
                id="new-pass2"
                type="password"
                value={newPassword2}
                onChange={e => setNewPassword2(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={passLoading}>
              {passLoading && <Icon name="Loader2" size={13} className="animate-spin mr-1.5" />}
              Изменить пароль
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
