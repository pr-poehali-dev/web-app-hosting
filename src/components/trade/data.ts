export const CURRENT_USER = {
  name: "Вы",
  initials: "ВП",
  role: "subscriber" as "owner" | "admin" | "subscriber" | "guest",
};

export const NAV_ITEMS = [
  { id: "intraday",    label: "Интрадей и мысли", icon: "Lightbulb",    type: "readonly", desc: "Текущие торговые идеи автора" },
  { id: "chat",        label: "Общий чат",         icon: "MessageSquare",type: "chat",     desc: "Общение всех подписчиков" },
  { id: "metals",      label: "Металлы",            icon: "Gem",          type: "chat",     desc: "Идеи и обсуждение металлов" },
  { id: "oil",         label: "Газ / Нефть",        icon: "Flame",        type: "chat",     desc: "Идеи по нефти и газу" },
  { id: "products",    label: "Продукты",           icon: "Wheat",        type: "chat",     desc: "Сельхозтовары и сырьё" },
  { id: "video",       label: "Видео-обзоры",       icon: "Video",        type: "readonly", desc: "Обзоры рынка от автора" },
  { id: "tech",        label: "Техвопросы",         icon: "Wrench",       type: "chat",     desc: "Технические вопросы" },
  { id: "access_info", label: "Доступ",             icon: "KeyRound",     type: "readonly", desc: "Инструкции по доступу и VPN" },
  { id: "knowledge",   label: "База знаний",        icon: "BookOpen",     type: "readonly", desc: "Обучающие материалы" },
  { id: "subscribe",   label: "Подписка",           icon: "CreditCard",   type: "payment",  desc: "Тарифы и оплата" },
];

export const TICKER_DATA = [
  { sym: "XAU/USD", price: "2 347.80", change: "+0.42%" },
  { sym: "XAG/USD", price: "27.84",    change: "-0.18%" },
  { sym: "BRENT",   price: "83.15",    change: "+1.12%" },
  { sym: "WTI",     price: "78.92",    change: "+0.87%" },
  { sym: "NG",      price: "2.431",    change: "-0.55%" },
  { sym: "BTC/USD", price: "67 420",   change: "+2.31%" },
  { sym: "EUR/USD", price: "1.0842",   change: "-0.09%" },
  { sym: "S&P 500", price: "5 248.80", change: "+0.33%" },
];

export const MESSAGES: Record<string, { user: string; role: string; time: string; text: string }[]> = {
  chat: [
    { user: "Автор",      role: "owner",      time: "14:45", text: "Друзья, завтра важный день — решение ФРС по ставке. Держим руку на пульсе." },
    { user: "Сергей К.",  role: "subscriber", time: "14:32", text: "XAU пробивает 2350 — ждём продолжения до 2380" },
    { user: "Андрей М.",  role: "subscriber", time: "14:29", text: "По нефти пока флэт. Жду данных по запасам в среду." },
    { user: "Иван Р.",    role: "subscriber", time: "14:25", text: "Кто смотрит AAPL? Там интересная формация на часовике" },
    { user: "Елена В.",   role: "admin",      time: "14:18", text: "Добавила обзор по металлам — смотрите раздел Видео-обзоры 👆" },
    { user: "Дмитрий Л.", role: "subscriber", time: "14:10", text: "NG сегодня -0.5% — технически всё ещё в нисходящем канале" },
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
    { user: "Елена В.",   role: "admin",      time: "10:00", text: "По вопросам доступа пишите сюда. Если проблема с VPN — смотрите раздел «Доступ»." },
    { user: "Николай Д.", role: "subscriber", time: "10:15", text: "Не могу войти с нового телефона, пишет ошибку авторизации." },
    { user: "Елена В.",   role: "admin",      time: "10:20", text: "Напишите мне в личку — разберёмся." },
    { user: "Олег М.",    role: "subscriber", time: "11:05", text: "Подскажите, как настроить уведомления?" },
  ],
};

export const POSTS: Record<string, { author: string; time: string; title?: string; text: string; tag?: string; videoUrl?: string }[]> = {
  intraday: [
    { author: "Автор", time: "15:10", title: "XAU/USD — LONG",       text: "Вход от 2330, цель 2380, стоп 2305. Пробой ключевого уровня на H4 с подтверждением объёма. Risk/Reward = 1:2.1", tag: "Металлы" },
    { author: "Автор", time: "12:40", title: "BRENT — осторожно",    text: "Приближаемся к зоне сопротивления 84–85. Пока вне позиции, жду реакцию рынка перед открытием американской сессии.", tag: "Нефть" },
    { author: "Автор", time: "09:15", title: "EUR/USD — SHORT",       text: "Данные по CPI вышли хуже ожиданий. Вход 1.0870, цель 1.0780, стоп 1.0920.", tag: "Форекс" },
  ],
  video: [
    { author: "Автор", time: "18 марта", title: "Недельный обзор: металлы и нефть",         text: "Разбираю текущую ситуацию на рынке золота, серебра и нефти. Ключевые уровни на следующую неделю.", videoUrl: "#" },
    { author: "Автор", time: "11 марта", title: "ФРС, доллар и сырьё",                       text: "Как решение ФРС повлияет на сырьевые рынки? Разбираю корреляции и торговые возможности.", videoUrl: "#" },
    { author: "Автор", time: "4 марта",  title: "Технический анализ: паттерны этой недели", text: "Три актива с чёткими паттернами — разбираем точки входа и выхода.", videoUrl: "#" },
  ],
  access_info: [
    { author: "Админ", time: "20 марта", title: "Как войти если Telegram недоступен", text: "Используйте это веб-приложение как основной канал доступа. Все материалы синхронизированы.\n\nЕсли нужен VPN — рекомендуем Outline или Lantern. Инструкция по настройке ниже в закреплённых сообщениях." },
    { author: "Админ", time: "15 марта", title: "Рекомендуемые VPN-сервисы",          text: "1. Outline — бесплатный, надёжный\n2. Lantern — простой в настройке\n3. Amnezia VPN — для продвинутых\n\nПри проблемах — пишите в раздел «Техвопросы»." },
    { author: "Админ", time: "1 марта",  title: "Правила сообщества",                 text: "Запрещено: скриншоты, репосты, передача материалов третьим лицам. Нарушение → блокировка без возврата средств." },
  ],
  knowledge: [
    { author: "Автор", time: "10 марта", title: "Управление капиталом: Kelly Criterion",      text: "Подробный разбор формулы Келли и её применения в биржевой торговле. Как определить оптимальный размер позиции." },
    { author: "Автор", time: "1 марта",  title: "Психология трейдинга: как не слить депозит", text: "Разбираем когнитивные ошибки трейдеров: overfitting, revenge trading, FOMO. Практические техники контроля." },
    { author: "Автор", time: "20 фев",   title: "Технический анализ для сырьевых рынков",     text: "Специфика ТА на нефти, газе и металлах. Сезонные паттерны, объёмы, COT-отчёты." },
    { author: "Автор", time: "10 фев",   title: "Фундаментальный анализ нефтяного рынка",     text: "Ключевые индикаторы: запасы EIA, буровые Baker Hughes, решения ОПЕК+. Как читать и торговать по данным." },
  ],
};
