import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

// Текущая роль пользователя (в реальном приложении берётся из auth)
// "owner" | "admin" | "subscriber" | "guest"
const CURRENT_USER = {
  name: "Вы",
  initials: "ВП",
  role: "subscriber" as "owner" | "admin" | "subscriber" | "guest",
};

// Структура разделов — type: "chat" (все пишут) | "readonly" (только автор) | "feed" (лента идей)
const NAV_ITEMS = [
  { id: "intraday",   label: "Интрадей и мысли", icon: "Lightbulb",    type: "readonly", desc: "Текущие торговые идеи автора" },
  { id: "chat",       label: "Общий чат",         icon: "MessageSquare",type: "chat",     desc: "Общение всех подписчиков" },
  { id: "metals",     label: "Металлы",            icon: "Gem",          type: "chat",     desc: "Идеи и обсуждение металлов" },
  { id: "oil",        label: "Газ / Нефть",        icon: "Flame",        type: "chat",     desc: "Идеи по нефти и газу" },
  { id: "products",   label: "Продукты",           icon: "Wheat",        type: "chat",     desc: "Сельхозтовары и сырьё" },
  { id: "video",      label: "Видео-обзоры",       icon: "Video",        type: "readonly", desc: "Обзоры рынка от автора" },
  { id: "tech",       label: "Техвопросы",         icon: "Wrench",       type: "chat",     desc: "Технические вопросы" },
  { id: "access_info",label: "Доступ",             icon: "KeyRound",     type: "readonly", desc: "Инструкции по доступу и VPN" },
  { id: "knowledge",  label: "База знаний",        icon: "BookOpen",     type: "readonly", desc: "Обучающие материалы" },
  { id: "subscribe",  label: "Подписка",           icon: "CreditCard",   type: "payment",  desc: "Тарифы и оплата" },
];

const TICKER_DATA = [
  { sym: "XAU/USD", price: "2 347.80", change: "+0.42%" },
  { sym: "XAG/USD", price: "27.84",    change: "-0.18%" },
  { sym: "BRENT",   price: "83.15",    change: "+1.12%" },
  { sym: "WTI",     price: "78.92",    change: "+0.87%" },
  { sym: "NG",      price: "2.431",    change: "-0.55%" },
  { sym: "BTC/USD", price: "67 420",   change: "+2.31%" },
  { sym: "EUR/USD", price: "1.0842",   change: "-0.09%" },
  { sym: "S&P 500", price: "5 248.80", change: "+0.33%" },
];

// Сообщения для чатов (по разделу)
const MESSAGES: Record<string, { user: string; role: string; time: string; text: string }[]> = {
  chat: [
    { user: "Автор",     role: "owner",      time: "14:45", text: "Друзья, завтра важный день — решение ФРС по ставке. Держим руку на пульсе." },
    { user: "Сергей К.", role: "subscriber", time: "14:32", text: "XAU пробивает 2350 — ждём продолжения до 2380" },
    { user: "Андрей М.", role: "subscriber", time: "14:29", text: "По нефти пока флэт. Жду данных по запасам в среду." },
    { user: "Иван Р.",   role: "subscriber", time: "14:25", text: "Кто смотрит AAPL? Там интересная формация на часовике" },
    { user: "Елена В.",  role: "admin",      time: "14:18", text: "Добавила обзор по металлам — смотрите раздел Видео-обзоры 👆" },
    { user: "Дмитрий Л.",role: "subscriber", time: "14:10", text: "NG сегодня -0.5% — технически всё ещё в нисходящем канале" },
  ],
  metals: [
    { user: "Автор",     role: "owner",      time: "13:50", text: "Золото: держу лонг от 2320. Цель — 2380, стоп под 2300." },
    { user: "Сергей К.", role: "subscriber", time: "13:55", text: "Согласен. Серебро тоже подтягивается, смотрю 28.50 как ближайшую цель." },
    { user: "Марина Т.", role: "subscriber", time: "14:02", text: "Платина отстаёт — есть идеи?" },
    { user: "Елена В.",  role: "admin",      time: "14:08", text: "По платине пока осторожно, нет чёткого сигнала на вход." },
  ],
  oil: [
    { user: "Автор",     role: "owner",      time: "12:30", text: "Brent выше 83 — ОПЕК+ держит дисциплину. Ближайшая цель 85." },
    { user: "Андрей М.", role: "subscriber", time: "12:45", text: "WTI чуть отстаёт, спред расширяется. Слежу за инвентарями EIA." },
    { user: "Пётр С.",   role: "subscriber", time: "13:10", text: "NG продолжает падать — хранилища переполнены в Европе." },
  ],
  products: [
    { user: "Автор",     role: "owner",      time: "11:00", text: "Пшеница под давлением из-за хороших прогнозов урожая в Австралии." },
    { user: "Кирилл Б.", role: "subscriber", time: "11:30", text: "Соя интересна от 1155 — есть поддержка на недельном графике." },
  ],
  tech: [
    { user: "Елена В.",  role: "admin",      time: "10:00", text: "По вопросам доступа пишите сюда. Если проблема с VPN — смотрите раздел «Доступ»." },
    { user: "Николай Д.",role: "subscriber", time: "10:15", text: "Не могу войти с нового телефона, пишет ошибку авторизации." },
    { user: "Елена В.",  role: "admin",      time: "10:20", text: "Напишите мне в личку — разберёмся." },
    { user: "Олег М.",   role: "subscriber", time: "11:05", text: "Подскажите, как настроить уведомления?" },
  ],
};

// Read-only посты (для Интрадей, Видео-обзоры, База знаний, Доступ)
const POSTS: Record<string, { author: string; time: string; title?: string; text: string; tag?: string; videoUrl?: string }[]> = {
  intraday: [
    { author: "Автор", time: "15:10", title: "XAU/USD — LONG", text: "Вход от 2330, цель 2380, стоп 2305. Пробой ключевого уровня на H4 с подтверждением объёма. Risk/Reward = 1:2.1", tag: "Металлы" },
    { author: "Автор", time: "12:40", title: "BRENT — осторожно", text: "Приближаемся к зоне сопротивления 84–85. Пока вне позиции, жду реакцию рынка перед открытием американской сессии.", tag: "Нефть" },
    { author: "Автор", time: "09:15", title: "EUR/USD — SHORT", text: "Данные по CPI вышли хуже ожиданий. Вход 1.0870, цель 1.0780, стоп 1.0920.", tag: "Форекс" },
  ],
  video: [
    { author: "Автор", time: "18 марта", title: "Недельный обзор: металлы и нефть", text: "Разбираю текущую ситуацию на рынке золота, серебра и нефти. Ключевые уровни на следующую неделю.", videoUrl: "#" },
    { author: "Автор", time: "11 марта", title: "ФРС, доллар и сырьё", text: "Как решение ФРС повлияет на сырьевые рынки? Разбираю корреляции и торговые возможности.", videoUrl: "#" },
    { author: "Автор", time: "4 марта",  title: "Технический анализ: паттерны этой недели", text: "Три актива с чёткими паттернами — разбираем точки входа и выхода.", videoUrl: "#" },
  ],
  access_info: [
    { author: "Админ", time: "20 марта", title: "Как войти если Telegram недоступен", text: "Используйте это веб-приложение как основной канал доступа. Все материалы синхронизированы.\n\nЕсли нужен VPN — рекомендуем Outline или Lantern. Инструкция по настройке ниже в закреплённых сообщениях." },
    { author: "Админ", time: "15 марта", title: "Рекомендуемые VPN-сервисы", text: "1. Outline — бесплатный, надёжный\n2. Lantern — простой в настройке\n3. Amnezia VPN — для продвинутых\n\nПри проблемах — пишите в раздел «Техвопросы»." },
    { author: "Админ", time: "1 марта",  title: "Правила сообщества", text: "Запрещено: скриншоты, репосты, передача материалов третьим лицам. Нарушение → блокировка без возврата средств." },
  ],
  knowledge: [
    { author: "Автор", time: "10 марта", title: "Управление капиталом: Kelly Criterion", text: "Подробный разбор формулы Келли и её применения в биржевой торговле. Как определить оптимальный размер позиции." },
    { author: "Автор", time: "1 марта",  title: "Психология трейдинга: как не слить депозит", text: "Разбираем когнитивные ошибки трейдеров: overfitting, revenge trading, FOMO. Практические техники контроля." },
    { author: "Автор", time: "20 фев",   title: "Технический анализ для сырьевых рынков", text: "Специфика ТА на нефти, газе и металлах. Сезонные паттерны, объёмы, COT-отчёты." },
    { author: "Автор", time: "10 фев",   title: "Фундаментальный анализ нефтяного рынка", text: "Ключевые индикаторы: запасы EIA, буровые Baker Hughes, решения ОПЕК+. Как читать и торговать по данным." },
  ],
};

// ─────────────────────────────────────────
// Компоненты
// ─────────────────────────────────────────

function TickerBar() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset(p => (p - 1) % (TICKER_DATA.length * 160)), 30);
    return () => clearInterval(id);
  }, []);
  const items = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];
  return (
    <div className="h-8 flex items-center overflow-hidden bg-card border-b border-border">
      <div className="flex items-center gap-8 whitespace-nowrap pl-4" style={{ transform: `translateX(${offset}px)`, transition: "none" }}>
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-xs text-muted-foreground">{t.sym}</span>
            <span className="font-mono text-xs font-medium text-foreground">{t.price}</span>
            <span className={`font-mono text-xs ${t.change.startsWith("+") ? "text-green" : "text-red"}`}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Автор</span>;
  if (role === "admin")  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">Админ</span>;
  return null;
}

function UserAvatar({ name, role, size = "sm" }: { name: string; role: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const sz = size === "md" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";
  const bg = role === "owner" ? "bg-primary text-primary-foreground" : role === "admin" ? "bg-blue-500/20 text-blue-400" : "bg-secondary text-muted-foreground";
  return <div className={`${sz} ${bg} rounded-full flex items-center justify-center font-display flex-shrink-0`}>{initials}</div>;
}

// Чат с правом писать для всех (или только для автора/админа если readonly)
function ChatSection({ sectionId, title, readonly = false }: { sectionId: string; title: string; readonly?: boolean }) {
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
                  <span className={`text-xs font-medium ${m.role === "owner" ? "text-primary" : m.role === "admin" ? "text-blue-400" : "text-foreground"}`}>{m.user}</span>
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

// Лента read-only постов (Интрадей, Видео-обзоры, База знаний, Доступ)
function PostFeed({ sectionId, title, showVideo = false }: { sectionId: string; title: string; showVideo?: boolean }) {
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
              {p.tag && <span className="ml-auto text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{p.tag}</span>}
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

// Раздел подписки и оплаты
function SubscribeSection() {
  const [payMethod, setPayMethod] = useState<"auto" | "manual">("auto");
  const [plan, setPlan] = useState<"month" | "quarter" | "year" | "invite">("month");

  const plans = [
    { id: "month",   label: "1 месяц",    price: "$97",  sub: "" },
    { id: "quarter", label: "3 месяца",   price: "$249", sub: "−14%" },
    { id: "year",    label: "12 месяцев", price: "$797", sub: "−31%" },
    { id: "invite",  label: "По приглашению", price: "Бесплатно", sub: "Бонус от автора" },
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
              {p.sub && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${p.id === "invite" ? "bg-blue-500/15 text-blue-400" : "bg-green/10 text-green"}`}>{p.sub}</span>}
            </div>
            <span className={`font-mono font-medium ${p.id === "invite" ? "text-blue-400 text-sm" : "text-primary text-lg"}`}>{p.price}</span>
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
                  <Icon name={m.icon as "CreditCard" | "Receipt"} size={15} className={payMethod === m.id ? "text-primary" : "text-muted-foreground"} />
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
                <input placeholder="Номер карты" className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="ММ / ГГ" className="bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono" />
                  <input placeholder="CVV" className="bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono" />
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
              <p className="text-xs text-muted-foreground mt-2">После загрузки чека администратор откроет доступ в течение нескольких часов.</p>
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
              <div className="text-xs text-muted-foreground">Автор или администратор может выдать вам бесплатный доступ как бонус за активность или лояльность.</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-2">Введите код приглашения:</div>
            <input placeholder="INVITE-XXXXXX" className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors" />
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

// ─────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────

export default function Index() {
  const [active, setActive] = useState("intraday");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = NAV_ITEMS.find(n => n.id === active)!;

  const renderSection = () => {
    switch (active) {
      case "intraday":    return <PostFeed sectionId="intraday" title="Интрадей и мысли" />;
      case "chat":        return <ChatSection sectionId="chat" title="Общий чат" />;
      case "metals":      return <ChatSection sectionId="metals" title="Металлы" />;
      case "oil":         return <ChatSection sectionId="oil" title="Газ / Нефть" />;
      case "products":    return <ChatSection sectionId="products" title="Продукты" />;
      case "video":       return <PostFeed sectionId="video" title="Видео-обзоры" showVideo />;
      case "tech":        return <ChatSection sectionId="tech" title="Технические вопросы" />;
      case "access_info": return <PostFeed sectionId="access_info" title="Доступ и VPN" />;
      case "knowledge":   return <PostFeed sectionId="knowledge" title="База знаний" />;
      case "subscribe":   return <SubscribeSection />;
      default:            return <PostFeed sectionId="intraday" title="Интрадей и мысли" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Icon name="Menu" size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <Icon name="TrendingUp" size={11} className="text-primary-foreground" />
              </div>
              <span className="font-display text-sm tracking-widest text-foreground uppercase">TradeClub</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">VIP</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Bell" size={15} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-[8px] flex items-center justify-center text-white">3</span>
            </button>
            <div className="flex items-center gap-1.5 cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-display text-primary">
                {CURRENT_USER.initials}
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground">{CURRENT_USER.role === "subscriber" ? "Подписчик" : CURRENT_USER.role}</span>
            </div>
          </div>
        </div>
        <TickerBar />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-52 flex-shrink-0 border-r border-border bg-card ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 pt-11 shadow-2xl" : "hidden"} md:relative md:block md:pt-0 md:shadow-none md:z-auto`}>
          <div className="p-2 pt-3 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const isPayment = item.type === "payment";
              return (
                <button
                  key={item.id}
                  onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                  className={`nav-item w-full text-left ${active === item.id ? "active" : ""} ${isPayment ? "mt-3 border border-primary/20" : ""}`}
                >
                  <Icon name={item.icon as string} size={14} />
                  <span className="text-xs flex-1">{item.label}</span>
                  {item.type === "readonly" && <Icon name="Lock" size={10} className="text-muted-foreground/50 flex-shrink-0" />}
                  {item.type === "chat" && <div className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Мини-профиль */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-display text-primary">
                {CURRENT_USER.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{CURRENT_USER.name}</div>
                <div className="text-[10px] text-muted-foreground">Подписчик · активна</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Settings" size={13} />
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 overflow-y-auto pb-10">
          {/* Breadcrumb */}
          <div className="sticky top-0 z-10 px-4 py-2 bg-background/90 backdrop-blur-sm border-b border-border/50 flex items-center gap-2">
            <Icon name={current.icon as string} size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{current.label}</span>
            <span className="text-xs text-muted-foreground/40 ml-auto">{current.desc}</span>
          </div>
          <div className="max-w-2xl mx-auto px-4 py-5">
            {renderSection()}
          </div>
        </main>

        {/* Right panel */}
        <aside className="hidden xl:flex xl:flex-col w-60 border-l border-border bg-card flex-shrink-0 p-4 gap-5 overflow-y-auto">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">Цены</div>
            {TICKER_DATA.slice(0, 6).map((t, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="font-mono text-xs text-muted-foreground">{t.sym}</span>
                <div className="text-right">
                  <div className="font-mono text-xs text-foreground">{t.price}</div>
                  <div className={`font-mono text-[10px] ${t.change.startsWith("+") ? "text-green" : "text-red"}`}>{t.change}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">Активность</div>
            <div className="space-y-2">
              {[
                { section: "Общий чат",  msg: "XAU пробивает 2350", time: "2 мин" },
                { section: "Металлы",    msg: "Серебро: цель 28.50", time: "8 мин" },
                { section: "Интрадей",   msg: "Новый сигнал автора", time: "15 мин" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-secondary/30 rounded p-1 transition-colors">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-muted-foreground">{n.section}</div>
                    <div className="text-foreground">{n.msg}</div>
                    <div className="text-[10px] text-muted-foreground">{n.time} назад</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => setActive("subscribe")}
              className="w-full py-2 bg-primary text-primary-foreground rounded text-xs font-display uppercase tracking-wide hover:bg-primary/90 transition-colors"
            >
              Продлить подписку
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}