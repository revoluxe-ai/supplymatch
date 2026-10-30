export type Category = "dairy" | "flour" | "packaging";
export type City = "Екатеринбург" | "Казань" | "Москва";
export type Payment =
  | "any"
  | "prepay"
  | "partial"
  | "arrival"
  | "defer14"
  | "defer30";
export type Priority = "balance" | "price" | "speed";
export interface Request {
  query: string;
  category: Category;
  city: City;
  quantity: number;
  days: number;
  unit: "кг" | "шт";
  payment: Payment;
  budget: number | null;
  priority: Priority;
  specification?: string;
}
export interface Supplier {
  id: string;
  name: string;
  initials: string;
  color: string;
  city: City;
  category: Category;
  product: string;
  specs: string;
  price: number;
  min: number;
  localShipping: number;
  delivery: Record<City, number>;
  payments: Payment[];
  docs: boolean;
  about: string;
  assortment: string[];
  source: string;
}
export const cities: City[] = ["Екатеринбург", "Казань", "Москва"];
export const categories: Record<
  Category,
  {
    name: string;
    product: string;
    unit: "кг" | "шт";
    query: string;
    quantity: number;
  }
> = {
  dairy: {
    name: "Молочные продукты",
    product: "Моцарелла для пиццы",
    unit: "кг",
    query:
      "200 кг моцареллы для пиццерии. Доставка в Екатеринбург за 3 дня, отсрочка 30 дней",
    quantity: 200,
  },
  flour: {
    name: "Мука и ингредиенты",
    product: "Мука пшеничная",
    unit: "кг",
    query: "500 кг пшеничной муки. Доставка в Казань за 3 дня",
    quantity: 500,
  },
  packaging: {
    name: "Пищевая упаковка",
    product: "Коробки для пиццы 32 см",
    unit: "шт",
    query: "1000 коробок для пиццы 32 см. Доставка в Москву за 3 дня",
    quantity: 1000,
  },
};
export const standardSpecs: Record<Category, string> = {
  dairy: "45% · брусок 2 кг · охлаждённая",
  flour: "Белок 12% · мешок 25 кг · ГОСТ",
  packaging: "320 × 320 × 40 мм · крафт · без печати",
};
export const paymentLabels: Record<Payment, string> = {
  any: "Любые условия",
  prepay: "100% предоплата",
  partial: "Предоплата 50%",
  arrival: "По факту получения",
  defer14: "Отсрочка 14 дней",
  defer30: "Отсрочка 30 дней",
};
export const initialRequest: Request = {
  query: "",
  category: "dairy",
  city: "Екатеринбург",
  quantity: 200,
  days: 3,
  unit: "кг",
  payment: "defer30",
  budget: null,
  priority: "balance",
};
export const suppliers: Supplier[] = [
  {
    id: "ural",
    name: "УралМолоко",
    initials: "УМ",
    color: "sage",
    city: "Екатеринбург",
    category: "dairy",
    product: "Моцарелла для пиццы",
    specs: "45% · брусок 2 кг · охлаждённая",
    price: 460,
    min: 100,
    localShipping: 1800,
    delivery: { Екатеринбург: 2, Казань: 3, Москва: 4 },
    payments: ["prepay", "partial", "arrival", "defer14", "defer30"],
    docs: true,
    about:
      "Региональный поставщик молочных продуктов для пиццерий и ресторанов. Отгрузка со склада дважды в неделю.",
    assortment: ["Моцарелла 45%", "Сливки 33%", "Сыр творожный"],
    source: "Синтетический прайс-лист «УралМолоко», версия 1",
  },
  {
    id: "city",
    name: "Город Сыра",
    initials: "ГС",
    color: "peach",
    city: "Екатеринбург",
    category: "dairy",
    product: "Моцарелла для пиццы",
    specs: "45% · брусок 2 кг · охлаждённая",
    price: 495,
    min: 50,
    localShipping: 1200,
    delivery: { Екатеринбург: 1, Казань: 2, Москва: 3 },
    payments: ["prepay", "arrival", "defer30"],
    docs: true,
    about:
      "Оптовый склад сыров с ежедневной отгрузкой. Собственная городская доставка в термокузовах.",
    assortment: ["Моцарелла 45%", "Пармезан", "Сыр для бургеров"],
    source: "Синтетическая карточка «Город Сыра», версия 1",
  },
  {
    id: "volga",
    name: "Волжская сыроварня",
    initials: "ВС",
    color: "lavender",
    city: "Казань",
    category: "dairy",
    product: "Моцарелла для пиццы",
    specs: "45% · брусок 2 кг · охлаждённая",
    price: 410,
    min: 100,
    localShipping: 1600,
    delivery: { Екатеринбург: 5, Казань: 2, Москва: 4 },
    payments: ["prepay", "defer14", "defer30"],
    docs: true,
    about:
      "Производитель сыров для HoReCa. Низкая отпускная цена, межгород отправляется по расписанию.",
    assortment: ["Моцарелла 45%", "Сулугуни", "Рассольные сыры"],
    source: "Синтетический прайс-лист «Волжская сыроварня», версия 1",
  },
  {
    id: "food",
    name: "ФудЛайн Опт",
    initials: "ФЛ",
    color: "blue",
    city: "Москва",
    category: "dairy",
    product: "Моцарелла для пиццы",
    specs: "45% · брусок 2 кг · охлаждённая",
    price: 435,
    min: 500,
    localShipping: 2200,
    delivery: { Екатеринбург: 3, Казань: 2, Москва: 1 },
    payments: ["prepay", "partial", "defer30"],
    docs: true,
    about:
      "Дистрибьютор с крупнооптовыми партиями. Межгород — через ежедневный логистический маршрут.",
    assortment: [
      "Моцарелла 45%",
      "Сливочное масло",
      "Молоко ультрапастеризованное",
    ],
    source: "Синтетические условия «ФудЛайн Опт», версия 1",
  },
  {
    id: "fresh",
    name: "Свежий круг",
    initials: "СК",
    color: "mint",
    city: "Екатеринбург",
    category: "dairy",
    product: "Моцарелла для пиццы",
    specs: "45% · брусок 2 кг · охлаждённая",
    price: 445,
    min: 100,
    localShipping: 1500,
    delivery: { Екатеринбург: 2, Казань: 3, Москва: 4 },
    payments: ["prepay", "partial"],
    docs: true,
    about:
      "Локальный поставщик для небольших ресторанов. Отгрузка после оплаты, доставка с соблюдением холодовой цепи.",
    assortment: ["Моцарелла 45%", "Молоко 3,2%", "Сметана 20%"],
    source: "Синтетический прайс-лист «Свежий круг», версия 1",
  },
  {
    id: "milk",
    name: "Молочная артель",
    initials: "МА",
    color: "sand",
    city: "Казань",
    category: "dairy",
    product: "Моцарелла для пиццы",
    specs: "45% · брусок 2 кг · охлаждённая",
    price: 470,
    min: 100,
    localShipping: 1800,
    delivery: { Екатеринбург: 3, Казань: 1, Москва: 3 },
    payments: ["prepay", "arrival", "defer30"],
    docs: false,
    about:
      "Небольшой оптовый поставщик. Сведения о сертификатах в демонстрационной карточке отсутствуют и требуют уточнения.",
    assortment: ["Моцарелла 45%", "Сыр полутвёрдый"],
    source: "Синтетическая анкета «Молочная артель», версия 1",
  },
  {
    id: "mill",
    name: "Мельница Поволжья",
    initials: "МП",
    color: "sand",
    city: "Казань",
    category: "flour",
    product: "Мука пшеничная высший сорт",
    specs: "Белок 12% · мешок 25 кг · ГОСТ",
    price: 48,
    min: 250,
    localShipping: 1400,
    delivery: { Екатеринбург: 4, Казань: 1, Москва: 3 },
    payments: ["prepay", "partial", "defer14"],
    docs: true,
    about:
      "Мука для профессиональной выпечки. Партии от 10 мешков, регулярные отгрузки со склада.",
    assortment: ["Мука высший сорт", "Мука для пиццы", "Смеси для выпечки"],
    source: "Синтетический прайс-лист «Мельница Поволжья», версия 1",
  },
  {
    id: "baker",
    name: "Пекарь Профи",
    initials: "ПП",
    color: "peach",
    city: "Москва",
    category: "flour",
    product: "Мука пшеничная высший сорт",
    specs: "Белок 12% · мешок 25 кг · ГОСТ",
    price: 44,
    min: 500,
    localShipping: 1900,
    delivery: { Екатеринбург: 4, Казань: 3, Москва: 1 },
    payments: ["prepay", "defer14", "defer30"],
    docs: true,
    about:
      "Ингредиенты для пекарен и пиццерий. Крупные партии, сборные маршруты в регионы.",
    assortment: ["Мука высший сорт", "Дрожжи", "Пекарские смеси"],
    source: "Синтетическая карточка «Пекарь Профи», версия 1",
  },
  {
    id: "pack",
    name: "Контур Пак",
    initials: "КП",
    color: "lavender",
    city: "Москва",
    category: "packaging",
    product: "Коробка для пиццы 32 см",
    specs: "320 × 320 × 40 мм · крафт · без печати",
    price: 18,
    min: 500,
    localShipping: 900,
    delivery: { Екатеринбург: 4, Казань: 3, Москва: 1 },
    payments: ["prepay", "partial", "arrival", "defer30"],
    docs: true,
    about:
      "Пищевая упаковка из гофрокартона. Коробки в плоском виде, упаковки по 100 штук.",
    assortment: ["Коробки 32 см", "Коробки 40 см", "Контейнеры крафт"],
    source: "Синтетический прайс-лист «Контур Пак», версия 1",
  },
  {
    id: "eco",
    name: "ЭкоФорма",
    initials: "ЭФ",
    color: "sage",
    city: "Екатеринбург",
    category: "packaging",
    product: "Коробка для пиццы 32 см",
    specs: "320 × 320 × 40 мм · крафт · без печати",
    price: 15,
    min: 1000,
    localShipping: 1100,
    delivery: { Екатеринбург: 2, Казань: 3, Москва: 4 },
    payments: ["prepay", "partial"],
    docs: true,
    about:
      "Производитель стандартной упаковки. Доступная цена при заказе от тысячи коробок.",
    assortment: ["Коробки 32 см", "Бумажные пакеты", "Подложки"],
    source: "Синтетическая карточка «ЭкоФорма», версия 1",
  },
];
