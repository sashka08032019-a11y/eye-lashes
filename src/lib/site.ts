/**
 * Единый источник правды по NAP (Name / Address / Phone).
 *
 * ВАЖНО: значения, помеченные `TODO`, — заглушки. Данные отсюда попадают
 * в JSON-LD, футер, страницу «Контакты» и виджеты карт. Когда появятся
 * реальные данные, менять их нужно ТОЛЬКО здесь — тогда название, адрес и
 * телефон на сайте, в Яндекс.Бизнесе и в 2ГИС останутся идентичными
 * (NAP-консистентность — обязательное условие для локального поиска).
 */

const DEFAULT_SITE_URL = "https://juliashik.netlify.app";

/**
 * Адрес сайта. На продакшене задаётся переменной окружения NEXT_PUBLIC_SITE_URL
 * (см. .env.example), иначе берётся домен по умолчанию.
 *
 * Это критично для превью ссылок: canonical, OG/Twitter-теги и og:image должны
 * быть абсолютными и указывать на реальный домен — иначе WhatsApp присылает
 * боту ссылку на картинку, которой по этому адресу нет, и превью не строится.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const site = {
  /** Название бренда — должно совпадать с Яндекс.Бизнес и 2ГИС символ в символ. */
  name: "Julia shik",

  /** Адрес сайта: env NEXT_PUBLIC_SITE_URL или домен по умолчанию. */
  url: resolveSiteUrl(),

  /** Телефон салона (в двух форматах: для показа и для href/tel). */
  phone: {
    display: "+7 747 237 5202",
    href: "+77472375202",
  },

  /** WhatsApp привязан к тому же номеру телефона. */
  whatsapp: "77472375202",
  telegram: "juliashik_esik",
  instagram: "juliashik.esik",
  email: "hello@juliashik.kz",

  /**
   * Адрес локализован: в русской версии — «Улица Абая, 78», в казахской —
   * «Абай көшесі, 78». Город и область тоже различаются написанием.
   * Для JSON-LD берётся поле нужной локали (см. lib/jsonld.ts).
   */
  address: {
    street: {
      ru: "Улица Абая, 78",
      kk: "Абай көшесі, 78",
    },
    city: {
      ru: "Есик",
      kk: "Есік",
    },
    region: {
      ru: "Алматинская область",
      kk: "Алматы облысы",
    },
    postalCode: "040400",
    country: "KZ",
  },

  /** Точные координаты салона (нужны для геометки и JSON-LD). */
  geo: {
    latitude: 43.34888,
    longitude: 77.470706,
  },

  /**
   * Коды подтверждения прав на сайт. Пустая строка = тег не выводится.
   * TODO: получить коды после регистрации в Яндекс.Вебмастере
   * (yandex) и Google Search Console (google) и вставить сюда —
   * метатеги подставятся автоматически.
   */
  verification: {
    yandex: "",
    google: "",
  },

  /** TODO: график работы. Формат schema.org OpeningHoursSpecification. */
  openingHours: {
    /** Для JSON-LD. */
    spec: [
      {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    /** Человекочитаемое представление для интерфейса. */
    display: { ru: "Ежедневно 09:00 – 20:00", kk: "Күн сайын 09:00 – 20:00" },
  },
} as const;

/** Ссылки на мессенджеры с предзаполненным текстом сообщения. */
export function messengerLinks(locale: "ru" | "kk") {
  const text =
    locale === "kk"
      ? `Сәлеметсіз бе! ${site.name} сайтынан жазып отырмын, кірпік ұзартуға жазылғым келеді.`
      : `Здравствуйте! Пишу с сайта ${site.name}, хочу записаться на наращивание ресниц.`;

  const encoded = encodeURIComponent(text);

  return {
    whatsapp: `https://wa.me/${site.whatsapp}?text=${encoded}`,
    telegram: `https://t.me/${site.telegram}?text=${encoded}`,
    instagram: `https://instagram.com/${site.instagram}`,
    phone: `tel:${site.phone.href}`,
    email: `mailto:${site.email}`,
  };
}

/**
 * Ссылки на карточку салона в картографических сервисах.
 * Оставлен только 2ГИС — сюда же ведёт кнопка «Маршрут в 2ГИС».
 */
export const mapLinks = {
  twogis:
    "https://2gis.kz/almaty/branches/9429948591096044/geo/70030076246913049/77.470706%2C43.34888?m=77.470539%2C43.348823%2F20%2Fp%2F45",
};

/** Встраиваемый виджет 2ГИС с меткой салона (только 2ГИС, других карт нет). */
export const mapEmbeds = {
  twogis:
    "https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A43.34888%2C%22lon%22%3A77.470706%2C%22zoom%22%3A17%7D%2C%22opt%22%3A%7B%22city%22%3A%22almaty%22%7D%7D",
};

/**
 * Полная строка адреса для конкретной локали — используется в футере,
 * карточках контактов и на странице «Мы на карте». Держим рядом с NAP,
 * чтобы формат совпадал везде.
 */
export function addressLine(locale: "ru" | "kk") {
  return `${site.address.street[locale]}, ${site.address.city[locale]}, ${site.address.region[locale]}`;
}
