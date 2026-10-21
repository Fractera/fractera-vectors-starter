// СОЦСЕТИ ПРОЕКТА (шаг 299-5): тип записи, сборка адреса и чтение списка — перенесены из config/app-config.defaults.ts
// FNS как есть; редактор — `components/settings/socials-field.client.tsx` (классический, без ИИ — слово владельца 2026-09-25).

export interface SocialLink {
  /** Вечный идентификатор записи: на нём держатся порядок и значок. */
  id: string;
  /** Каноническое имя сети — «Telegram», «X», «LinkedIn». Его предлагает модель. */
  name: string;
  /**
   * Правило сборки адреса: `https://t.me/{value}`.
   *
   * Плейсхолдера нет — значит `urlTemplate` уже полный адрес, и `value` не участвует.
   * Так выражается сеть, у которой нет предсказуемой формы профиля.
   */
  urlTemplate: string;
  /** То, что ввёл владелец: псевдоним, номер, полный адрес. */
  value: string;
  /**
   * Значок, ПОЛОЖЕННЫЙ В ПРОЕКТ (`/api/media/<id>/file`), а не ссылка на чужой хост:
   * страница обязана работать офлайн. Значка может не быть — это законное состояние.
   */
  icon?: string;
}

export interface SocialConfig {
  twitter?: string;
  github?: string;
  linkedin?: string;
  facebook?: string;
}

// `encodeURIComponent` ломает номера телефонов (`+` → `%2B`): `+` и `@` оставляются как есть (FNS, 2026-08-21).
function encodeValue(v: string): string {
  return encodeURIComponent(v).replace(/%2B/g, "+").replace(/%40/g, "@");
}

/** Готовый адрес записи: правило плюс значение. */
export function socialHref(link: SocialLink): string {
  const v = link.value.trim().replace(/^@/, "");
  if (!link.urlTemplate.includes("{value}")) return link.urlTemplate;
  return link.urlTemplate.replace("{value}", encodeValue(v));
}

/**
 * Список сетей для показа — ЕДИНСТВЕННОЕ место, где решается, что показывать.
 *
 * 🔒 СТАРЫЕ КЛЮЧИ ЧИТАЮТСЯ ДОСЛОВНО, ВКЛЮЧАЯ ИХ СТРАННОСТИ. У LinkedIn здесь
 * `/company/`, хотя для личного профиля это неверно. Исправить правило ЗАДНИМ
 * ЧИСЛОМ нельзя: на работающих серверах в конфиге лежит значение, собранное под
 * это правило, и смена шаблона молча увела бы живую ссылку в другое место.
 * Новые записи получают правило от модели и этой странности не наследуют.
 */
export function resolveSocialLinks(seo: { social?: SocialConfig; socialLinks?: SocialLink[] } | undefined): SocialLink[] {
  if (!seo) return [];
  // 🔒 «ВЕТКИ НЕТ» И «ВЕТКА ПУСТА» — РАЗНЫЕ СОСТОЯНИЯ (шаг 523, тот же закон, по
  // которому живут меню подвала). Здесь стояло `socialLinks?.length`, и пустой
  // список читался как «владелец конструктора не открывал»: убрав из панели все
  // записи, он получал обратно четыре унаследованные ссылки. Решение человека
  // «сетей у меня нет» молча отменялось.
  if (Array.isArray(seo.socialLinks)) return seo.socialLinks;
  const s = seo.social;
  if (!s) return [];
  const out: SocialLink[] = [];
  const legacy = (id: string, name: string, value: string | undefined, template: string) => {
    if (!value) return;
    out.push({
      id,
      name,
      value,
      urlTemplate: value.startsWith("http") ? value : template,
      icon: undefined,
    });
  };
  legacy("github", "GitHub", s.github, "https://github.com/{value}");
  legacy("twitter", "X", s.twitter, "https://twitter.com/{value}");
  legacy("linkedin", "LinkedIn", s.linkedin, "https://linkedin.com/company/{value}");
  legacy("facebook", "Facebook", s.facebook, "https://facebook.com/{value}");
  return out;
}
