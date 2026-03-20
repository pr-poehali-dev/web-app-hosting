import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function RestorePassword() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
          <Icon name="KeyRound" size={24} className="text-primary" />
        </div>
        <h1 className="font-display text-xl tracking-widest text-foreground uppercase mb-1">TradeClub</h1>
        <p className="text-sm text-muted-foreground mb-8">Восстановление пароля</p>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-left">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
            <Icon name="Info" size={16} className="text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Для восстановления пароля напиши администратору — он сбросит доступ вручную.
            </p>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Icon name="ArrowLeft" size={14} />
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
