import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export default function NoAccess() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <Icon name="Lock" size={28} className="text-primary" />
        </div>

        <h1 className="font-display text-xl tracking-widest text-foreground uppercase mb-2">
          RTrading CLUB
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          Привет, <span className="text-foreground font-medium">{user?.nickname}</span>!
        </p>
        <p className="text-sm text-muted-foreground mb-7">
          Этот раздел доступен только участникам с активной подпиской.
        </p>

        <div className="bg-card border border-border rounded-xl p-4 mb-6 text-left space-y-2.5">
          {[
            "Ежедневные торговые идеи от автора",
            "Чаты по металлам, нефти, газу, продовольствию",
            "Видео-обзоры рынков",
            "База знаний по трейдингу",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
              <Icon name="Check" size={14} className="text-green flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Button className="w-full h-11 mb-3" onClick={() => navigate("/subscribe")}>
          <Icon name="Crown" size={15} className="mr-2" />
          Оформить подписку
        </Button>

        <button
          onClick={logout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
