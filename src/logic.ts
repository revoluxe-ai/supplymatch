import {
  categories,
  standardSpecs,
  type Category,
  type City,
  type Request,
  type Supplier,
} from "./data.ts";

export const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) +
  " ₽";
export const number = (value: number) =>
  new Intl.NumberFormat("ru-RU").format(value);
export function dayLabel(n: number) {
  const a = n % 100,
    b = n % 10;
  return `${n} ${a >= 11 && a <= 14 ? "дней" : b === 1 ? "день" : b >= 2 && b <= 4 ? "дня" : "дней"}`;
}
const distances: Record<City, Record<City, number>> = {
  Екатеринбург: { Екатеринбург: 0, Казань: 985, Москва: 1780 },
  Казань: { Екатеринбург: 985, Казань: 0, Москва: 820 },
  Москва: { Екатеринбург: 1780, Казань: 820, Москва: 0 },
};
export function evaluate(s: Supplier, req: Request) {
  const distance = distances[s.city][req.city];
  const shipping = s.localShipping + Math.round((distance * 2) / 100) * 100;
  const quantity = Math.max(req.quantity, s.min);
  const goods = quantity * s.price,
    total = goods + shipping,
    days = s.delivery[req.city];
  const paymentOk =
    req.payment === "any" ||
    s.payments.includes(req.payment) ||
    (req.payment === "defer14" && s.payments.includes("defer30"));
  const issues: string[] = [];
  const normalizeSpec = (text: string) =>
    text.toLowerCase().replace(/\s+/g, " ").trim();
  if (
    req.specification &&
    normalizeSpec(req.specification) !==
      normalizeSpec(standardSpecs[req.category])
  )
    issues.push(
      "Запрошенные характеристики отличаются от стандартного товара в демокаталоге",
    );
  if (s.min > req.quantity)
    issues.push(
      `Минимальная партия ${number(s.min)} ${req.unit} — больше вашего запроса`,
    );
  if (days > req.days)
    issues.push(
      `Доставка за ${dayLabel(days)} — нужен срок ${dayLabel(req.days)}`,
    );
  if (!paymentOk)
    issues.push(
      req.payment.startsWith("defer")
        ? "Нет нужной отсрочки оплаты"
        : "Нет выбранного способа оплаты",
    );
  if (req.budget !== null && total > req.budget)
    issues.push(`Выше бюджета на ${money(total - req.budget)}`);
  return {
    supplier: s,
    distance,
    shipping,
    quantity,
    goods,
    total,
    days,
    paymentOk,
    issues,
    suitable: issues.length === 0,
  };
}
export type Offer = ReturnType<typeof evaluate>;
export function rankOffers(list: Supplier[], req: Request) {
  const offers = list
    .filter((s) => s.category === req.category)
    .map((s) => evaluate(s, req));
  const eligible = offers.some((o) => o.suitable)
    ? offers.filter((o) => o.suitable)
    : offers;
  const minTotal = Math.min(...eligible.map((o) => o.total)),
    minDays = Math.min(...offers.map((o) => o.days));
  const score = (o: Offer) =>
    req.priority === "price"
      ? o.total / minTotal
      : req.priority === "speed"
        ? o.days / minDays
        : (o.total / minTotal) * 0.85 + (o.days / Math.max(req.days, 1)) * 0.15;
  return offers.sort(
    (a, b) =>
      Number(b.suitable) - Number(a.suitable) ||
      a.issues.length - b.issues.length ||
      score(a) - score(b) ||
      a.total - b.total,
  );
}
export function explain(o: Offer, req: Request) {
  if (!o.suitable) return o.issues.join(". ") + ".";
  const payment = req.payment.startsWith("defer")
    ? ` Поддерживает отсрочку ${req.payment === "defer30" ? "30" : "14"} дней.`
    : "";
  return `Партия ${number(req.quantity)} ${req.unit} доступна, доставка за ${dayLabel(o.days)} укладывается в ваш срок.${payment} Полная стоимость — ${money(o.total)}.`;
}
function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + Number(a[i - 1] !== b[j - 1]),
      );
      prev = old;
    }
  }
  return row[b.length];
}
export function detectCategory(text: string): Category | null {
  const t = text.toLowerCase().replaceAll("ё", "е");
  if (/моцар|сыр|молоч/.test(t)) return "dairy";
  if (/мук[ауыи]|пшенич|ингредиент/.test(t)) return "flour";
  if (/короб|упаков|контейнер/.test(t)) return "packaging";
  if (
    t
      .split(/\s+/)
      .some((w) => w.length >= 6 && editDistance(w, "моцарелла") <= 3)
  )
    return "dairy";
  return null;
}
export function parseQuery(query: string): Partial<Request> {
  const text = query.toLowerCase();
  const category = detectCategory(text);
  const patch: Partial<Request> = {};
  if (category) {
    patch.category = category;
    patch.unit = categories[category].unit;
  }
  const quantity = text.match(/(\d[\d\s]*?)\s*(кг|килограмм|шт|штук|коробок)/);
  if (quantity) patch.quantity = Number(quantity[1].replaceAll(" ", ""));
  if (/екатеринбург/.test(text)) patch.city = "Екатеринбург";
  if (/казан/.test(text)) patch.city = "Казань";
  if (/москв/.test(text)) patch.city = "Москва";
  const days = text.match(/(?:за|через|в течение)\s+(\d+)\s*(?:дн|день|сут)/);
  if (days) patch.days = Number(days[1]);
  if (/отсрочк[а-яё]*\s+(?:оплаты\s+)?(?:на\s+)?30/.test(text))
    patch.payment = "defer30";
  else if (/отсрочк[а-яё]*\s+(?:оплаты\s+)?(?:на\s+)?14/.test(text))
    patch.payment = "defer14";
  const budget = text.match(/бюджет\s*(?:до\s*)?(\d[\d\s]*)\s*(?:₽|руб)/);
  if (budget) patch.budget = Number(budget[1].replace(/\s/g, ""));
  const percentage = text.match(/(\d+)\s*%/);
  if (percentage && category && category !== "packaging")
    patch.specification = standardSpecs[category].replace(
      /\d+%/,
      percentage[1] + "%",
    );
  return patch;
}

export function comparisonDelta(offer: Offer, baseline: Offer): string {
  const delta = offer.total - baseline.total;
  const days = offer.days - baseline.days;
  const cost =
    delta === 0
      ? "Та же полная стоимость"
      : delta > 0
        ? `Дороже на ${money(delta)}`
        : `Экономия ${money(-delta)}`;
  const timing =
    days === 0
      ? "срок доставки такой же"
      : days < 0
        ? `доставка быстрее на ${dayLabel(-days)}`
        : `доставка дольше на ${dayLabel(days)}`;
  if (offer.supplier.id === baseline.supplier.id)
    return `Минимальная полная стоимость — ${money(offer.total)}. Получение за ${dayLabel(offer.days)}.`;
  return `${cost}, ${delta > 0 && days < 0 ? "но " : ""}${timing}.`;
}
