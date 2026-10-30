import test from "node:test";
import assert from "node:assert/strict";
import { cities, initialRequest, suppliers, categories } from "../src/data.ts";
import {
  detectCategory,
  evaluate,
  parseQuery,
  rankOffers,
} from "../src/logic.ts";
import type { Category, Request } from "../src/data.ts";
const get = (id: string) => suppliers.find((s) => s.id === id)!;
const req: Request = { ...initialRequest, query: categories.dairy.query };
test("Основной сценарий: полная стоимость 200 кг и доставка", () => {
  const o = evaluate(get("ural"), req);
  assert.equal(o.goods, 92000);
  assert.equal(o.shipping, 1800);
  assert.equal(o.total, 93800);
  assert.equal(o.suitable, true);
});
test("Крупная минимальная партия: расчёт на 500 кг, несоответствие видно", () => {
  const o = evaluate(get("food"), req);
  assert.equal(o.quantity, 500);
  assert.equal(o.goods, 217500);
  assert.equal(o.shipping, 5800);
  assert.equal(o.total, 223300);
  assert.equal(o.suitable, false);
  assert.match(o.issues.join(" "), /Минимальная партия/);
});
test("Низкая стоимость не скрывает превышение срока", () => {
  const o = evaluate(get("volga"), req);
  assert.equal(o.total, 85600);
  assert.equal(o.days, 5);
  assert.equal(o.suitable, false);
  assert.match(o.issues.join(" "), /Доставка/);
});
test("Отсрочка и бюджет учитываются отдельно", () => {
  assert.equal(evaluate(get("fresh"), req).paymentOk, false);
  assert.equal(
    evaluate(get("fresh"), { ...req, payment: "any" }).suitable,
    true,
  );
  assert.equal(evaluate(get("ural"), { ...req, budget: 93800 }).suitable, true);
  assert.equal(
    evaluate(get("ural"), { ...req, budget: 93799 }).suitable,
    false,
  );
  assert.equal(
    evaluate(get("ural"), { ...req, payment: "defer14" }).suitable,
    true,
  );
});
test("Приоритет меняет рекомендацию, неподходящие не выходят на первое место", () => {
  assert.equal(rankOffers(suppliers, req)[0].supplier.id, "ural");
  assert.equal(
    rankOffers(suppliers, { ...req, priority: "price" })[0].supplier.id,
    "ural",
  );
  assert.equal(
    rankOffers(suppliers, { ...req, priority: "speed" })[0].supplier.id,
    "city",
  );
  assert.equal(rankOffers(suppliers, req).filter((o) => o.suitable).length, 3);
});
test("Категории, опечатки, неизвестный товар", () => {
  for (const text of ["моцарелла", "моцорелла", "мацарелла", "моцарела"])
    assert.equal(detectCategory(text), "dairy");
  assert.equal(detectCategory("пшеничная мука"), "flour");
  assert.equal(detectCategory("коробки для пиццы"), "packaging");
  assert.equal(detectCategory("нужен кофе в зернах"), null);
});
test("Текст извлекает параметры, отсрочка не становится сроком доставки", () => {
  assert.deepEqual(parseQuery(categories.dairy.query), {
    category: "dairy",
    unit: "кг",
    quantity: 200,
    city: "Екатеринбург",
    days: 3,
    payment: "defer30",
  });
  assert.equal(parseQuery("Моцарелла, отсрочка 30 дней").days, undefined);
  assert.equal(
    parseQuery("1 000 коробок для пиццы в Москву за 2 дня").quantity,
    1000,
  );
});
test("Все города и категории: арифметика и симметрия расстояний", () => {
  for (const city of cities)
    for (const category of Object.keys(categories) as Category[]) {
      const r = {
        ...req,
        city,
        category,
        payment: "any" as const,
        unit: categories[category].unit,
        quantity: categories[category].quantity,
      };
      const list = rankOffers(suppliers, r);
      assert.equal(list.length, category === "dairy" ? 6 : 2);
      for (const o of list) {
        assert.equal(o.total, o.quantity * o.supplier.price + o.shipping);
        assert.ok(o.quantity >= o.supplier.min);
        assert.ok(o.quantity >= r.quantity);
        assert.ok(o.shipping > 0);
        assert.ok(o.days > 0);
      }
    }
  assert.equal(
    evaluate(get("volga"), req).distance,
    evaluate(get("ural"), { ...req, city: "Казань" }).distance,
  );
});
test("Невозможный бюджет даёт честное отсутствие совпадений", () => {
  assert.equal(
    rankOffers(suppliers, { ...req, budget: 1 }).filter((o) => o.suitable)
      .length,
    0,
  );
});

test("Сравнение объясняет доплату 6 400 ₽ за выигрыш в один день", async () => {
  const { comparisonDelta } = await import("../src/logic.ts");
  const text = comparisonDelta(
    evaluate(get("city"), req),
    evaluate(get("ural"), req),
  );
  assert.match(
    text.replaceAll("\u00a0", " "),
    /Дороже на 6 400 ₽, но доставка быстрее на 1 день/,
  );
});
test("Сравнение корректно показывает экономию и одинаковый срок", async () => {
  const { comparisonDelta } = await import("../src/logic.ts");
  const ural = evaluate(get("ural"), req),
    fresh = evaluate(get("fresh"), req);
  const text = comparisonDelta(fresh, ural);
  assert.match(text.replaceAll("\u00a0", " "), /Экономия 3 300 ₽/);
  assert.match(text, /срок доставки такой же/);
  assert.match(
    comparisonDelta(ural, ural).replaceAll("\u00a0", " "),
    /93 800 ₽/,
  );
});
test("Изменённые характеристики не считаются точным совпадением", () => {
  assert.equal(
    evaluate(get("ural"), {
      ...req,
      specification: "45% · брусок 2 кг · охлаждённая",
    }).suitable,
    true,
  );
  const changed = evaluate(get("ural"), {
    ...req,
    specification: "50% · брусок 2 кг · охлаждённая",
  });
  assert.equal(changed.suitable, false);
  assert.match(changed.issues.join(" "), /характеристики/);
});
test("Интерпретация извлекает бюджет и явно указанную жирность", () => {
  const parsed = parseQuery("200 кг моцареллы 50%, бюджет до 100 000 руб");
  assert.equal(parsed.budget, 100000);
  assert.match(parsed.specification!, /^50%/);
});
