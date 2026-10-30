import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  categories,
  cities,
  initialRequest,
  paymentLabels,
  suppliers,
  standardSpecs,
} from "./data";
import type { Category, Priority, Request, Supplier } from "./data";
import {
  dayLabel,
  detectCategory,
  evaluate,
  explain,
  money,
  number,
  parseQuery,
  rankOffers,
} from "./logic";
import type { Offer } from "./logic";
import { Icon } from "./icons";
import {
  SearchLanding,
  Interpretation,
  JourneySteps,
  RecommendationDeck,
  DecisionSummary,
} from "./Journey";
import type { InputSource } from "./Journey";

type Page = "search" | "interpret" | "results" | "compare";
type DemoMode = "photo" | "voice" | "about" | null;
const priorityOptions: { id: Priority; title: string; icon: string }[] = [
  { id: "balance", title: "Баланс", icon: "scale" },
  { id: "price", title: "Дешевле", icon: "wallet" },
  { id: "speed", title: "Быстрее", icon: "clock" },
];
function Avatar({ s, small = false }: { s: Supplier; small?: boolean }) {
  return (
    <span className={`avatar ${s.color} ${small ? "small" : ""}`}>
      {s.initials}
    </span>
  );
}
function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-note">
      <Icon name="info" size={15} />
      <span>
        {children ||
          "Все поставщики, цены, документы и контакты вымышлены. Данные синтетические."}
      </span>
    </div>
  );
}
function Modal({
  children,
  onClose,
  label,
  className = "",
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = ref.current;
    const selectors =
      'button:not(:disabled), input, select, textarea, a[href], [tabindex="0"]';
    (root?.querySelector(selectors) as HTMLElement | null)?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && root) {
        const all = Array.from(
          root.querySelectorAll<HTMLElement>(selectors),
        ).filter((e) => e.offsetParent !== null);
        if (!all.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`overlay ${className}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="modal-surface"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("search");
  const [draft, setDraft] = useState<Request>({ ...initialRequest });
  const [request, setRequest] = useState<Request>({ ...initialRequest });
  const [source, setSource] = useState<InputSource>("text");
  const [busy, setBusy] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState<DemoMode>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<Supplier | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "suitable">("all");
  const [docsOnly, setDocsOnly] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [origin, setOrigin] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [toast, setToast] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("supplymatch-notes") || "{}",
      );
      return saved && typeof saved === "object" && !Array.isArray(saved)
        ? Object.fromEntries(
            Object.entries(saved).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )
        : {};
    } catch {
      return {};
    }
  });
  const ranked = rankOffers(suppliers, request);
  const suitable = ranked.filter((o) => o.suitable);
  const recommended = rankOffers(suppliers, {
    ...request,
    priority: "balance",
  }).find((o) => o.suitable);
  const cheapest = [...ranked].sort((a, b) => a.total - b.total)[0];
  const fastest = [...ranked].sort(
    (a, b) => a.days - b.days || a.total - b.total,
  )[0];
  let visible = ranked.filter(
    (o) =>
      (filter === "all" || o.suitable) &&
      (!docsOnly || o.supplier.docs) &&
      (origin === "all" || o.supplier.city === origin),
  );
  if (sort === "total")
    visible = [...visible].sort((a, b) => a.total - b.total);
  if (sort === "delivery")
    visible = [...visible].sort((a, b) => a.days - b.days || a.total - b.total);
  if (sort === "unit")
    visible = [...visible].sort((a, b) => a.supplier.price - b.supplier.price);
  const compareOffers = selected
    .map((id) => ranked.find((o) => o.supplier.id === id))
    .filter((o): o is Offer => !!o);
  const move = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("main h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
  };
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else if (selected.length < 3) setSelected([...selected, id]);
    else
      setToast(
        "Можно сравнить до 3 поставщиков. Уберите один вариант, чтобы добавить другой.",
      );
  };
  const writeNote = (id: string, value: string) => {
    const next = { ...notes, [id]: value };
    setNotes(next);
    try {
      localStorage.setItem("supplymatch-notes", JSON.stringify(next));
    } catch {
      setToast(
        "Заметка доступна в этой сессии: браузер запретил локальное сохранение.",
      );
    }
  };
  const queryChange = (query: string) => {
    setDraft((d) => ({ ...d, ...parseQuery(query), query }));
    setError("");
  };
  const interpret = (query: string, inputSource: InputSource = "text") => {
    const category = detectCategory(query);
    if (!category) {
      setError(
        "В демокаталоге есть моцарелла, пшеничная мука и коробки для пиццы. Выберите готовый пример ниже.",
      );
      return;
    }
    const parsed = parseQuery(query);
    setDraft({
      ...initialRequest,
      category,
      quantity: categories[category].quantity,
      unit: categories[category].unit,
      payment: "any",
      specification: standardSpecs[category],
      ...parsed,
      query,
    });
    setSource(inputSource);
    setError("");
    setToast("");
    move("interpret");
  };
  const scenario = (category: Category, inputSource: InputSource = "example") =>
    interpret(categories[category].query, inputSource);
  const startInterpretation = (e: FormEvent) => {
    e.preventDefault();
    interpret(draft.query);
  };
  const search = async (e: FormEvent) => {
    e.preventDefault();
    const category = draft.category;
    if (!category) {
      setError(
        "В демокаталоге есть моцарелла, пшеничная мука и коробки для пиццы. Попробуйте один из примеров ниже.",
      );
      return;
    }
    if (
      !Number.isFinite(draft.quantity) ||
      draft.quantity < 1 ||
      draft.quantity > 1000000
    ) {
      setError("Укажите объём от 1 до 1 000 000.");
      return;
    }
    if (!Number.isFinite(draft.days) || draft.days < 1 || draft.days > 30) {
      setError("Укажите срок от 1 до 30 дней.");
      return;
    }
    if (draft.unit !== categories[category].unit) {
      setError(
        `Для этой категории укажите объём в ${categories[category].unit}.`,
      );
      return;
    }
    if (
      draft.budget !== null &&
      (!Number.isFinite(draft.budget) || draft.budget < 1)
    ) {
      setError("Бюджет должен быть больше нуля. Или оставьте поле пустым.");
      return;
    }
    setBusy(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    setRequest({ ...draft, category });
    setCatalogOpen(false);
    setBusy(false);
    setSelected([]);
    setChosen(null);
    setDocsOnly(false);
    setOrigin("all");
    setSort("recommended");
    setFilter("all");
    setError("");
    setToast("");
    move("results");
  };
  const changePriority = (priority: Priority) => {
    setRequest((r) => ({ ...r, priority }));
    setDraft((d) => ({ ...d, priority }));
  };
  const edit = () => {
    setDraft({ ...request });
    move("interpret");
  };
  const openCompare = () => {
    if (selected.length >= 2) move("compare");
    else setToast("Добавьте ещё одного поставщика для сравнения.");
  };
  const badge = (o: Offer) =>
    o.supplier.id === recommended?.supplier.id
      ? { text: "Оптимальное предложение", icon: "spark", className: "optimal" }
      : o.supplier.id === fastest?.supplier.id
        ? { text: "Быстрая доставка", icon: "clock", className: "fast" }
        : o.supplier.id === cheapest?.supplier.id
          ? { text: "Самая низкая стоимость", icon: "wallet", className: "low" }
          : null;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => move("search")}
            aria-label="SupplyMatch — на главную"
          >
            <span className="brand-mark">
              <Icon name="logo" size={25} />
            </span>
            <span>
              Supply<span className="brand-light">Match</span>
              <span className="brand-dot">.</span>
            </span>
          </button>
          <nav aria-label="Главная навигация">
            <button
              className={page !== "compare" ? "active" : ""}
              onClick={() =>
                move(
                  page === "search" || page === "interpret" ? page : "results",
                )
              }
            >
              Подбор поставщиков
            </button>
            <button
              className={page === "compare" ? "active" : ""}
              onClick={openCompare}
              aria-label={`Сравнение ${selected.length}`}
            >
              <Icon name="scale" size={18} />
              Сравнение <span className="nav-count">{selected.length}</span>
            </button>
          </nav>
          <div className="header-right">
            <span className="demo-pill">
              <span />
              Синтетические данные
            </span>
            <button
              className="icon-btn help"
              onClick={() => setDemo("about")}
              aria-label="О прототипе"
            >
              <Icon name="info" />
            </button>
          </div>
        </div>
      </header>

      {page === "search" && (
        <SearchLanding
          query={draft.query}
          onQuery={queryChange}
          onSubmit={startInterpretation}
          onMedia={setDemo}
          onScenario={scenario}
          error={error}
        />
      )}
      {page === "interpret" && (
        <Interpretation
          draft={draft}
          setDraft={setDraft}
          source={source}
          standardSpecs={standardSpecs}
          onSubmit={search}
          onBack={() => move("search")}
          error={error}
          busy={busy}
        />
      )}

      {page === "results" && (
        <main className="results-page content-width">
          <JourneySteps step={3} />
          <div className="page-heading">
            <div>
              <div className="eyebrow">ПОДБОР ПОСТАВЩИКОВ</div>
              <h1>
                Выбирайте условия,
                <br className="mobile-only" /> а не просто поставщика.
              </h1>
              <p>
                Три ориентира для вашей закупки. Все суммы уже включают
                доставку.
              </p>
            </div>
            <button className="btn secondary edit-button" onClick={edit}>
              <Icon name="sliders" size={17} />
              Изменить запрос
            </button>
          </div>
          <div className="request-summary">
            <span className={`category-icon cat-${request.category}`}>
              <Icon
                name={
                  request.category === "dairy"
                    ? "cheese"
                    : request.category === "flour"
                      ? "wheat"
                      : "box"
                }
                size={23}
              />
            </span>
            <div>
              <strong>{categories[request.category].product}</strong>
              <div className="summary-meta">
                <span>
                  {number(request.quantity)} {request.unit}
                </span>
                <b>·</b>
                <span>{request.city}</span>
                <b>·</b>
                <span>за {dayLabel(request.days)}</span>
                <b>·</b>
                <span>{paymentLabels[request.payment]}</span>
                {request.budget !== null && (
                  <>
                    <b>·</b>
                    <span>до {money(request.budget)}</span>
                  </>
                )}
              </div>
            </div>
            <span className="summary-check">
              <Icon name="check" size={15} />
              Запрос задан
            </span>
          </div>
          <RecommendationDeck
            request={request}
            balance={recommended}
            cheapest={cheapest}
            fastest={fastest}
            selected={selected}
            onToggle={toggle}
            onOpen={(o) => setDrawer(o.supplier)}
            onCompare={() => {
              const ids = Array.from(
                new Set(
                  [
                    recommended?.supplier.id,
                    cheapest?.supplier.id,
                    fastest?.supplier.id,
                  ].filter((id): id is string => !!id),
                ),
              );
              if (ids.length < 2) {
                const alternative = ranked.find(
                  (o) => !ids.includes(o.supplier.id),
                );
                if (alternative) ids.push(alternative.supplier.id);
              }
              setSelected(ids);
              move("compare");
            }}
          />
          <div className="catalog-heading">
            <div>
              <h2>Все предложения и детали</h2>
              <p>
                {ranked.length} предложений · {suitable.length} полностью
                соответствуют запросу
              </p>
            </div>
            <button
              className="btn secondary"
              aria-expanded={catalogOpen}
              onClick={() => setCatalogOpen(!catalogOpen)}
            >
              {catalogOpen
                ? "Свернуть каталог"
                : `Посмотреть все ${ranked.length}`}
              <Icon name="down" size={17} />
            </button>
          </div>
          {catalogOpen && (
            <div className="results-layout">
              <aside
                className={`filters ${mobileFilters ? "mobile-filters-open" : ""}`}
              >
                <button
                  className="mobile-filter-toggle text-button"
                  onClick={() => setMobileFilters(!mobileFilters)}
                  aria-expanded={mobileFilters}
                >
                  <Icon name="sliders" size={15} />
                  Фильтры{docsOnly || origin !== "all" ? " · включены" : ""}
                  <Icon name="down" size={14} />
                </button>
                <div className="filter-section">
                  <div className="filter-title">Что важнее?</div>
                  <div className="priority-vertical">
                    {priorityOptions.map((p) => (
                      <button
                        key={p.id}
                        className={request.priority === p.id ? "selected" : ""}
                        onClick={() => changePriority(p.id)}
                      >
                        <Icon name={p.icon} size={18} />
                        <span>{p.title}</span>
                        <span className="radio-dot" />
                      </button>
                    ))}
                  </div>
                  <p className="filter-explain">
                    {request.priority === "balance"
                      ? "Учитываем стоимость и скорость доставки."
                      : request.priority === "price"
                        ? "Сначала подходящие варианты с меньшей общей стоимостью."
                        : "Сначала подходящие варианты с коротким сроком доставки."}
                  </p>
                </div>
                <div className="filter-section">
                  <div className="filter-title">Уточнить подбор</div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={docsOnly}
                      onChange={(e) => setDocsOnly(e.target.checked)}
                    />
                    <span>
                      Есть сведения
                      <br />о документах
                    </span>
                  </label>
                  <label className="field origin-field">
                    <span>Город поставщика</span>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    >
                      <option value="all">Все города</option>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  {(docsOnly || origin !== "all") && (
                    <button
                      className="text-button reset-filter"
                      onClick={() => {
                        setDocsOnly(false);
                        setOrigin("all");
                      }}
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
                <div className="sidebar-tip">
                  <Icon name="scale" size={22} />
                  <strong>Смотрите шире цены</strong>
                  <p>
                    Дешевле за килограмм — не всегда дешевле за закупку.
                    Добавьте 2–3 варианта к сравнению.
                  </p>
                </div>
              </aside>
              <section
                className="offer-list"
                aria-label="Предложения поставщиков"
              >
                <div className="results-toolbar">
                  <div className="result-tabs">
                    <button
                      className={filter === "all" ? "active" : ""}
                      onClick={() => setFilter("all")}
                    >
                      Все предложения <span>{ranked.length}</span>
                    </button>
                    <button
                      className={filter === "suitable" ? "active" : ""}
                      onClick={() => setFilter("suitable")}
                    >
                      Подходят <span>{suitable.length}</span>
                    </button>
                  </div>
                  <label className="sort-label">
                    <span className="sr-only">Сортировка</span>
                    <select
                      aria-label="Сортировка"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="recommended">По соответствию</option>
                      <option value="total">По общей стоимости</option>
                      <option value="delivery">По сроку доставки</option>
                      <option value="unit">По цене за единицу</option>
                    </select>
                  </label>
                </div>
                {suitable.length === 0 && (
                  <div className="no-match">
                    <Icon name="info" size={20} />
                    <div>
                      <strong>Точного совпадения пока нет</strong>
                      <p>
                        Ниже — варианты с отличиями. Измените срок, объём или
                        оплату, чтобы расширить подбор.
                      </p>
                    </div>
                  </div>
                )}
                <div className="offer-count" aria-live="polite">
                  Показано {visible.length} из {ranked.length} · Стоимость
                  рассчитана с доставкой
                </div>
                {visible.map((o) => {
                  const s = o.supplier,
                    b = badge(o),
                    isSelected = selected.includes(s.id);
                  return (
                    <article
                      key={s.id}
                      className={`offer-card ${s.id === recommended?.supplier.id ? "recommended" : ""} ${isSelected ? "is-selected" : ""}`}
                    >
                      {b && (
                        <div className={`offer-ribbon ${b.className}`}>
                          <Icon name={b.icon} size={15} />
                          {b.text}
                          {s.id === recommended?.supplier.id && (
                            <span>по вашим условиям</span>
                          )}
                        </div>
                      )}
                      <div className="offer-main">
                        <div className="offer-top">
                          <div className="supplier-identity">
                            <Avatar s={s} />
                            <div>
                              <button
                                className="supplier-name"
                                onClick={() => setDrawer(s)}
                              >
                                {s.name}
                                <Icon name="arrow" size={15} />
                              </button>
                              <div className="supplier-location">
                                <Icon name="pin" size={13} />
                                {s.city}
                                <span>·</span>
                                {o.distance
                                  ? `${number(o.distance)} км`
                                  : "в вашем городе"}
                              </div>
                            </div>
                          </div>
                          <div className="unit-price">
                            <strong>{money(s.price)}</strong>
                            <span>/ {request.unit}</span>
                          </div>
                        </div>
                        <div className="product-title">
                          {s.product}
                          <span className="product-specs">
                            {" · "}
                            {s.specs}
                          </span>
                        </div>
                        <div className="offer-facts">
                          <div>
                            <span>
                              <Icon name="box" size={14} />
                              Минимальная партия
                            </span>
                            <strong>
                              {number(s.min)} {request.unit}
                            </strong>
                          </div>
                          <div>
                            <span>
                              <Icon name="truck" size={15} />
                              Доставка
                            </span>
                            <strong
                              className={
                                o.days > request.days ? "warning-text" : ""
                              }
                            >
                              {dayLabel(o.days)}
                            </strong>
                          </div>
                          <div>
                            <span>
                              <Icon name="wallet" size={14} />
                              Оплата
                            </span>
                            <strong
                              className={!o.paymentOk ? "warning-text" : ""}
                            >
                              {o.paymentOk && request.payment !== "any"
                                ? paymentLabels[request.payment]
                                : paymentLabels[
                                    s.payments.includes("defer30")
                                      ? "defer30"
                                      : s.payments.includes("defer14")
                                        ? "defer14"
                                        : s.payments[0]
                                  ]}
                            </strong>
                          </div>
                        </div>
                        <div
                          className={`match-reason ${o.suitable ? "fits" : "doesnt-fit"}`}
                        >
                          <Icon
                            name={o.suitable ? "check" : "info"}
                            size={16}
                          />
                          <span>
                            {o.suitable
                              ? "Подходит по объёму, сроку и оплате"
                              : `Не соответствует условиям: ${o.issues.join(" · ")}`}
                          </span>
                        </div>
                        <div className="cost-breakdown">
                          <div>
                            <span>
                              Товар · {number(o.quantity)} {request.unit}
                              {o.quantity > request.quantity
                                ? " (мин. партия)"
                                : ""}
                            </span>
                            <strong>{money(o.goods)}</strong>
                          </div>
                          <span className="math-symbol">+</span>
                          <div>
                            <span>Доставка</span>
                            <strong>{money(o.shipping)}</strong>
                          </div>
                          <span className="math-symbol">=</span>
                          <div className="total-cost">
                            <span>Итого с доставкой</span>
                            <strong>{money(o.total)}</strong>
                          </div>
                        </div>
                        <div className="offer-actions">
                          <span
                            className={`document-status ${!s.docs ? "unconfirmed" : ""}`}
                          >
                            <Icon name={s.docs ? "shield" : "info"} size={15} />
                            {s.docs
                              ? "Документы указаны"
                              : "Документы не указаны"}
                          </span>
                          <div>
                            <button
                              className="text-button details-btn"
                              onClick={() => setDrawer(s)}
                            >
                              Подробнее
                              <Icon name="arrow" size={15} />
                            </button>
                            <button
                              className={`compare-button ${isSelected ? "checked" : ""}`}
                              onClick={() => toggle(s.id)}
                              aria-pressed={isSelected}
                            >
                              <Icon
                                name={isSelected ? "check" : "scale"}
                                size={17}
                              />
                              {isSelected ? "В сравнении" : "Сравнить"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {visible.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <Icon name="search" size={30} />
                    </span>
                    <h2>Здесь пока пусто</h2>
                    <p>
                      Для этих фильтров нет предложений.
                      <br />
                      Попробуйте показать все варианты.
                    </p>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setFilter("all");
                        setDocsOnly(false);
                        setOrigin("all");
                      }}
                    >
                      Сбросить все фильтры
                    </button>
                  </div>
                )}
                <DemoNote>
                  Все данные синтетические. Расстояния ориентировочные; сроки и
                  доставка заданы для демонстрации.
                </DemoNote>
              </section>
            </div>
          )}
        </main>
      )}

      {page === "compare" && (
        <main className="compare-page content-width">
          <JourneySteps step={4} />
          <button
            className="text-button back-link"
            onClick={() => move("results")}
          >
            <Icon name="left" size={17} />К предложениям
          </button>
          <div className="page-heading">
            <div>
              <div className="eyebrow">РЕШЕНИЕ В ДЕТАЛЯХ</div>
              <h1>Сравните. И выберите своё.</h1>
              <p>
                {categories[request.category].product} ·{" "}
                {number(request.quantity)} {request.unit} · {request.city}
              </p>
            </div>
            <span className="compare-counter">
              {selected.length} из 3 поставщиков
            </span>
          </div>
          {compareOffers.length < 2 ? (
            <div className="empty-state">
              <Icon name="scale" size={36} />
              <h2>Для сравнения нужны два варианта</h2>
              <p>Вернитесь к предложениям и добавьте ещё одного поставщика.</p>
              <button className="btn primary" onClick={() => move("results")}>
                Выбрать предложения
                <Icon name="arrow" size={18} />
              </button>
            </div>
          ) : (
            <>
              <DecisionSummary
                offers={compareOffers}
                onChoose={(o) => setDrawer(o.supplier)}
              />
              <p className="compare-scroll-hint">
                <Icon name="arrow" size={14} />
                Листайте таблицу вправо, чтобы увидеть все варианты
              </p>
              <div className="compare-table-wrap">
                <table className={`comparison count-${compareOffers.length}`}>
                  <caption className="sr-only">
                    Сравнение поставщиков по стоимости и условиям закупки
                  </caption>
                  <thead>
                    <tr>
                      <th>
                        <span className="table-eyebrow">ВАША ЗАКУПКА</span>
                        <strong>
                          {number(request.quantity)} {request.unit}
                        </strong>
                        <span>
                          С доставкой
                          <br />в{" "}
                          {request.city === "Москва"
                            ? "Москву"
                            : request.city === "Казань"
                              ? "Казань"
                              : "Екатеринбург"}
                        </span>
                      </th>
                      {compareOffers.map((o) => (
                        <th
                          key={o.supplier.id}
                          className={
                            o.supplier.id === recommended?.supplier.id
                              ? "best-column"
                              : ""
                          }
                        >
                          <button
                            className="remove-compare icon-btn"
                            onClick={() => toggle(o.supplier.id)}
                            aria-label={`Убрать ${o.supplier.name} из сравнения`}
                          >
                            <Icon name="close" size={15} />
                          </button>
                          <Avatar s={o.supplier} />
                          <button
                            className="table-supplier"
                            onClick={() => setDrawer(o.supplier)}
                          >
                            {o.supplier.name}
                          </button>
                          <span>{o.supplier.city}</span>
                          <span
                            className={`table-fit ${o.suitable ? "" : "not-fit"}`}
                          >
                            <Icon
                              name={o.suitable ? "check" : "info"}
                              size={13}
                            />
                            {o.suitable ? "Подходит" : "Есть отличия"}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: `Цена за ${request.unit}`,
                        values: compareOffers.map((o) => o.supplier.price),
                        render: (o: Offer) => money(o.supplier.price),
                        best: true,
                      },
                      {
                        label: "Минимальная партия",
                        values: compareOffers.map((o) => o.supplier.min),
                        render: (o: Offer) =>
                          `${number(o.supplier.min)} ${request.unit}`,
                        best: true,
                      },
                      {
                        label: "Объём для расчёта",
                        values: [],
                        render: (o: Offer) =>
                          `${number(o.quantity)} ${request.unit}${o.quantity > request.quantity ? " · мин. партия" : ""}`,
                        best: false,
                      },
                      {
                        label: "Стоимость товара",
                        values: compareOffers.map((o) => o.goods),
                        render: (o: Offer) => money(o.goods),
                        best: false,
                      },
                      {
                        label: "Доставка",
                        values: compareOffers.map((o) => o.shipping),
                        render: (o: Offer) => money(o.shipping),
                        best: true,
                      },
                      {
                        label: "Итого с доставкой",
                        values: compareOffers.map((o) => o.total),
                        render: (o: Offer) => money(o.total),
                        best: true,
                        total: true,
                      },
                      {
                        label: "Расстояние",
                        values: compareOffers.map((o) => o.distance),
                        render: (o: Offer) =>
                          o.distance
                            ? `${number(o.distance)} км`
                            : "В вашем городе",
                        best: false,
                      },
                      {
                        label: "Срок получения",
                        values: compareOffers.map((o) => o.days),
                        render: (o: Offer) => dayLabel(o.days),
                        best: true,
                      },
                    ].map((row) => (
                      <tr
                        key={row.label}
                        className={row.total ? "total-row" : ""}
                      >
                        <th scope="row">{row.label}</th>
                        {compareOffers.map((o, i) => (
                          <td
                            key={o.supplier.id}
                            className={`${o.supplier.id === recommended?.supplier.id ? "best-column" : ""} ${row.best && row.values[i] === Math.min(...row.values) && new Set(row.values).size > 1 ? "best-value" : ""}`}
                          >
                            {row.render(o)}
                            {row.best &&
                              row.values[i] === Math.min(...row.values) &&
                              new Set(row.values).size > 1 && (
                                <Icon name="check" size={14} />
                              )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">Условия оплаты</th>
                      {compareOffers.map((o) => (
                        <td
                          key={o.supplier.id}
                          className={`${o.supplier.id === recommended?.supplier.id ? "best-column" : ""} ${!o.paymentOk ? "warning-text" : ""}`}
                        >
                          {o.supplier.payments.map((p) => (
                            <span className="payment-line" key={p}>
                              {paymentLabels[p]}
                            </span>
                          ))}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Документы</th>
                      {compareOffers.map((o) => (
                        <td
                          key={o.supplier.id}
                          className={
                            o.supplier.id === recommended?.supplier.id
                              ? "best-column"
                              : ""
                          }
                        >
                          <span
                            className={`doc-table ${!o.supplier.docs ? "warning-text" : ""}`}
                          >
                            <Icon
                              name={o.supplier.docs ? "shield" : "info"}
                              size={16}
                            />
                            {o.supplier.docs
                              ? "Сведения указаны"
                              : "Нужно уточнить"}
                          </span>
                          <small>
                            {o.supplier.docs
                              ? "Декларация соответствия, спецификация"
                              : "В карточке нет сведений"}
                          </small>
                        </td>
                      ))}
                    </tr>
                    <tr className="table-choice-row">
                      <th scope="row">Следующий шаг</th>
                      {compareOffers.map((o) => (
                        <td
                          key={o.supplier.id}
                          className={
                            o.supplier.id === recommended?.supplier.id
                              ? "best-column"
                              : ""
                          }
                        >
                          <button
                            className={`btn ${o.supplier.id === recommended?.supplier.id ? "primary" : "secondary"}`}
                            onClick={() => setDrawer(o.supplier)}
                          >
                            {chosen === o.supplier.id
                              ? "Выбран · контакты"
                              : "Выбрать поставщика"}
                            <Icon name="arrow" size={16} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="comparison-key">
                <span>
                  <i />
                  Выгоднее среди выбранных
                </span>
                <span>
                  Выделение значения не означает соответствие всем условиям.
                </span>
              </div>
              {(() => {
                const candidate =
                  compareOffers.find(
                    (o) => o.supplier.id === recommended?.supplier.id,
                  ) ||
                  compareOffers
                    .filter((o) => o.suitable)
                    .sort((a, b) => ranked.indexOf(a) - ranked.indexOf(b))[0];
                return candidate ? (
                  <div className="why-card">
                    <span className="why-icon">
                      <Icon name="spark" size={24} />
                    </span>
                    <div>
                      <div className="eyebrow">ПО ВАШИМ ПАРАМЕТРАМ</div>
                      <h2>Почему стоит выбрать {candidate.supplier.name}</h2>
                      <p>{explain(candidate, request)}</p>
                      <small>
                        Рекомендация по простым правилам: соответствие запросу,
                        стоимость и срок. Без AI.
                      </small>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setDrawer(candidate.supplier)}
                    >
                      Посмотреть
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                ) : (
                  <div className="no-match">
                    <Icon name="info" />
                    <div>
                      <strong>Среди выбранных нет полного совпадения</strong>
                      <p>
                        Проверьте отличия в сроках, минимальной партии и оплате
                        или измените запрос.
                      </p>
                      <button className="text-button" onClick={edit}>
                        Изменить условия
                        <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  </div>
                );
              })()}
              <DemoNote>
                Это сравнение синтетических предложений. Все суммы рассчитаны на
                указанный объём с учётом минимальной партии.
              </DemoNote>
            </>
          )}
        </main>
      )}

      {selected.length > 0 && page === "results" && (
        <div className="compare-tray">
          <div className="tray-inner">
            <span className="tray-icon">
              <Icon name="scale" size={22} />
            </span>
            <div className="tray-label">
              <strong>Ваше сравнение</strong>
              <span>Выбрано {selected.length} из 3</span>
            </div>
            <div className="tray-items">
              {selected.map((id) => {
                const s = suppliers.find((s) => s.id === id)!;
                return (
                  <div className="tray-item" key={id}>
                    <Avatar s={s} small />
                    <span>{s.name}</span>
                    <button
                      aria-label={`Убрать ${s.name}`}
                      onClick={() => toggle(id)}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: 3 - selected.length }, (_, i) => (
                <span className="tray-placeholder" key={i}>
                  + Ещё вариант
                </span>
              ))}
            </div>
            <button
              className="btn primary"
              disabled={selected.length < 2}
              onClick={openCompare}
            >
              Сравнить {selected.length}
              <Icon name="arrow" size={18} />
            </button>
            <button
              className="icon-btn clear-tray"
              onClick={() => setSelected([])}
              aria-label="Очистить сравнение"
            >
              <Icon name="close" size={19} />
            </button>
          </div>
        </div>
      )}

      {drawer && (
        <Modal
          onClose={() => setDrawer(null)}
          label={`Поставщик ${drawer.name}`}
          className="drawer-overlay"
        >
          <SupplierDrawer
            supplier={drawer}
            offer={evaluate(drawer, request)}
            request={request}
            chosen={chosen === drawer.id}
            onChoose={() => {
              setChosen(drawer.id);
              setToast(
                "Поставщик выбран. Это локальный выбор — заявка не отправляется.",
              );
            }}
            onClose={() => setDrawer(null)}
            note={notes[drawer.id] || ""}
            onNote={(value) => writeNote(drawer.id, value)}
            isSelected={selected.includes(drawer.id)}
            onCompare={() => toggle(drawer.id)}
          />
        </Modal>
      )}
      {demo && (
        <Modal
          onClose={() => setDemo(null)}
          label={
            demo === "about"
              ? "О прототипе"
              : demo === "photo"
                ? "Поиск по фото — демо"
                : "Голосовой поиск — демо"
          }
        >
          <div className="demo-modal">
            <button
              className="icon-btn modal-close"
              onClick={() => setDemo(null)}
              aria-label="Закрыть"
            >
              <Icon name="close" />
            </button>
            {demo === "about" ? (
              <>
                <span className="demo-modal-icon">
                  <Icon name="box" size={30} />
                </span>
                <div className="eyebrow">SUPPLYMATCH · UX-ПРОТОТИП</div>
                <h2>
                  Путь от запроса
                  <br />
                  до выбора поставщика
                </h2>
                <p>
                  Здесь работают поиск по демокаталогу, фильтры, сортировка,
                  сравнение и заметки. Можно выбрать поставщика и открыть
                  демонстрационные контакты.
                </p>
                <div className="about-limitations">
                  <Icon name="info" size={19} />
                  <p>
                    10 вымышленных поставщиков. Все цены, контакты, документы и
                    источники синтетические. Нет backend, AI, распознавания
                    медиа и отправки заявок.
                  </p>
                </div>
                <button
                  className="btn primary full-width"
                  onClick={() => setDemo(null)}
                >
                  Всё понятно
                  <Icon name="check" size={18} />
                </button>
              </>
            ) : (
              <>
                <span className="demo-label">ДЕМОНСТРАЦИОННЫЙ СЦЕНАРИЙ</span>
                <h2>
                  {demo === "photo"
                    ? "Покажите, что ищете"
                    : "Расскажите о закупке"}
                </h2>
                <p>
                  {demo === "photo"
                    ? "В полноценном продукте здесь можно будет приложить фото товара. Сейчас покажем заранее подготовленный пример."
                    : "В полноценном продукте здесь можно будет записать голос. Сейчас покажем заранее подготовленный пример."}
                </p>
                {demo === "photo" ? (
                  <div className="photo-demo">
                    <div className="cheese-package">
                      <Icon name="cheese" size={56} />
                      <span>MOZZARELLA</span>
                      <small>ДЛЯ ПИЦЦЫ · 45% · 2 КГ</small>
                    </div>
                    <span className="demo-image-caption">
                      Иллюстрация демотовара
                    </span>
                  </div>
                ) : (
                  <div className="voice-demo">
                    <span className="voice-icon">
                      <Icon name="mic" size={25} />
                    </span>
                    <div className="voice-wave">
                      {Array.from({ length: 28 }, (_, i) => (
                        <i
                          key={i}
                          style={{ height: ((i * 13 + 7) % 31) + 8 + "px" }}
                        />
                      ))}
                    </div>
                    <span>Готовый пример</span>
                  </div>
                )}
                <div className="demo-recognition">
                  <span>
                    {demo === "photo"
                      ? "ПОДГОТОВЛЕННЫЙ РЕЗУЛЬТАТ"
                      : "ПОДГОТОВЛЕННЫЙ ТЕКСТ"}
                  </span>
                  <p>
                    «Мне нужно 200 кг моцареллы для пиццерии. Доставка в
                    Екатеринбург за 3 дня, отсрочка 30 дней».
                  </p>
                </div>
                <p className="demo-next-step">
                  Следующий шаг: заполните форму этим примером, проверьте
                  условия и нажмите «Найти поставщиков».
                </p>
                <DemoNote>
                  Медиа не загружаются, камера и микрофон не включаются.
                  Реального распознавания нет.
                </DemoNote>
                <button
                  className="btn primary full-width"
                  onClick={() => {
                    const inputSource = demo === "photo" ? "photo" : "voice";
                    setDemo(null);
                    scenario("dairy", inputSource);
                  }}
                >
                  Проверить интерпретацию
                  <Icon name="arrow" size={18} />
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="info" size={18} />
          <span>{toast}</span>
          <button
            className="icon-btn"
            aria-label="Скрыть уведомление"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </>
  );
}

function SupplierDrawer({
  supplier: s,
  offer: o,
  request: req,
  chosen,
  onChoose,
  onClose,
  note,
  onNote,
  isSelected,
  onCompare,
}: {
  supplier: Supplier;
  offer: Offer;
  request: Request;
  chosen: boolean;
  onChoose: () => void;
  onClose: () => void;
  note: string;
  onNote: (s: string) => void;
  isSelected: boolean;
  onCompare: () => void;
}) {
  return (
    <>
      <div className="drawer-top">
        <span>КАРТОЧКА ПОСТАВЩИКА</span>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Закрыть карточку"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="drawer-body">
        <div className="drawer-identity">
          <Avatar s={s} />
          <div>
            <h2>{s.name}</h2>
            <p>
              <Icon name="pin" size={14} />
              {s.city} ·{" "}
              {o.distance ? `${number(o.distance)} км` : "в вашем городе"}
            </p>
          </div>
        </div>
        <DemoNote>Вымышленная компания · синтетические данные</DemoNote>
        <p className="supplier-about">{s.about}</p>
        <div className="drawer-section">
          <h3>Ваша закупка</h3>
          <div className="drawer-product">
            <strong>{s.product}</strong>
            <span>{s.specs}</span>
          </div>
          <dl className="drawer-cost">
            <div>
              <dt>
                {number(o.quantity)} {req.unit} × {money(s.price)}
              </dt>
              <dd>{money(o.goods)}</dd>
            </div>
            <div>
              <dt>
                Доставка в{" "}
                {req.city === "Москва"
                  ? "Москву"
                  : req.city === "Казань"
                    ? "Казань"
                    : "Екатеринбург"}
              </dt>
              <dd>{money(o.shipping)}</dd>
            </div>
            <div className="drawer-total">
              <dt>Итого с доставкой</dt>
              <dd>{money(o.total)}</dd>
            </div>
          </dl>
          {o.quantity > req.quantity && (
            <p className="inline-warning">
              Расчёт на минимальную партию {number(o.quantity)} {req.unit}. В
              запросе — {number(req.quantity)} {req.unit}.
            </p>
          )}
          <div className={`drawer-match ${o.suitable ? "" : "warning"}`}>
            <Icon name={o.suitable ? "check" : "info"} size={18} />
            <p>{explain(o, req)}</p>
          </div>
        </div>
        <div className="drawer-section">
          <h3>Условия поставки</h3>
          <dl className="drawer-conditions">
            <div>
              <dt>
                <Icon name="box" size={16} />
                Минимальная партия
              </dt>
              <dd>
                {number(s.min)} {req.unit}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="truck" size={16} />
                Срок доставки
              </dt>
              <dd>{dayLabel(o.days)}</dd>
            </div>
            <div>
              <dt>
                <Icon name="pin" size={16} />
                Расстояние
              </dt>
              <dd>{number(o.distance)} км</dd>
            </div>
          </dl>
          <div className="drawer-subtitle">Варианты оплаты</div>
          <div className="payment-chips">
            {s.payments.map((p) => (
              <span
                className={p === req.payment ? "matching-payment" : ""}
                key={p}
              >
                {p === req.payment && <Icon name="check" size={12} />}{" "}
                {paymentLabels[p]}
              </span>
            ))}
          </div>
          <p className="drawer-microcopy">
            Отсрочка в демосценарии доступна всем покупателям. В реальном
            продукте условия требуют подтверждения.
          </p>
        </div>
        <div className="drawer-section">
          <h3>Ассортимент</h3>
          <div className="assortment">
            {s.assortment.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
          <p className="drawer-microcopy">
            В поиске рассчитывается только{" "}
            {categories[s.category].product.toLowerCase()}.
          </p>
        </div>
        <div className="drawer-section">
          <h3>Документы и источник</h3>
          <div className="document-box">
            <Icon name={s.docs ? "shield" : "info"} size={22} />
            <div>
              <strong>
                {s.docs
                  ? "Сведения о документах указаны"
                  : "Сведения о документах отсутствуют"}
              </strong>
              <p>
                {s.docs
                  ? "Декларация соответствия и спецификация товара. Демонстрационные записи, файлов нет."
                  : "Наличие декларации и спецификации нужно уточнить у поставщика."}
              </p>
            </div>
          </div>
          <div className="source-line">
            <Icon name="file" size={15} />
            <span>
              {s.source}. Создано для прототипа; внешнего источника нет.
            </span>
          </div>
        </div>
        {chosen && (
          <div className="chosen-confirmation" role="status">
            <Icon name="check" size={22} />
            <div>
              <strong>Выбор сделан. Вот следующий шаг.</strong>
              <p>
                В будущем здесь вы запросите подтверждение цены, наличия и
                отсрочки. Сейчас сохраните вопросы в заметке ниже. Контакты
                вымышлены, заявка не отправляется.
              </p>
            </div>
          </div>
        )}
        <div
          id="supplier-contacts"
          className="drawer-section contacts-section"
          tabIndex={-1}
        >
          <h3>
            Контакты <span>ДЕМО</span>
          </h3>
          <p>Вымышленные данные — не используйте для связи.</p>
          <div className="contact-line">
            <Icon name="phone" size={18} />
            <div>
              <small>Телефон отдела продаж</small>
              <strong>
                +7 (000) 000-00-
                {String(suppliers.indexOf(s) + 1).padStart(2, "0")}
              </strong>
            </div>
          </div>
          <div className="contact-line">
            <Icon name="mail" size={18} />
            <div>
              <small>Электронная почта</small>
              <strong>sales@{s.id}.example</strong>
            </div>
          </div>
        </div>
        <div className="drawer-section note-section">
          <label htmlFor="supplier-note">
            <Icon name="note" size={18} />
            <strong>Моя заметка</strong>
          </label>
          <textarea
            id="supplier-note"
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Что уточнить перед закупкой?"
            rows={3}
            maxLength={1000}
          />
          <small>Сохраняется автоматически в этом браузере.</small>
        </div>
      </div>
      <div className="drawer-footer">
        <button
          className={`btn ${chosen ? "chosen-button" : "primary"}`}
          onClick={() => {
            onChoose();
            requestAnimationFrame(() => {
              document
                .getElementById("supplier-contacts")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
              document
                .getElementById("supplier-contacts")
                ?.focus({ preventScroll: true });
            });
          }}
          disabled={chosen}
        >
          {chosen ? (
            <>
              <Icon name="check" size={18} />
              Поставщик выбран
            </>
          ) : (
            <>
              Выбрать и посмотреть контакты
              <Icon name="arrow" size={18} />
            </>
          )}
        </button>
        <button
          className={`compare-button ${isSelected ? "checked" : ""}`}
          onClick={onCompare}
          aria-pressed={isSelected}
        >
          <Icon name={isSelected ? "check" : "scale"} size={18} />
          {isSelected ? "В сравнении" : "Сравнить"}
        </button>
        <span>Заявка не отправляется. Только локальный выбор.</span>
      </div>
    </>
  );
}
