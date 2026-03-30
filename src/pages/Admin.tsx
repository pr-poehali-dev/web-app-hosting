import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import func2url from "../../backend/func2url.json";

const ADMIN_URL = func2url.admin;

type Tab = "stats" | "users" | "payments" | "invites" | "chats";

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

type ReceiptRecord = { id: number; plan: string; plan_label: string; amount: number; status: string; receipt_url: string | null; payment_date: string | null; created_at: string };
type GdprRecord = { consented_at: string; policy_version: string; ip_address: string } | null;

function UserCard({ u, token, onRefetch }: { u: Record<string, unknown>; token: string | null; onRefetch: () => void }) {
  const uid = u.id as number;
  const role = u.role as string;
  const isBlocked = u.is_blocked as boolean;
  const sub = u.subscription as { plan?: string; expires_at?: string } | null;

  const [expanded, setExpanded] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantMode, setGrantMode] = useState<"preset" | "date" | "invite">("preset");
  const [grantPlan, setGrantPlan] = useState("month");
  const [grantDate, setGrantDate] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [gdpr, setGdpr] = useState<GdprRecord>(null);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [receiptPlan, setReceiptPlan] = useState("month");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadDetail = async () => {
    if (detailLoaded) return;
    const r = await fetch(`${ADMIN_URL}?action=user&user_id=${uid}`, { headers: { "X-Auth-Token": token || "" } });
    const d = await r.json();
    setReceipts((d.payment_requests || []).map((p: Record<string, unknown>) => ({
      id: p.id, plan: p.plan, plan_label: p.plan || "", amount: p.amount,
      status: p.status, receipt_url: p.receipt_url, payment_date: p.payment_date, created_at: p.created_at,
    })));
    setGdpr(d.gdpr_consent_record || null);
    setDetailLoaded(true);
  };

  const handleExpand = () => {
    if (!expanded) loadDetail();
    setExpanded(!expanded);
  };

  const block = async () => {
    setBlocking(true);
    await fetch(`${ADMIN_URL}?action=block`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ user_id: uid, blocked: !isBlocked }),
    });
    setBlocking(false);
    onRefetch();
  };

  const grant = async () => {
    const body: Record<string, unknown> = { user_id: uid };
    if (grantMode === "invite") { body.plan = "month"; body.is_invite = true; }
    else if (grantMode === "date" && grantDate) { body.plan = "custom"; body.expires_at = new Date(grantDate).toISOString(); }
    else { body.plan = grantPlan; }
    await fetch(`${ADMIN_URL}?action=grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify(body),
    });
    setGrantOpen(false);
    onRefetch();
  };

  const deleteUser = async () => {
    await fetch(`${ADMIN_URL}?action=delete_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ user_id: uid }),
    });
    onRefetch();
  };

  const uploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      await fetch(`${ADMIN_URL}?action=upload_receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({
          user_id: uid,
          plan: receiptPlan,
          amount: parseInt(receiptAmount) || 0,
          payment_date: receiptDate,
          file_data: base64,
          file_name: file.name,
        }),
      });
      setUploadLoading(false);
      setUploadOpen(false);
      setDetailLoaded(false);
      loadDetail();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmReceipt = async (receiptId: number, status: string) => {
    await fetch(`${ADMIN_URL}?action=confirm_receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
      body: JSON.stringify({ receipt_id: receiptId, status }),
    });
    setDetailLoaded(false);
    loadDetail();
  };

  const statusBadge = (s: string) => {
    if (s === "confirmed" || s === "approved") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">Подтверждено</span>;
    if (s === "rejected") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Отклонено</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600">Ожидает</span>;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-display text-primary flex-shrink-0">
          {(u.nickname as string).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{u.nickname as string}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{role}</span>
            {isBlocked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Заблокирован</span>}
            {sub ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                VIP до {new Date(sub.expires_at!).toLocaleDateString("ru")}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Нет подписки</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{u.email as string}</div>
        </div>
        <div className="flex gap-1 flex-shrink-0 items-center">
          <button onClick={() => { setGrantOpen(!grantOpen); setDelConfirm(false); if (!expanded) { setExpanded(true); loadDetail(); } }}
            title="Выдать подписку" className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
            <Icon name="Gift" size={13} />
          </button>
          {role !== "owner" && (
            <>
              <button onClick={block} disabled={blocking} title={isBlocked ? "Разблокировать" : "Заблокировать"}
                className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${isBlocked ? "text-green-600 hover:bg-green-500/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}>
                <Icon name={isBlocked ? "Unlock" : "Ban"} size={13} />
              </button>
              <button onClick={() => { setDelConfirm(!delConfirm); setGrantOpen(false); }} title="Удалить"
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Icon name="Trash2" size={13} />
              </button>
            </>
          )}
          <button onClick={handleExpand} title="Подробнее"
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={13} />
          </button>
        </div>
      </div>

      {grantOpen && (
        <div className="px-3 pb-3 border-t border-border pt-3 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Выдать VIP-доступ</p>
          <div className="flex gap-1.5">
            {(["preset", "date", "invite"] as const).map(m => (
              <button key={m} onClick={() => setGrantMode(m)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${grantMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                {m === "preset" ? "Тариф" : m === "date" ? "До даты" : "По приглашению"}
              </button>
            ))}
          </div>
          {grantMode === "preset" && (
            <select value={grantPlan} onChange={e => setGrantPlan(e.target.value)}
              className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground w-full">
              <option value="week">1 неделя (7 дней) — 1 700 ₽</option>
              <option value="month">1 месяц (30 дней) — 4 000 ₽</option>
              <option value="quarter">3 месяца (90 дней) — 10 300 ₽</option>
              <option value="halfyear">Полгода (180 дней) — 20 000 ₽</option>
              <option value="loyal">Постоянный (30 дней) — 3 400 ₽</option>
            </select>
          )}
          {grantMode === "date" && (
            <input type="date" value={grantDate} onChange={e => setGrantDate(e.target.value)}
              className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground w-full"
              min={new Date().toISOString().split("T")[0]} />
          )}
          {grantMode === "invite" && <p className="text-[10px] text-muted-foreground">Бесплатный доступ на 30 дней, план «invite»</p>}
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={grant}>Выдать</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setGrantOpen(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {delConfirm && (
        <div className="px-3 pb-3 border-t border-border pt-3 bg-destructive/5">
          <p className="text-xs text-destructive mb-2">Удалить пользователя безвозвратно?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" className="h-7 text-xs flex-1" onClick={deleteUser}>Удалить</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDelConfirm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-border px-3 py-3 space-y-4">
          {/* GDPR — 152-ФЗ */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Согласие 152-ФЗ</p>
            {gdpr ? (
              <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs space-y-0.5">
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Дата:</span><span>{new Date(gdpr.consented_at).toLocaleString("ru")}</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Версия:</span><span>{gdpr.policy_version}</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground w-24">IP:</span><span className="font-mono">{gdpr.ip_address}</span></div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Запись о согласии отсутствует (регистрация до обновления)</p>
            )}
          </div>

          {/* История оплат */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">История оплат</p>
              <button onClick={() => setUploadOpen(!uploadOpen)}
                className="text-[10px] flex items-center gap-1 text-primary hover:underline">
                <Icon name="Upload" size={11} />Загрузить чек
              </button>
            </div>

            {uploadOpen && (
              <div className="mb-3 bg-muted/40 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select value={receiptPlan} onChange={e => setReceiptPlan(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground col-span-2">
                    <option value="week">1 неделя — 1 700 ₽</option>
                    <option value="month">1 месяц — 4 000 ₽</option>
                    <option value="quarter">3 месяца — 10 300 ₽</option>
                    <option value="halfyear">Полгода — 20 000 ₽</option>
                    <option value="loyal">Постоянный — 3 400 ₽</option>
                  </select>
                  <input type="number" placeholder="Сумма ₽" value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground" />
                  <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground" />
                </div>
                <label className={`flex items-center gap-2 justify-center w-full h-8 border border-dashed border-border rounded cursor-pointer text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors ${uploadLoading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Icon name={uploadLoading ? "Loader2" : "ImagePlus"} size={13} className={uploadLoading ? "animate-spin" : ""} />
                  {uploadLoading ? "Загружаю..." : "Выбрать файл"}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={uploadReceipt} />
                </label>
              </div>
            )}

            {receipts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Нет записей об оплате</p>
            ) : (
              <div className="space-y-2">
                {receipts.map(r => (
                  <div key={r.id} className="bg-muted/30 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="font-medium">{r.plan_label || r.plan}</span>
                        {r.amount > 0 && <span className="ml-2 text-muted-foreground">{r.amount.toLocaleString("ru")} ₽</span>}
                        {r.payment_date && <span className="ml-2 text-muted-foreground">{new Date(r.payment_date).toLocaleDateString("ru")}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(r.status)}
                        {r.receipt_url && (
                          <a href={r.receipt_url} target="_blank" rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-0.5">
                            <Icon name="ExternalLink" size={11} />чек
                          </a>
                        )}
                        {r.status === "pending" && (
                          <button onClick={() => confirmReceipt(r.id, "confirmed")}
                            className="text-green-600 hover:underline flex items-center gap-0.5">
                            <Icon name="Check" size={11} />ок
                          </button>
                        )}
                        {r.status === "pending" && (
                          <button onClick={() => confirmReceipt(r.id, "rejected")}
                            className="text-destructive hover:underline flex items-center gap-0.5">
                            <Icon name="X" size={11} />нет
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersPanel({ token }: { token: string | null }) {
  const { data, loading, refetch } = useAdminFetch("users", token);
  const [search, setSearch] = useState("");

  const users = (data as { users?: Record<string, unknown>[] } | null)?.users || [];
  const filtered = search.trim()
    ? users.filter(u => (u.email as string).toLowerCase().includes(search.toLowerCase()) || (u.nickname as string).toLowerCase().includes(search.toLowerCase()))
    : users;

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-3">
        <Input placeholder="Поиск по email или нику..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />
      </div>
      <div className="space-y-2">
        {filtered.map((u: Record<string, unknown>) => (
          <UserCard key={u.id as number} u={u} token={token} onRefetch={refetch} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Пользователи не найдены</p>
        )}
      </div>
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

const ICONS = ["MessageSquare","Lightbulb","Gem","Flame","Wheat","Video","Wrench","KeyRound","BookOpen","Hash","Star","Bell"];

function ChatsPanel({ token }: { token: string | null }) {
  const { data, loading, error, refetch } = useAdminFetch("chat_settings", token);
  const [saving, setSaving] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<Record<string, string>>({});
  const [editDesc, setEditDesc] = useState<Record<string, string>>({});

  type Channel = { channel_id: string; label: string; description: string; icon: string; is_enabled: boolean; is_readonly: boolean; sort_order: number };
  const channels: Channel[] = (data?.channels as Channel[]) || [];

  useEffect(() => {
    if (channels.length) {
      const labels: Record<string, string> = {};
      const descs: Record<string, string> = {};
      channels.forEach(c => { labels[c.channel_id] = c.label; descs[c.channel_id] = c.description || ""; });
      setEditLabel(labels);
      setEditDesc(descs);
    }
  }, [data]);

  const update = async (channel_id: string, patch: Record<string, unknown>) => {
    if (!token) return;
    setSaving(channel_id);
    await fetch(`${ADMIN_URL}?action=update_chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ channel_id, ...patch }),
    });
    setSaving(null);
    refetch();
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Загрузка...</div>;
  if (error) return <div className="text-destructive text-sm py-4">{error}</div>;

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-4">
        Управляй разделами: включай/выключай, меняй режим доступа, название и описание.
      </div>
      {channels.map(ch => (
        <div key={ch.channel_id} className={`bg-card border rounded-xl p-4 transition-opacity ${!ch.is_enabled ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name={ch.icon} size={14} className="text-primary" fallback="MessageSquare" />
            </div>
            <div className="flex-1 min-w-0">
              <input
                className="bg-transparent text-sm font-medium text-foreground w-full focus:outline-none border-b border-transparent focus:border-border transition-colors"
                value={editLabel[ch.channel_id] ?? ch.label}
                onChange={e => setEditLabel(p => ({ ...p, [ch.channel_id]: e.target.value }))}
                onBlur={e => { if (e.target.value !== ch.label) update(ch.channel_id, { label: e.target.value }); }}
              />
              <input
                className="bg-transparent text-xs text-muted-foreground w-full focus:outline-none border-b border-transparent focus:border-border transition-colors mt-0.5"
                value={editDesc[ch.channel_id] ?? ch.description}
                onChange={e => setEditDesc(p => ({ ...p, [ch.channel_id]: e.target.value }))}
                onBlur={e => { if (e.target.value !== ch.description) update(ch.channel_id, { description: e.target.value }); }}
                placeholder="Описание..."
              />
            </div>
            {saving === ch.channel_id && <Icon name="Loader2" size={13} className="animate-spin text-muted-foreground flex-shrink-0" />}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Иконка */}
            <select
              value={ch.icon}
              onChange={e => update(ch.channel_id, { icon: e.target.value })}
              className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground focus:outline-none"
            >
              {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>

            {/* Включён/выключен */}
            <button
              onClick={() => update(ch.channel_id, { is_enabled: !ch.is_enabled })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                ch.is_enabled
                  ? "bg-green/10 text-green border-green/20 hover:bg-green/20"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
              }`}
            >
              <Icon name={ch.is_enabled ? "Eye" : "EyeOff"} size={11} />
              {ch.is_enabled ? "Включён" : "Выключен"}
            </button>

            {/* Режим */}
            <button
              onClick={() => update(ch.channel_id, { is_readonly: !ch.is_readonly })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                ch.is_readonly
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              }`}
            >
              <Icon name={ch.is_readonly ? "Lock" : "MessageSquare"} size={11} />
              {ch.is_readonly ? "Только чтение" : "Открытый чат"}
            </button>

            {/* Порядок */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-muted-foreground">#{ch.sort_order}</span>
              <button
                disabled={ch.sort_order <= 1}
                onClick={() => update(ch.channel_id, { sort_order: ch.sort_order - 1 })}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <Icon name="ChevronUp" size={12} />
              </button>
              <button
                onClick={() => update(ch.channel_id, { sort_order: ch.sort_order + 1 })}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="ChevronDown" size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}
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
    { id: "chats",    label: "Чаты",         icon: "Settings2" },
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
        {tab === "chats"    && <ChatsPanel token={token} />}
      </main>
    </div>
  );
}