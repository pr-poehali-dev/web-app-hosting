import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "@/components/trade/data";
import { TickerBar, RightPanel } from "@/components/trade/Shared";
import { ChatSection, PostFeed, SubscribeSection } from "@/components/trade/SectionContent";
import { useAuth } from "@/context/AuthContext";

function renderSection(active: string, setActive: (id: string) => void) {
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
}

export default function Index() {
  const { user, logout, subscription } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("intraday");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = NAV_ITEMS.find(n => n.id === active)!;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-11">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Icon name="Menu" size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <Icon name="TrendingUp" size={11} className="text-primary-foreground" />
              </div>
              <span className="font-display text-sm tracking-widest text-foreground uppercase">RTrading CLUB</span>
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
                {user?.nickname?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <span className="hidden sm:block text-xs text-muted-foreground">
                {user?.role === "subscriber" ? "Подписчик" : user?.role}
              </span>
            </div>
          </div>
        </div>
        <TickerBar />
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className={`
          w-52 flex-shrink-0 border-r border-border bg-card
          ${sidebarOpen ? "fixed inset-y-0 left-0 z-50 pt-11 shadow-2xl" : "hidden"}
          md:relative md:block md:pt-0 md:shadow-none md:z-auto
        `}>
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
                {user?.nickname?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{user?.nickname}</div>
                <div className="text-[10px] text-muted-foreground">{user?.role === "subscriber" ? "Подписчик" : user?.role}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate("/profile")}
                  title="Настройки профиля"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="Settings" size={13} />
                </button>
                {(user?.role === "owner" || user?.role === "admin") && (
                  <button
                    onClick={() => navigate("/admin")}
                    title="Панель администратора"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon name="Shield" size={13} />
                  </button>
                )}
                <button
                  onClick={logout}
                  title="Выйти"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Icon name="LogOut" size={13} />
                </button>
              </div>
            </div>
            {subscription && (
              <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                <Icon name="CheckCircle" size={10} className="text-green" />
                до {new Date(subscription.expires_at).toLocaleDateString("ru")}
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto pb-10">
          <div className="sticky top-0 z-10 px-4 py-2 bg-background/90 backdrop-blur-sm border-b border-border/50 flex items-center gap-2">
            <Icon name={current.icon as string} size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{current.label}</span>
            <span className="text-xs text-muted-foreground/40 ml-auto">{current.desc}</span>
          </div>
          <div className="max-w-2xl mx-auto px-4 py-5">
            {renderSection(active, setActive)}
          </div>
        </main>

        {/* ── Right panel ── */}
        <RightPanel onSubscribe={() => setActive("subscribe")} />

      </div>
    </div>
  );
}