import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import func2url from "../../backend/func2url.json";

const ADMIN_URL = func2url.admin;

type Tab = "stats" | "users" | "payments" | "invites";

function useAdminFetch(action: string, token: string | null, params = "") {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refetch = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${ADMIN_URL}?action=${action}${params}`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => { setData(d); setError(""); })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { refetch(); }, [action, params]);
  return { data, loading, error, refetch };
}

function StatsPanel({ token }: { token: string | null }) {
  const { data, loading } = useAdminFetch("stats", token);
  const stats = data as { total_users?: number; new_users_30d?: number; active_subscriptions?: number; pending_payments?: number; blocked_users?: number } | null;
  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { label: "Пользователей", value: stats?.total_users, icon: "Users" },
        { label: "Новых за 30 дней", value: stats?.new_users_30d, icon: "UserPlus" },
        { label: "Активных подписок", value: stats?.active_subscriptions, icon: "CheckCircle" },
        { label: "Заявок на проверке", value: stats?.pending_payments, icon: "Clock", accent: (stats?.pending_payments ?? 0) > 0 },
        { label: "Заблокировано", value: stats?.blocked_users, icon: "Ban" },
      ].map((s, i) => (
        <div key={i} className={`bg-card border rounded-xl p-4 ${s.accent ? "border-yellow-500/40" : "border-border"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon name={s.icon as string} size={14} className={s.accent ? "text-yellow-500" : "text-muted-foreground"} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
          <div className="text-2xl font-display text-foreground">{s.value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

function UsersPanel({ token }: { token: string | null }) {
  const { data, loading, refetch } = useAdminFetch("users", token);
  const [blocking, setBlocking] = useState<number | null>(null);
  const [grantUser, setGrantUser] = useState<number | null>(null);
  const [grantPlan, setGrantPlan] = useState("month");

  const users = (data as { users?: Record<string, unknown>[] } | null)?.users || [];

  const block = async (uid: number, blocked: boolean) => {
    setBlocking(uid);
    await fetch(`${ADMIN_URL}?action=block`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ user_id: uid, blocked }),
    });
    setBlocking(null);
    refetch();
  };

  const grant = async (uid: number) => {
    await fetch(`${ADMIN_URL}?action=grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ user_id: uid, plan: grantPlan }),
    });
    setGrantUser(null);
    refetch();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-2">
      {users.map((u: Record<string, unknown>) => {
        const sub = u.subscription as { plan?: string; expires_at?: string } | null;
        const isBlocked = u.is_blocked as boolean;
        return (
          <div key={u.id as number} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-display text-primary flex-shrink-0">
              {(u.nickname as string).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{u.nickname as string}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{u.role as string}</span>
                {isBlocked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Заблокирован</span>}
                {sub ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/10 text-green">
                    до {new Date(sub.expires_at!).toLocaleDateString("ru")}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Нет подписки</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{u.email as string}</div>

              {grantUser === u.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={grantPlan}
                    onChange={e => setGrantPlan(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                  >
                    <option value="month">1 месяц</option>
                    <option value="quarter">3 месяца</option>
                    <option value="halfyear">6 месяцев</option>
                    <option value="year">1 год</option>
                    <option value="invite">Приглашение</option>
                  </select>
                  <Button size="sm" className="h-7 text-xs" onClick={() => grant(u.id as number)}>Выдать</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setGrantUser(null)}>Отмена</Button>
                </div>
              ) : null}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setGrantUser(grantUser === u.id as number ? null : u.id as number)}
                title="Выдать подписку"
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Icon name="Gift" size={13} />
              </button>
              {(u.role as string) === "subscriber" && (
                <button
                  onClick={() => block(u.id as number, !isBlocked)}
                  disabled={blocking === u.id}
                  title={isBlocked ? "Разблокировать" : "Заблокировать"}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors
                    ${isBlocked ? "text-green hover:bg-green/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
                >
                  <Icon name={isBlocked ? "Unlock" : "Ban"} size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentsPanel({ token }: { token: string | null }) {
  const [filter, setFilter] = useState("pending");
  const { data, loading, refetch } = useAdminFetch("payments", token, `&status=${filter}`);
  const [acting, setActing] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const payments = (data as { payments?: Record<string, unknown>[] } | null)?.payments || [];

  const approve = async (id: number) => {
    setActing(id);
    await fetch(`${ADMIN_URL}?action=approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ request_id: id }),
    });
    setActing(null);
    refetch();
  };

  const reject = async () => {
    if (!rejectId) return;
    await fetch(`${ADMIN_URL}?action=reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ request_id: rejectId, comment: rejectComment }),
    });
    setRejectId(null);
    setRejectComment("");
    refetch();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[["pending", "На проверке"], ["approved", "Одобренные"], ["rejected", "Отклонённые"], ["all", "Все"]].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
              ${filter === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {payments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Заявок нет</p>}
        {payments.map((p: Record<string, unknown>) => (
          <div key={p.id as number} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-medium text-foreground">{p.nickname as string}</span>
                  <span className="text-xs text-muted-foreground">{p.plan_label as string}</span>
                  <span className="text-xs font-mono text-foreground">{(p.amount as number).toLocaleString("ru")} ₽</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    p.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                    p.status === "approved" ? "bg-green/10 text-green" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {p.status === "pending" ? "На проверке" : p.status === "approved" ? "Одобрено" : "Отклонено"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.created_at as string).toLocaleString("ru")}
                </div>
                {p.comment && <div className="text-xs text-muted-foreground mt-1 italic">{p.comment as string}</div>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {p.receipt_url && (
                  <a
                    href={p.receipt_url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Посмотреть чек"
                  >
                    <Icon name="FileImage" size={13} />
                  </a>
                )}
                {p.status === "pending" && (
                  <>
                    <button
                      onClick={() => approve(p.id as number)}
                      disabled={acting === p.id}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-green hover:bg-green/10 transition-colors"
                      title="Одобрить"
                    >
                      <Icon name="CheckCircle" size={13} />
                    </button>
                    <button
                      onClick={() => setRejectId(p.id as number)}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Отклонить"
                    >
                      <Icon name="XCircle" size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Причина отклонения</h3>
            <Input
              placeholder="Необязательно..."
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="flex-1" onClick={reject}>Отклонить</Button>
              <Button variant="outline" size="sm" onClick={() => setRejectId(null)}>Отмена</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvitesPanel({ token }: { token: string | null }) {
  const { data, loading, refetch } = useAdminFetch("invites", token);
  const [days, setDays] = useState("7");
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");

  const invites = (data as { invites?: Record<string, unknown>[] } | null)?.invites || [];

  const [createError, setCreateError] = useState("");

  const createInvite = async () => {
    setCreating(true);
    setCreateError("");
    setNewCode("");
    try {
      const resp = await fetch(`${ADMIN_URL}?action=create_invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({ days: parseInt(days) }),
      });
      const d = await resp.json();
      if (!resp.ok || d.error) {
        setCreateError(d.error || "Ошибка при создании");
      } else {
        setNewCode(d.code);
        refetch();
      }
    } catch {
      setCreateError("Нет связи с сервером");
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/register?invite=${code}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Создать invite-ссылку</p>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={e => setDays(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground flex-1"
          >
            <option value="3">3 дня</option>
            <option value="7">7 дней</option>
            <option value="14">14 дней</option>
            <option value="30">30 дней</option>
          </select>
          <Button size="sm" onClick={createInvite} disabled={creating} className="flex-shrink-0">
            {creating ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
            <span className="ml-1.5">Создать</span>
          </Button>
        </div>
        {createError && (
          <div className="mt-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {createError}
          </div>
        )}
        {newCode && (
          <div className="mt-3 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-2.5">
            <code className="text-xs text-primary flex-1 truncate">{`${window.location.origin}/register?invite=${newCode}`}</code>
            <button
              onClick={() => copyInviteLink(newCode)}
              className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              title="Скопировать"
            >
              <Icon name="Copy" size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {invites.map((inv: Record<string, unknown>) => (
          <div key={inv.id as number} className={`bg-card border rounded-xl p-3 flex items-center gap-3
            ${inv.is_used ? "border-border opacity-60" : "border-border"}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <code className="text-xs text-foreground font-mono truncate">{inv.code as string}</code>
                {inv.is_used
                  ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Использован</span>
                  : <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/10 text-green">Активен</span>
                }
              </div>
              <div className="text-[10px] text-muted-foreground">
                {inv.used_by ? `Использован: ${inv.used_by}` : `Истекает: ${new Date(inv.expires_at as string).toLocaleDateString("ru")}`}
                {" · "}Создан: {inv.created_by as string}
              </div>
            </div>
            {!inv.is_used && (
              <button
                onClick={() => copyInviteLink(inv.code as string)}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                title="Скопировать ссылку"
              >
                <Icon name="Copy" size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");

  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="ShieldOff" size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Доступ запрещён</p>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "stats",    label: "Сводка",       icon: "BarChart2" },
    { id: "users",    label: "Участники",    icon: "Users" },
    { id: "payments", label: "Оплаты",       icon: "CreditCard" },
    { id: "invites",  label: "Инвайты",      icon: "Link" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 h-11">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Назад"
          >
            <Icon name="ArrowLeft" size={16} />
          </button>
          <Icon name="Shield" size={15} className="text-primary" />
          <span className="font-display text-sm tracking-wider text-foreground uppercase">Админ-панель</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono ml-auto">{user.role}</span>
        </div>
        <div className="flex px-4 gap-1 pb-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors
                ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name={t.icon} size={12} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {tab === "stats"    && <StatsPanel token={token} />}
        {tab === "users"    && <UsersPanel token={token} />}
        {tab === "payments" && <PaymentsPanel token={token} />}
        {tab === "invites"  && <InvitesPanel token={token} />}
      </main>
    </div>
  );
}