import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import func2url from "../../backend/func2url.json";
import { PLANS, FEATURES, PAYMENT_DETAILS } from "@/config/subscription";

const SUBS_URL = func2url.subscriptions;

export default function Paywall({ onPaid }: { onPaid?: () => void }) {
  const { token } = useAuth();
  const [step, setStep] = useState<"plans" | "pay" | "sent">("plans");
  const [selectedPlan, setSelectedPlan] = useState("quarter");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceipt(file);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!receipt) { setError("Загрузи чек об оплате"); return; }
    setError("");
    setLoading(true);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((res, rej) => {
        reader.onload = () => {
          const result = reader.result as string;
          res(result.split(",")[1]);
        };
        reader.onerror = rej;
        reader.readAsDataURL(receipt);
      });

      const resp = await fetch(`${SUBS_URL}?action=request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
        body: JSON.stringify({
          plan: selectedPlan,
          receipt_base64: b64,
          receipt_mime: receipt.type || "image/jpeg",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Ошибка отправки");
      setStep("sent");
      onPaid?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (step === "sent") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle" size={32} className="text-green" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Заявка отправлена</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {PAYMENT_DETAILS.instructions}
          </p>
          <div className="bg-card border border-border rounded-xl p-4 text-left text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>Тариф</span>
              <span className="text-foreground">{plan.label}</span>
            </div>
            <div className="flex justify-between">
              <span>Сумма</span>
              <span className="text-foreground">{plan.price.toLocaleString("ru")} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>Статус</span>
              <span className="text-yellow-500">На проверке</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pay") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <button onClick={() => setStep("plans")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <Icon name="ArrowLeft" size={14} /> Назад к тарифам
          </button>

          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <h2 className="text-base font-semibold text-foreground mb-1">Оплата подписки</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Тариф: <span className="text-foreground">{plan.label} — {plan.price.toLocaleString("ru")} ₽</span>
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Переведи точную сумму:</p>
              <p className="text-2xl font-display tracking-wider text-foreground">{plan.price.toLocaleString("ru")} ₽</p>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Номер карты / телефон</span>
                  <span className="text-foreground font-medium font-mono">{PAYMENT_DETAILS.cardNumber}</span>
                </div>
                {PAYMENT_DETAILS.bank && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Банк</span>
                    <span className="text-foreground font-medium">{PAYMENT_DETAILS.bank}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Получатель</span>
                  <span className="text-foreground font-medium">{PAYMENT_DETAILS.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Комментарий</span>
                  <span className="text-foreground font-medium">{PAYMENT_DETAILS.comment}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3">После оплаты загрузи скриншот чека:</p>

            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-4
                ${receiptPreview ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"}`}
            >
              {receiptPreview ? (
                <img src={receiptPreview} alt="Чек" className="max-h-40 mx-auto rounded object-contain" />
              ) : (
                <>
                  <Icon name="Upload" size={20} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Нажми чтобы загрузить чек</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, PDF до 5 МБ</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />

            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <Icon name="AlertCircle" size={13} /> {error}
              </div>
            )}

            <Button onClick={handleSubmit} className="w-full" disabled={loading}>
              {loading ? <Icon name="Loader2" size={15} className="animate-spin mr-2" /> : null}
              Отправить заявку
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-4">
            <Icon name="TrendingUp" size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl tracking-widest text-foreground uppercase mb-2">RTrading CLUB</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Закрытый клуб профессиональных трейдеров. Ежедневные идеи, аналитика и живое общество.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Что входит в подписку</p>
          <ul className="space-y-2">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                <Icon name="Check" size={14} className="text-green flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative text-left p-3.5 rounded-xl border transition-all
                ${selectedPlan === p.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/30"}`}
            >
              {p.badge && (
                <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-green/20 text-green font-mono font-semibold">
                  {p.badge}
                </span>
              )}
              <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
              <div className="text-base font-semibold text-foreground">{p.price.toLocaleString("ru")} ₽</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.per}</div>
            </button>
          ))}
        </div>

        <Button onClick={() => setStep("pay")} className="w-full h-11 text-sm">
          Оплатить {plan.price.toLocaleString("ru")} ₽ — {plan.label}
          <Icon name="ArrowRight" size={15} className="ml-2" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground mt-3">
          Ручная оплата · Активация в течение нескольких часов
        </p>
      </div>
    </div>
  );
}
