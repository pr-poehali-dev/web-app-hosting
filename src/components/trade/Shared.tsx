import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { TICKER_DATA } from "./data";

export function TickerBar() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset(p => (p - 1) % (TICKER_DATA.length * 160)), 30);
    return () => clearInterval(id);
  }, []);
  const items = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];
  return (
    <div className="h-8 flex items-center overflow-hidden bg-card border-b border-border">
      <div
        className="flex items-center gap-8 whitespace-nowrap pl-4"
        style={{ transform: `translateX(${offset}px)`, transition: "none" }}
      >
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-xs text-muted-foreground">{t.sym}</span>
            <span className="font-mono text-xs font-medium text-foreground">{t.price}</span>
            <span className={`font-mono text-xs ${t.change.startsWith("+") ? "text-green" : "text-red"}`}>
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Автор</span>;
  if (role === "admin")  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">Админ</span>;
  return null;
}

export function UserAvatar({ name, role, size = "sm" }: { name: string; role: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const sz = size === "md" ? "w-10 h-10 text-sm" : "w-7 h-7 text-xs";
  const bg =
    role === "owner" ? "bg-primary text-primary-foreground" :
    role === "admin" ? "bg-blue-500/20 text-blue-400" :
    "bg-secondary text-muted-foreground";
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center font-display flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function RightPanel({ onSubscribe }: { onSubscribe: () => void }) {
  const { TICKER_DATA: tickers, MESSAGES } = { TICKER_DATA, MESSAGES: {} };
  const recentActivity = [
    { section: "Общий чат",  msg: "XAU пробивает 2350",   time: "2 мин" },
    { section: "Металлы",    msg: "Серебро: цель 28.50",   time: "8 мин" },
    { section: "Интрадей",   msg: "Новый сигнал автора",   time: "15 мин" },
  ];

  return (
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
          {recentActivity.map((n, i) => (
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
          onClick={onSubscribe}
          className="w-full py-2 bg-primary text-primary-foreground rounded text-xs font-display uppercase tracking-wide hover:bg-primary/90 transition-colors"
        >
          Продлить подписку
        </button>
      </div>
    </aside>
  );
}
