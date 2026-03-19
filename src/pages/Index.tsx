import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NAV_ITEMS = [
  { id: "ideas", label: "Идеи", icon: "Lightbulb" },
  { id: "chat", label: "Общий чат", icon: "MessageSquare" },
  { id: "metals", label: "Металлы", icon: "Gem" },
  { id: "oil", label: "Газ / Нефть", icon: "Flame" },
  { id: "products", label: "Продукты", icon: "BarChart2" },
  { id: "reviews", label: "Обзоры", icon: "FileText" },
  { id: "knowledge", label: "База знаний", icon: "BookOpen" },
  { id: "techchat", label: "Технический чат", icon: "Terminal" },
  { id: "access", label: "Доступ", icon: "Shield" },
  { id: "lobby", label: "Прихожая", icon: "DoorOpen" },
];

const TICKER_DATA = [
  { sym: "XAU/USD", price: "2 347.80", change: "+0.42%" },
  { sym: "XAG/USD", price: "27.84", change: "-0.18%" },
  { sym: "BRENT", price: "83.15", change: "+1.12%" },
  { sym: "WTI", price: "78.92", change: "+0.87%" },
  { sym: "NG", price: "2.431", change: "-0.55%" },
  { sym: "BTC/USD", price: "67 420", change: "+2.31%" },
  { sym: "EUR/USD", price: "1.0842", change: "-0.09%" },
  { sym: "S&P 500", price: "5 248.80", change: "+0.33%" },
];

const IDEAS = [
  { author: "Сергей К.", time: "14 мин назад", asset: "XAU/USD", dir: "LONG", entry: "2 330", tp: "2 380", sl: "2 310", desc: "Пробой сопротивления на H4. Объёмы подтверждают движение.", likes: 24, tag: "Металлы" },
  { author: "Андрей М.", time: "1 ч назад", asset: "BRENT", dir: "SHORT", entry: "84.20", tp: "81.50", sl: "85.80", desc: "Дивергенция RSI на D1. Ожидаю коррекцию к 200MA.", likes: 18, tag: "Нефть" },
  { author: "Елена В.", time: "3 ч назад", asset: "S&P 500", dir: "LONG", entry: "5 210", tp: "5 300", sl: "5 160", desc: "Сезон отчётностей. Позитивный сентимент на рынке.", likes: 31, tag: "Индексы" },
  { author: "Максим Д.", time: "5 ч назад", asset: "EUR/USD", dir: "SHORT", entry: "1.0870", tp: "1.0780", sl: "1.0920", desc: "Данные по инфляции ЕС разочаровали. ФРС ужесточает риторику.", likes: 12, tag: "Форекс" },
];

const CHAT_MSGS = [
  { user: "Сергей К.", time: "14:32", text: "XAU пробивает 2350 — ждём продолжения до 2380", role: "expert" },
  { user: "Андрей М.", time: "14:29", text: "По нефти пока флэт. Жду данных по запасам в среду.", role: "member" },
  { user: "Иван Р.", time: "14:25", text: "Кто смотрит AAPL? Там интересная формация на часовике", role: "member" },
  { user: "Елена В.", time: "14:18", text: "Добавила обзор по металлам на этой неделе, смотрите раздел Обзоры 👆", role: "expert" },
  { user: "Дмитрий Л.", time: "14:10", text: "Коллеги, NG сегодня -0.5% — технически всё ещё в нисходящем канале", role: "member" },
];

const RATINGS = [
  { pos: 1, name: "Сергей К.", win: "82%", ideas: 47, profit: "+340%", badge: "🥇" },
  { pos: 2, name: "Елена В.", win: "76%", ideas: 38, profit: "+218%", badge: "🥈" },
  { pos: 3, name: "Андрей М.", win: "71%", ideas: 52, profit: "+187%", badge: "🥉" },
  { pos: 4, name: "Максим Д.", win: "68%", ideas: 29, profit: "+143%", badge: "" },
  { pos: 5, name: "Иван Р.", win: "64%", ideas: 21, profit: "+98%", badge: "" },
];

const KNOWLEDGE_ITEMS = [
  { title: "Технический анализ: паттерны продолжения", cat: "ТА", reads: 1240, level: "Средний" },
  { title: "Торговля металлами: фундаментальные факторы", cat: "Фундаментал", reads: 890, level: "Базовый" },
  { title: "Управление капиталом: Kelly Criterion", cat: "Риск-менедж", reads: 2100, level: "Продвинутый" },
  { title: "Нефтяной рынок: ключевые индикаторы", cat: "Сырьё", reads: 760, level: "Средний" },
  { title: "Психология трейдинга: контроль эмоций", cat: "Психология", reads: 3200, level: "Базовый" },
];

function TickerBar() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev - 1) % (TICKER_DATA.length * 160));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const items = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];

  return (
    <div className="h-9 flex items-center overflow-hidden bg-card border-b border-border">
      <div
        className="flex items-center gap-8 whitespace-nowrap pl-4"
        style={{ transform: `translateX(${offset}px)`, transition: 'none' }}
      >
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-xs text-muted-foreground">{t.sym}</span>
            <span className="font-mono text-xs font-medium text-foreground">{t.price}</span>
            <span className={`font-mono text-xs ${t.change.startsWith('+') ? 'text-green' : 'text-red'}`}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniChart({ color = "#F5B942", values }: { color?: string; values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IdeasSection() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Торговые идеи</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="pulse-dot"></div>
          <span>Обновлено только что</span>
        </div>
      </div>
      <div className="grid gap-3">
        {IDEAS.map((idea, i) => (
          <div key={i} className="card-trade cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-medium text-primary">
                  {idea.author.split(' ').map((w: string) => w[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{idea.author}</div>
                  <div className="text-xs text-muted-foreground">{idea.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{idea.tag}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${idea.dir === 'LONG' ? 'badge-up' : 'badge-down'}`}>
                  {idea.dir}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 mb-3 text-xs font-mono flex-wrap">
              <div><span className="text-muted-foreground">Актив </span><span className="text-primary font-medium">{idea.asset}</span></div>
              <div><span className="text-muted-foreground">Вход </span><span className="text-foreground">{idea.entry}</span></div>
              <div><span className="text-muted-foreground">ТП </span><span className="text-green">{idea.tp}</span></div>
              <div><span className="text-muted-foreground">СЛ </span><span className="text-red">{idea.sl}</span></div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{idea.desc}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Icon name="ThumbsUp" size={13} /><span>{idea.likes}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Icon name="MessageSquare" size={13} /><span>Комментарий</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Icon name="Bookmark" size={13} /><span>Сохранить</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatSection({ title }: { title: string }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="animate-fade-in flex flex-col" style={{ minHeight: '500px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="pulse-dot"></div>
          <span>47 участников онлайн</span>
        </div>
      </div>
      <div className="card-trade mb-3 overflow-y-auto flex-1" style={{ maxHeight: '420px' }}>
        <div className="space-y-4">
          {CHAT_MSGS.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display flex-shrink-0 ${m.role === 'expert' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {m.user.split(' ').map((w: string) => w[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${m.role === 'expert' ? 'text-primary' : 'text-foreground'}`}>{m.user}</span>
                  {m.role === 'expert' && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Эксперт</span>}
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
          <Icon name="Send" size={15} />
        </button>
      </div>
    </div>
  );
}

function MarketSection({ title, items }: { title: string; items: { name: string; price: string; change: string; vol: string; chart: number[] }[] }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">{title}</h2>
        <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          <Icon name="RefreshCw" size={12} /><span>Обновить</span>
        </button>
      </div>
      <div className="grid gap-3">
        {items.map((item, i) => (
          <div key={i} className="card-trade flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="font-mono text-xs text-muted-foreground">{item.name.slice(0, 2)}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">Объём: {item.vol}</div>
              </div>
            </div>
            <MiniChart values={item.chart} color={item.change.startsWith('+') ? '#22c55e' : '#ef4444'} />
            <div className="text-right flex-shrink-0">
              <div className="font-mono text-sm font-medium text-foreground">{item.price}</div>
              <div className={`text-xs font-mono ${item.change.startsWith('+') ? 'text-green' : 'text-red'}`}>{item.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsSection() {
  const reviews = [
    { author: "Елена В.", date: "18 марта 2026", title: "Недельный обзор рынка металлов", preview: "Золото продолжает консолидацию у уровня $2340. Серебро под давлением — мировой спрос промышленного сектора снижается...", readTime: "8 мин", views: 342 },
    { author: "Сергей К.", date: "17 марта 2026", title: "Нефтяной рынок: итоги недели", preview: "Brent держится выше $83 на фоне ограничений добычи ОПЕК+. Технически — зона сопротивления...", readTime: "6 мин", views: 218 },
    { author: "Максим Д.", date: "15 марта 2026", title: "Форекс: EUR/USD накануне заседания ФРС", preview: "Пара консолидируется у уровня 1.0850. Основное движение ожидаем после публикации решения по ставке...", readTime: "5 мин", views: 187 },
  ];
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Обзоры рынка</h2>
        <span className="text-xs text-muted-foreground">Еженедельные материалы</span>
      </div>
      <div className="grid gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="card-trade cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-display text-primary-foreground">
                {r.author.split(' ').map((w: string) => w[0]).join('')}
              </div>
              <span className="text-xs text-muted-foreground">{r.author}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </div>
            <h3 className="font-display text-base font-medium text-foreground mb-2">{r.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{r.preview}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Icon name="Clock" size={11} />{r.readTime} чтения</span>
              <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{r.views} просмотров</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnowledgeSection() {
  const [search, setSearch] = useState("");
  const filtered = KNOWLEDGE_ITEMS.filter(k =>
    k.title.toLowerCase().includes(search.toLowerCase()) ||
    k.cat.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">База знаний</h2>
      </div>
      <div className="mb-4 relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по базе знаний..."
          className="w-full bg-secondary border border-border rounded pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>
      <div className="grid gap-3">
        {filtered.map((k, i) => (
          <div key={i} className="card-trade flex items-center justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center mt-0.5 flex-shrink-0">
                <Icon name="BookOpen" size={14} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">{k.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-secondary">{k.cat}</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary">{k.level}</span>
                  <span>{k.reads.toLocaleString()} прочтений</span>
                </div>
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingsSection() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Рейтинг трейдеров</h2>
        <p className="text-xs text-muted-foreground mt-1">Топ по результатам за последние 90 дней</p>
      </div>
      <div className="card-trade mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-xl font-display text-primary">
            ВП
          </div>
          <div>
            <div className="font-display text-lg text-foreground">Вы</div>
            <div className="text-xs text-muted-foreground">Участник с февраля 2026</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground mb-1">Позиция в рейтинге</div>
            <div className="font-display text-2xl text-primary">#12</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="font-mono text-lg font-medium text-foreground">14</div>
            <div className="text-xs text-muted-foreground">Идей</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-lg font-medium text-green">64%</div>
            <div className="text-xs text-muted-foreground">Точность</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-lg font-medium text-primary">+87%</div>
            <div className="text-xs text-muted-foreground">Результат</div>
          </div>
        </div>
      </div>
      <div className="card-trade">
        <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
          <div>#</div>
          <div className="col-span-2">Трейдер</div>
          <div className="text-right">Точность</div>
          <div className="text-right">Результат</div>
        </div>
        {RATINGS.map((r) => (
          <div key={r.pos} className="grid grid-cols-5 gap-2 text-sm py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors rounded px-1 cursor-pointer">
            <div className="font-mono text-muted-foreground">{r.badge || r.pos}</div>
            <div className="col-span-2 font-medium text-foreground">{r.name}</div>
            <div className="text-right font-mono text-green">{r.win}</div>
            <div className="text-right font-mono text-primary">{r.profit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessSection() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Управление доступом</h2>
        <p className="text-xs text-muted-foreground mt-1">Условия участия в закрытом сообществе</p>
      </div>
      <div className="grid gap-4">
        <div className="card-trade border-primary/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="Crown" size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-display text-base text-foreground mb-1">Подписка VIP</div>
              <div className="text-sm text-muted-foreground mb-3">Полный доступ ко всем разделам, сигналам и обзорам</div>
              <div className="font-mono text-xl text-primary mb-3">$97 / мес</div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                Оформить доступ
              </button>
            </div>
          </div>
        </div>
        <div className="card-trade">
          <div className="font-display text-sm text-foreground mb-3 uppercase tracking-wide">Что входит в подписку:</div>
          {["Все торговые идеи и сигналы в реальном времени", "Еженедельные аналитические обзоры", "Полная база знаний по трейдингу", "Доступ к закрытым чатам с экспертами", "Push-уведомления о важных сигналах", "Личная статистика и история сделок"].map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
              <Icon name="Check" size={14} className="text-green flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LobbySection() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">Прихожая</h2>
        <p className="text-xs text-muted-foreground mt-1">Добро пожаловать в закрытый клуб трейдеров</p>
      </div>
      <div className="card-trade mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="Shield" size={20} className="text-primary" />
          </div>
          <div>
            <div className="font-display text-base text-foreground">TradeClub Private</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <div className="pulse-dot"></div>
              <span>213 участников · 47 онлайн</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Закрытое сообщество профессиональных трейдеров. Торговые идеи, аналитика и сигналы в реальном времени.
          Биржевой трейдинг — нефть, газ, металлы, форекс.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "Bell", label: "Push-уведомления", desc: "Настроить сигналы" },
          { icon: "User", label: "Мой профиль", desc: "Статистика и история" },
          { icon: "Settings", label: "Настройки", desc: "Аккаунт и безопасность" },
          { icon: "HelpCircle", label: "Поддержка", desc: "Написать администратору" },
        ].map((item, i) => (
          <div key={i} className="card-trade cursor-pointer flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon as "Bell" | "User" | "Settings" | "HelpCircle"} size={16} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const METALS = [
  { name: "Золото XAU/USD", price: "2 347.80", change: "+0.42%", vol: "142K", chart: [2290, 2310, 2295, 2330, 2320, 2340, 2348] },
  { name: "Серебро XAG/USD", price: "27.84", change: "-0.18%", vol: "87K", chart: [28.2, 28.0, 27.9, 28.1, 27.85, 27.9, 27.84] },
  { name: "Платина XPT/USD", price: "952.40", change: "+0.65%", vol: "23K", chart: [930, 938, 942, 945, 948, 950, 952] },
  { name: "Палладий XPD/USD", price: "1 024.50", change: "-1.12%", vol: "15K", chart: [1060, 1048, 1040, 1035, 1030, 1028, 1024] },
];

const OIL = [
  { name: "Brent Crude", price: "83.15", change: "+1.12%", vol: "1.2M", chart: [80, 81, 80.5, 82, 82.5, 83, 83.15] },
  { name: "WTI Crude", price: "78.92", change: "+0.87%", vol: "980K", chart: [76, 77, 76.5, 78, 78.5, 79, 78.92] },
  { name: "Natural Gas", price: "2.431", change: "-0.55%", vol: "340K", chart: [2.55, 2.52, 2.50, 2.48, 2.46, 2.44, 2.43] },
  { name: "Heating Oil", price: "2.682", change: "+0.32%", vol: "95K", chart: [2.64, 2.65, 2.66, 2.67, 2.67, 2.68, 2.682] },
];

const PRODUCTS = [
  { name: "Пшеница CBOT", price: "545.25", change: "-0.88%", vol: "210K", chart: [562, 558, 555, 552, 549, 547, 545] },
  { name: "Кукуруза CBOT", price: "428.50", change: "+0.43%", vol: "310K", chart: [422, 424, 425, 426, 427, 428, 428.5] },
  { name: "Соя CBOT", price: "1 182.00", change: "+1.05%", vol: "180K", chart: [1155, 1160, 1165, 1170, 1175, 1180, 1182] },
  { name: "Сахар ICE", price: "18.42", change: "-0.22%", vol: "120K", chart: [18.6, 18.55, 18.5, 18.48, 18.45, 18.44, 18.42] },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState("ideas");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "ideas": return <IdeasSection />;
      case "chat": return <ChatSection title="Общий чат" />;
      case "metals": return <MarketSection title="Металлы" items={METALS} />;
      case "oil": return <MarketSection title="Газ / Нефть" items={OIL} />;
      case "products": return <MarketSection title="Сельхозпродукты" items={PRODUCTS} />;
      case "reviews": return <ReviewsSection />;
      case "knowledge": return <KnowledgeSection />;
      case "techchat": return <ChatSection title="Технический чат" />;
      case "access": return <AccessSection />;
      case "lobby": return <LobbySection />;
      default: return <IdeasSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Icon name="Menu" size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Icon name="TrendingUp" size={13} className="text-primary-foreground" />
              </div>
              <span className="font-display text-sm font-medium tracking-widest text-foreground uppercase">TradeClub</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">PRO</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Bell" size={16} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] flex items-center justify-center text-white font-mono">3</span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Search" size={16} />
            </button>
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-display text-primary cursor-pointer">
              ВП
            </div>
          </div>
        </div>
        <TickerBar />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`
          w-52 flex-shrink-0 border-r border-border bg-card
          ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 pt-12 shadow-2xl' : 'hidden'}
          md:relative md:block md:pt-0 md:shadow-none md:z-auto
        `}>
          <div className="p-3 space-y-0.5 pt-4">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                className={`nav-item w-full text-left ${activeSection === item.id ? 'active' : ''}`}
              >
                <Icon name={item.icon as "Lightbulb" | "MessageSquare" | "Gem" | "Flame" | "BarChart2" | "FileText" | "BookOpen" | "Terminal" | "Shield" | "DoorOpen"} size={15} />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="p-3 mt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Рейтинг недели</div>
            {RATINGS.slice(0, 3).map(r => (
              <div key={r.pos} className="flex items-center justify-between py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span>{r.badge || r.pos}</span>
                  <span className="text-foreground truncate max-w-[80px]">{r.name.split(' ')[0]}</span>
                </div>
                <span className="font-mono text-primary">{r.profit}</span>
              </div>
            ))}
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {renderSection()}
          </div>
        </main>

        <aside className="hidden xl:block w-64 border-l border-border bg-card flex-shrink-0 p-4 space-y-5 overflow-y-auto">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Ключевые активы</div>
            {TICKER_DATA.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="font-mono text-xs text-muted-foreground">{t.sym}</span>
                <div className="text-right">
                  <div className="font-mono text-xs text-foreground">{t.price}</div>
                  <div className={`font-mono text-xs ${t.change.startsWith('+') ? 'text-green' : 'text-red'}`}>{t.change}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Лучшие идеи недели</div>
            {IDEAS.slice(0, 2).map((idea, i) => (
              <div key={i} className="py-2 border-b border-border/40 last:border-0 cursor-pointer hover:bg-secondary/20 rounded px-1 transition-colors">
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-xs font-mono ${idea.dir === 'LONG' ? 'text-green' : 'text-red'}`}>{idea.dir}</span>
                  <span className="text-xs text-foreground font-medium">{idea.asset}</span>
                </div>
                <div className="text-xs text-muted-foreground">{idea.author} · {idea.likes} ❤</div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Уведомления</div>
            <div className="space-y-2">
              {[
                { text: "XAU/USD +2.1% за сессию", time: "5 мин" },
                { text: "Новый обзор: Brent Crude", time: "1 ч" },
                { text: "Сигнал: EUR/USD SHORT", time: "2 ч" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="text-foreground">{n.text}</div>
                    <div className="text-muted-foreground">{n.time} назад</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button
              onClick={() => setActiveSection("access")}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded text-xs font-display font-medium tracking-wide uppercase hover:bg-primary/90 transition-colors"
            >
              Оформить доступ VIP
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
