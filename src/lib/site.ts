/**
 * Единый источник правды по NAP (Name / Address / Phone).
 *
 * ВАЖНО: значения, помеченные `TODO`, — заглушки. Данные отсюда попадают
 * в JSON-LD, футер, страницу «Контакты» и виджеты карт. Когда появятся
 * реальные данные, менять их нужно ТОЛЬКО здесь — тогда название, адрес и
 * телефон на сайте, в Яндекс.Бизнесе и в 2ГИС останутся идентичными
 * (NAP-консистентность — обязательное условие для локального поиска).
 */

export const site = {
  /** Название бренда — должно совпадать с Яндекс.Бизнес и 2ГИС символ в символ. */
  name: "J.Lash",

  /** Адрес сайта. TODO: заменить на купленный домен после его регистрации. */
  url: "https://jlash.netlify.app",

  /** TODO: реальный номер телефона (в двух форматах). */
  phone: {
    display: "+7 (700) 000-00-00",
    href: "+77000000000",
  },

  /** TODO: реальные аккаунты. */
  whatsapp: "77000000000",
  telegram: "jlash_esik",
  instagram: "jlash.esik",
  email: "hello@jlash.kz",

  address: {
    /** TODO: улица, дом, ориентир. */
    street: "ул. Уточняется, 0",
    city: "Есик",
    region: "Алматинская область",
    postalCode: "040400",
    country: "KZ",
  },

  /** TODO: точные координаты салона (нужны для геометки и JSON-LD). */
  geo: {
    latitude: 43.3553,
    longitude: 77.4531,
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

/** Ссылки на карточки в картографических сервисах. TODO: заменить на прямые ссылки на карточку. */
export const mapLinks = {
  yandex: "https://yandex.kz/maps/?text=J.Lash%20%D0%95%D1%81%D0%B8%D0%BA",
  twogis: "https://2gis.kz/almaty/search/J.Lash%20%D0%95%D1%81%D0%B8%D0%BA",
};

/** Встраиваемые виджеты карт. TODO: заменить на URL виджета с реальной меткой. */
export const mapEmbeds = {
  yandex:
    "https://yandex.kz/map-widget/v1/?ll=77.4531%2C43.3553&z=14&text=J.Lash%20%D0%95%D1%81%D0%B8%D0%BA",
  twogis: "https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A43.3553%2C%22lon%22%3A77.4531%2C%22zoom%22%3A14%7D%7D",
};
