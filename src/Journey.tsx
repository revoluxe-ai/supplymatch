import type { FormEvent } from "react";
import { categories, cities, paymentLabels } from "./data";
import type { Category, Payment, Request } from "./data";
import { comparisonDelta, dayLabel, money, number, parseQuery } from "./logic";
import type { Offer } from "./logic";
import { Icon } from "./icons";

export type InputSource = "text" | "photo" | "voice" | "example";
const sourceNames: Record<InputSource, string> = {
  text: "Текстовый запрос",
  photo: "Демофото",
  voice: "Демозапись",
  example: "Готовый пример",
};
export function JourneySteps({ step }: { step: number }) {
  return (
    <div className="journey-steps" aria-label={`Этап ${step} из 4`}>
      {["Потребность", "Интерпретация", "Предложения", "Решение"].map(
        (label, i) => (
          <div
            key={label}
            className={
              i + 1 === step ? "current" : i + 1 < step ? "complete" : ""
            }
          >
            <span>
              {i + 1 < step ? <Icon name="check" size={12} /> : `0${i + 1}`}
            </span>
            <strong>{label}</strong>
            {i < 3 && <i />}
          </div>
        ),
      )}
    </div>
  );
}
export function SearchLanding({
  query,
  onQuery,
  onSubmit,
  onMedia,
  onScenario,
  error,
}: {
  query: string;
  onQuery: (s: string) => void;
  onSubmit: (e: FormEvent) => void;
  onMedia: (s: "photo" | "voice") => void;
  onScenario: (c: Category) => void;
  error: string;
}) {
  return (
    <main className="discovery-page">
      <JourneySteps step={1} />
      <div className="discovery-layout">
        <section className="discovery-intro">
          <div className="eyebrow">СНАБЖЕНИЕ НАЧИНАЕТСЯ С ПОТРЕБНОСТИ</div>
          <h1>
            Нужен товар.
            <br /> Найдётся <span>решение.</span>
          </h1>
          <p>
            Опишите закупку своими словами.
            <br /> Сравните цену, доставку и оплату —<br /> и выберите своего
            поставщика.
          </p>
          <div className="intro-proof">
            <span>
              <Icon name="check" size={16} />
              Полная стоимость
            </span>
            <span>
              <Icon name="check" size={16} />
              Понятные компромиссы
            </span>
          </div>
          <div className="ninety-note">
            <span>
              90<span>сек</span>
            </span>
            <p>
              От первого запроса
              <br />
              до обоснованного выбора
            </p>
          </div>
        </section>
        <section className="universal-search">
          <div className="universal-heading">
            <span className="search-symbol">
              <Icon name="search" size={23} />
            </span>
            <div>
              <h2>Что нужно вашему бизнесу?</h2>
              <p>Текст, фотография или голос — начните как удобно</p>
            </div>
          </div>
          <div className="input-methods">
            <span className="selected">
              <Icon name="note" size={17} />
              Текст
            </span>
            <button onClick={() => onMedia("photo")}>
              <Icon name="camera" size={17} />
              По фото<small>демо</small>
            </button>
            <button onClick={() => onMedia("voice")}>
              <Icon name="mic" size={17} />
              Голосом<small>демо</small>
            </button>
          </div>
          <form onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="need">
              Что вам нужно закупить?
            </label>
            <textarea
              id="need"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Нужно 200 кг моцареллы для пиццерии. Доставка в Екатеринбург за 3 дня, отсрочка оплаты 30 дней…"
              rows={4}
              maxLength={700}
              required
            />
            <div className="search-undertext">
              <span>Можно с опечатками. Например, «моцорелла».</span>
            </div>
            {error && (
              <div className="form-error" role="alert">
                <Icon name="info" size={18} />
                {error}
              </div>
            )}
            <button className="btn primary universal-submit" type="submit">
              Разобрать потребность
              <Icon name="arrow" size={19} />
            </button>
          </form>
          <div className="universal-honesty">
            <Icon name="info" size={15} />
            <span>
              Демопоиск по локальному каталогу. Фото и голос — готовые примеры,
              без распознавания.
            </span>
          </div>
        </section>
      </div>
      <section className="scenario-section">
        <div className="scenario-heading">
          <h2>Попробуйте на реальной задаче бизнеса</h2>
          <span>Синтетические данные · 10 поставщиков</span>
        </div>
        <div className="scenario-grid">
          {(Object.keys(categories) as Category[]).map((key, i) => (
            <button
              className="scenario-card"
              key={key}
              onClick={() => onScenario(key)}
            >
              <span className={`category-icon cat-${key}`}>
                <Icon
                  name={i === 0 ? "cheese" : i === 1 ? "wheat" : "box"}
                  size={25}
                />
              </span>
              <div>
                <small>
                  {i === 0
                    ? "ДЛЯ ПИЦЦЕРИИ"
                    : i === 1
                      ? "ДЛЯ ПЕКАРНИ"
                      : "ДЛЯ ДОСТАВКИ ЕДЫ"}
                </small>
                <h3>
                  {i === 0
                    ? "200 кг моцареллы"
                    : i === 1
                      ? "500 кг муки"
                      : "1 000 коробок для пиццы"}
                </h3>
                <p>
                  {i === 0
                    ? "Екатеринбург · 3 дня · отсрочка 30 дней"
                    : i === 1
                      ? "Казань · 3 дня · сравнение полной цены"
                      : "Москва · 3 дня · партия от 500 шт"}
                </p>
              </div>
              <Icon name="arrow" size={18} />
            </button>
          ))}
        </div>
      </section>
      <footer className="discovery-footer">
        <span>SupplyMatch · UX-прототип для Goulash.Tech</span>
        <span>Все компании, цены, документы и контакты вымышлены</span>
      </footer>
    </main>
  );
}
export function Interpretation({
  draft,
  setDraft,
  source,
  onSubmit,
  onBack,
  error,
  busy,
  standardSpecs,
}: {
  draft: Request;
  setDraft: (r: Request) => void;
  source: InputSource;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
  error: string;
  busy: boolean;
  standardSpecs: Record<Category, string>;
}) {
  const extracted = parseQuery(draft.query);
  const hint = (field: keyof Request) =>
    extracted[field] !== undefined
      ? extracted[field] === draft[field]
        ? "из запроса"
        : "изменено вами"
      : "не указано в запросе";
  return (
    <main className="interpret-page content-width">
      <JourneySteps step={2} />
      <div className="interpret-heading">
        <div>
          <div className="eyebrow">СНАЧАЛА УБЕДИМСЯ, ЧТО ВСЁ ВЕРНО</div>
          <h1>Вот что нужно закупить.</h1>
          <p>
            Мы собрали параметры в одну задачу. Любое условие можно изменить.
          </p>
        </div>
        <button className="text-button" onClick={onBack}>
          <Icon name="left" size={16} />
          Изменить описание
        </button>
      </div>
      <div className="interpret-layout">
        <aside className="original-request">
          <span className="source-badge">
            <Icon
              name={
                source === "photo"
                  ? "camera"
                  : source === "voice"
                    ? "mic"
                    : "note"
              }
              size={16}
            />
            {sourceNames[source]}
            {source === "photo" || source === "voice" ? (
              <small>ДЕМО</small>
            ) : null}
          </span>
          <blockquote>«{draft.query}»</blockquote>
          <div className="interpret-rule">
            <Icon name="info" size={18} />
            <p>
              Параметры извлечены по простым правилам. Незаполненные условия
              дополнены демозначениями. Это не AI-анализ.
            </p>
          </div>
          <div className="next-preview">
            <span>ДАЛЬШЕ</span>
            <h3>Три способа выбрать</h3>
            <p>
              <Icon name="scale" size={16} />
              Баланс цены и скорости
            </p>
            <p>
              <Icon name="wallet" size={16} />
              Минимальная полная стоимость
            </p>
            <p>
              <Icon name="clock" size={16} />
              Самое быстрое получение
            </p>
          </div>
        </aside>
        <form className="interpret-form" onSubmit={onSubmit} aria-busy={busy}>
          <div className="interpret-form-title">
            <span className="interpret-check">
              <Icon name="check" size={20} />
            </span>
            <div>
              <h2>Проверьте параметры закупки</h2>
              <p>Все условия ниже учитываются при сравнении</p>
            </div>
          </div>
          <div className="interpret-fields">
            <label className="interpret-field full">
              <span>
                Товар<small>демокаталог</small>
              </span>
              <select
                aria-label="Товар"
                value={draft.category}
                onChange={(e) => {
                  const category = e.target.value as Category;
                  setDraft({
                    ...draft,
                    category,
                    unit: categories[category].unit,
                    specification: standardSpecs[category],
                  });
                }}
              >
                {(Object.keys(categories) as Category[]).map((c) => (
                  <option value={c} key={c}>
                    {categories[c].product}
                  </option>
                ))}
              </select>
            </label>
            <label className="interpret-field full">
              <span>
                Характеристики<small>можно уточнить</small>
              </span>
              <input
                aria-label="Характеристики"
                value={draft.specification ?? standardSpecs[draft.category]}
                onChange={(e) =>
                  setDraft({ ...draft, specification: e.target.value })
                }
              />
              <small>
                В каталоге стандартный вариант: {standardSpecs[draft.category]}.
                Другие характеристики будут отмечены как отличие.
              </small>
            </label>
            <label className="interpret-field">
              <span>
                Объём<small>{hint("quantity")}</small>
              </span>
              <div className="interpret-quantity">
                <input
                  aria-label="Объём закупки"
                  type="number"
                  min={1}
                  max={1000000}
                  required
                  value={draft.quantity || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, quantity: Number(e.target.value) })
                  }
                />
                <select
                  aria-label="Единица измерения"
                  value={draft.unit}
                  onChange={(e) =>
                    setDraft({ ...draft, unit: e.target.value as "кг" | "шт" })
                  }
                >
                  <option>кг</option>
                  <option>шт</option>
                </select>
              </div>
            </label>
            <label className="interpret-field">
              <span>
                Город доставки<small>{hint("city")}</small>
              </span>
              <select
                aria-label="Город доставки"
                value={draft.city}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    city: e.target.value as Request["city"],
                  })
                }
              >
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="interpret-field">
              <span>
                Получить за, дней<small>{hint("days")}</small>
              </span>
              <input
                aria-label="Желаемый срок, дней"
                type="number"
                min={1}
                max={30}
                required
                value={draft.days || ""}
                onChange={(e) =>
                  setDraft({ ...draft, days: Number(e.target.value) })
                }
              />
            </label>
            <label className="interpret-field">
              <span>
                Бюджет с доставкой, ₽<small>необязательно</small>
              </span>
              <input
                aria-label="Бюджет с доставкой, ₽"
                type="number"
                min={1}
                value={draft.budget ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    budget:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Без ограничений"
              />
            </label>
            <label className="interpret-field full">
              <span>
                Условия оплаты<small>{hint("payment")}</small>
              </span>
              <select
                aria-label="Условия оплаты"
                value={draft.payment}
                onChange={(e) =>
                  setDraft({ ...draft, payment: e.target.value as Payment })
                }
              >
                {Object.entries(paymentLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <div className="form-error" role="alert">
              <Icon name="info" size={17} />
              {error}
            </div>
          )}
          <div className="interpret-submit">
            <span>
              <Icon name="shield" size={17} />
              Без регистрации и отправки заявок
            </span>
            <button disabled={busy} className="btn primary" type="submit">
              {busy ? (
                <>
                  <span className="loading-spinner" />
                  Считаем условия локально…
                </>
              ) : (
                <>
                  Всё верно, показать предложения
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </div>
          <p className="interpret-demo-label">
            Демонстрационные предложения. Запрос не отправляется поставщикам.
          </p>
        </form>
      </div>
    </main>
  );
}
export function RecommendationDeck({
  request,
  balance,
  cheapest,
  fastest,
  selected,
  onToggle,
  onOpen,
  onCompare,
}: {
  request: Request;
  balance?: Offer;
  cheapest?: Offer;
  fastest?: Offer;
  selected: string[];
  onToggle: (id: string) => void;
  onOpen: (o: Offer) => void;
  onCompare: () => void;
}) {
  const cards = [
    {
      key: "balance",
      name: "Оптимальный баланс",
      icon: "scale",
      offer: balance,
      note: "Цена и срок — без лишних компромиссов",
    },
    {
      key: "price",
      name: "Минимальная стоимость",
      icon: "wallet",
      offer: cheapest,
      note: "Самый низкий итог с доставкой",
    },
    {
      key: "speed",
      name: "Максимальная скорость",
      icon: "clock",
      offer: fastest,
      note: "Самый короткий срок получения",
    },
  ];
  return (
    <section className="recommendation-section" aria-label="Три рекомендации">
      <div className="recommendation-heading">
        <div>
          <h2>Одна закупка. Три решения.</h2>
          <p>Не только цена за килограмм — вся картина до выбора.</p>
        </div>
        <button className="btn secondary" onClick={onCompare}>
          <Icon name="scale" size={17} />
          Сравнить предложения
        </button>
      </div>
      <div className="recommendation-grid">
        {cards.map(({ key, name, icon, offer: o, note }) => (
          <article
            className={`recommendation-card recommendation-${key} ${!o ? "unavailable" : ""}`}
            key={key}
          >
            <div className="recommendation-label">
              <Icon name={icon} size={18} />
              {name}
              {key === "balance" && o && <span>ВЫБОР SUPPLYMATCH</span>}
            </div>
            {o ? (
              <>
                <div className="recommendation-supplier">
                  <span className={`avatar ${o.supplier.color}`}>
                    {o.supplier.initials}
                  </span>
                  <div>
                    <button onClick={() => onOpen(o)}>
                      {o.supplier.name}
                      <Icon name="arrow" size={14} />
                    </button>
                    <small>
                      {o.supplier.city} ·{" "}
                      {o.distance
                        ? `${number(o.distance)} км`
                        : "в вашем городе"}
                    </small>
                  </div>
                </div>
                <div className="recommendation-total">
                  <span>Итого с доставкой</span>
                  <strong>{money(o.total)}</strong>
                  <small>
                    {money(o.supplier.price)} / {request.unit} · расчёт на{" "}
                    {number(o.quantity)} {request.unit}
                  </small>
                </div>
                <div className="mini-breakdown">
                  <span>
                    Товар <strong>{money(o.goods)}</strong>
                  </span>
                  <span>
                    Доставка <strong>{money(o.shipping)}</strong>
                  </span>
                </div>
                <div className="recommendation-terms">
                  <span>
                    <Icon name="truck" size={16} />
                    {dayLabel(o.days)}
                  </span>
                  <span>
                    <Icon name="box" size={16} />
                    от {number(o.supplier.min)} {request.unit}
                  </span>
                </div>
                <div className="recommendation-payment">
                  <Icon name="wallet" size={15} />
                  {o.paymentOk && request.payment !== "any"
                    ? paymentLabels[request.payment]
                    : paymentLabels[
                        o.supplier.payments.includes("defer30")
                          ? "defer30"
                          : o.supplier.payments[0]
                      ]}
                </div>
                <div className="recommendation-docs">
                  <Icon name={o.supplier.docs ? "shield" : "info"} size={15} />
                  {o.supplier.docs
                    ? "Документы указаны"
                    : "Документы нужно уточнить"}
                </div>
                <div
                  className={`recommendation-explanation ${o.suitable ? "" : "has-issues"}`}
                >
                  <strong>
                    <Icon name={o.suitable ? "check" : "info"} size={15} />
                    {o.suitable ? "Почему этот вариант" : "Есть ограничение"}
                  </strong>
                  <p>
                    {o.suitable
                      ? key === "balance"
                        ? `Подходит по обязательным условиям. ${cheapest && cheapest.supplier.id !== o.supplier.id ? comparisonDelta(o, cheapest) : note + "."}`
                        : key === "speed" && balance
                          ? comparisonDelta(o, balance)
                          : `Полный итог ${money(o.total)}. ${note}.`
                      : `${note}. ${o.issues.join(". ")}.`}
                  </p>
                </div>
                <div className="recommendation-actions">
                  <button
                    className={
                      key === "balance" ? "btn primary" : "btn secondary"
                    }
                    onClick={() => onOpen(o)}
                  >
                    Условия и контакты
                    <Icon name="arrow" size={16} />
                  </button>
                  <button
                    className={`recommendation-compare ${selected.includes(o.supplier.id) ? "checked" : ""}`}
                    onClick={() => onToggle(o.supplier.id)}
                    aria-label={`${selected.includes(o.supplier.id) ? "Убрать" : "Добавить"} ${o.supplier.name} (${name.toLowerCase()}) ${selected.includes(o.supplier.id) ? "из сравнения" : "к сравнению"}`}
                    aria-pressed={selected.includes(o.supplier.id)}
                  >
                    <Icon
                      name={
                        selected.includes(o.supplier.id) ? "check" : "scale"
                      }
                      size={18}
                    />
                  </button>
                </div>
              </>
            ) : (
              <div className="recommendation-unavailable">
                <Icon name="info" size={28} />
                <h3>Полного совпадения нет</h3>
                <p>
                  Ни один поставщик не выполняет все условия. Посмотрите
                  варианты с отличиями или измените запрос.
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
      <p className="recommendation-note">
        <Icon name="info" size={15} />
        Минимальная цена и скорость показаны по всей категории. Ограничения
        отмечены явно. Один поставщик может выиграть по нескольким критериям.
      </p>
    </section>
  );
}
export function DecisionSummary({
  offers,
  onChoose,
}: {
  offers: Offer[];
  onChoose: (o: Offer) => void;
}) {
  const baseline = [...offers].sort((a, b) => a.total - b.total)[0];
  return (
    <section className="decision-summary">
      <div className="decision-heading">
        <span className="why-icon">
          <Icon name="scale" size={24} />
        </span>
        <div>
          <div className="eyebrow">ЧТО МЕНЯЕТСЯ ДЛЯ ВАШЕГО БИЗНЕСА</div>
          <h2>За что вы платите. На чём экономите.</h2>
          <p>
            Сравниваем с минимальным итогом среди выбранных:{" "}
            {baseline.supplier.name}, {money(baseline.total)}.
          </p>
        </div>
      </div>
      <div className="decision-options">
        {offers.map((o) => (
          <div key={o.supplier.id}>
            <div>
              <strong>{o.supplier.name}</strong>
              <span
                className={o.suitable ? "decision-fit" : "decision-warning"}
              >
                {o.suitable
                  ? "Выполняет условия"
                  : o.issues.length === 1
                    ? "Есть ограничение"
                    : "Есть ограничения"}
              </span>
            </div>
            <p>{comparisonDelta(o, baseline)}</p>
            {!o.suitable && <small>{o.issues.join(". ")}.</small>}
            <button onClick={() => onChoose(o)} className="text-button">
              {o.suitable ? "Выбрать этот вариант" : "Посмотреть ограничения"}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
