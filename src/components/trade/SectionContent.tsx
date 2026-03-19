import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MESSAGES, POSTS, CURRENT_USER } from "./data";
import { RoleBadge, UserAvatar } from "./Shared";

// ─── ChatSection ───────────────────────────────────────────────────────────────

export function ChatSection({ sectionId, title, readonly = false }: { sectionId: string; title: string; readonly?: boolean }) {
  const [msg, setMsg] = useState("");
  const msgs = MESSAGES[sectionId] || [];
  const canWrite = !readonly || CURRENT_USER.role === "owner" || CURRENT_USER.role === "admin";

  return (
    <div className="animate-fade-in flex flex-col" style={{ minHeight: 500 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="pulse-dot" />
          <span>онлайн</span>
        </div>
      </div>

      {readonly && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded bg-secondary/50 border border-border text-xs text-muted-foreground">
          <Icon name="Lock" size={12} />
          <span>Только автор может публиковать в этом разделе</span>
        </div>
      )}

      <div className="card-trade mb-3 overflow-y-auto flex-1" style={{ maxHeight: 440 }}>
        <div className="space-y-4">
          {msgs.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <UserAvatar name={m.user} role={m.role} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-medium ${m.role === "owner" ? "text-primary" : m.role === "admin" ? "text-blue-400" : "text-foreground"}`}>
                    {m.user}
                  </span>
                  <RoleBadge role={m.role} />
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {canWrite && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
            <Icon name="Send" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PostFeed ─────────────────────────────────────────────────────────────────

export function PostFeed({ sectionId, title, showVideo = false }: { sectionId: string; title: string; showVideo?: boolean }) {
  const posts = POSTS[sectionId] || [];
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="Lock" size={12} />
          <span>Только автор</span>
        </div>
      </div>
      <div className="grid gap-4">
        {posts.map((p, i) => (
          <div key={i} className="card-trade">
            <div className="flex items-center gap-2 mb-2">
              <UserAvatar name={p.author} role="owner" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary">{p.author}</span>
                  <RoleBadge role="owner" />
                </div>
                <span className="text-xs text-muted-foreground">{p.time}</span>
              </div>
              {p.tag && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{p.tag}</span>
              )}
            </div>
            {p.title && <h3 className="font-display text-base font-medium text-foreground mb-2">{p.title}</h3>}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{p.text}</p>
            {showVideo && p.videoUrl && (
              <button className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="Play" size={14} className="text-primary ml-0.5" />
                </div>
                <span>Смотреть видео</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SubscribeSection ─────────────────────────────────────────────────────────

export function SubscribeSection() {
  const [payMethod, setPayMethod] = useState<"auto" | "manual">("auto");
  const [plan, setPlan] = useState<"month" | "quarter" | "year" | "invite">("month");

  const plans = [
    { id: "month",   label: "1 месяц",        price: "$97",       sub: "" },
    { id: "quarter", label: "3 месяца",        price: "$249",      sub: "−14%" },
    { id: "year",    label: "12 месяцев",      price: "$797",      sub: "−31%" },
    { id: "invite",  label: "По приглашению",  price: "Бесплатно", sub: "Бонус от автора" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Подписка и доступ</h2>
        <p className="text-xs text-muted-foreground mt-1">Выберите тариф и способ оплаты</p>
      </div>

      {/* Тарифы */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {plans.map(p => (
          <button
            key={p.id}
            onClick={() => setPlan(p.id as typeof plan)}
            className={`card-trade text-left transition-all ${plan === p.id ? "border-primary/60 bg-primary/5" : ""}`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-medium text-foreground">{p.label}</span>
              {p.sub && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${p.id === "invite" ? "bg-blue-500/15 text-blue-400" : "bg-green/10 text-green"}`}>
                  {p.sub}
                </span>
              )}
            </div>
            <span className={`font-mono font-medium ${p.id === "invite" ? "text-blue-400 text-sm" : "text-primary text-lg"}`}>
              {p.price}
            </span>
            {plan === p.id && <div className="mt-2 w-full h-0.5 rounded bg-primary/40" />}
          </button>
        ))}
      </div>

      {/* Способ оплаты */}
      {plan !== "invite" && (
        <>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Способ оплаты</div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { id: "auto",   icon: "CreditCard", label: "Банковская карта", sub: "Автопродление" },
              { id: "manual", icon: "Receipt",     label: "Перевод / чек",    sub: "Подтверждение вручную" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPayMethod(m.id as "auto" | "manual")}
                className={`card-trade text-left flex items-start gap-3 transition-all ${payMethod === m.id ? "border-primary/60 bg-primary/5" : ""}`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${payMethod === m.id ? "bg-primary/10" : "bg-secondary"}`}>
                  <Icon
                    name={m.icon as "CreditCard" | "Receipt"}
                    size={15}
                    className={payMethod === m.id ? "text-primary" : "text-muted-foreground"}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {payMethod === "auto" && (
            <div className="card-trade mb-4">
              <div className="text-xs text-muted-foreground mb-3">Данные карты</div>
              <div className="grid gap-2">
                <input
                  placeholder="Номер карты"
                  className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="ММ / ГГ"
                    className="bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                  <input
                    placeholder="CVV"
                    className="bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {payMethod === "manual" && (
            <div className="card-trade mb-4">
              <div className="text-xs font-medium text-foreground mb-3">Реквизиты для перевода</div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Банк</span>
                  <span className="text-foreground font-mono">Сбербанк</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Карта</span>
                  <span className="text-foreground font-mono">4276 •••• •••• 7891</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Получатель</span>
                  <span className="text-foreground">И. О. Фамилия</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">Прикрепите скриншот / чек об оплате:</div>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded p-4 cursor-pointer hover:border-primary/40 transition-colors">
                <Icon name="Upload" size={18} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Нажмите или перетащите файл</span>
                <input type="file" className="hidden" accept="image/*" />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                После загрузки чека администратор откроет доступ в течение нескольких часов.
              </p>
            </div>
          )}

          <button className="w-full py-3 bg-primary text-primary-foreground rounded text-sm font-display font-medium uppercase tracking-wide hover:bg-primary/90 transition-colors">
            {payMethod === "auto" ? "Оплатить и получить доступ" : "Отправить на проверку"}
          </button>
        </>
      )}

      {plan === "invite" && (
        <div className="card-trade">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="Gift" size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Доступ по приглашению</div>
              <div className="text-xs text-muted-foreground">
                Автор или администратор может выдать вам бесплатный доступ как бонус за активность или лояльность.
              </div>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-2">Введите код приглашения:</div>
            <input
              placeholder="INVITE-XXXXXX"
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button className="w-full py-2.5 bg-blue-500/20 text-blue-400 rounded text-sm font-display font-medium uppercase tracking-wide hover:bg-blue-500/30 transition-colors border border-blue-500/30">
            Активировать приглашение
          </button>
        </div>
      )}

      {/* Что входит */}
      <div className="card-trade mt-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Что входит в подписку</div>
        {[
          "Раздел «Интрадей и мысли» — сигналы автора в реальном времени",
          "Все тематические чаты (металлы, нефть, продукты)",
          "Видео-обзоры рынка каждую неделю",
          "Полная база знаний по трейдингу",
          "Уведомления о важных сигналах",
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
            <Icon name="Check" size={13} className="text-green flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
