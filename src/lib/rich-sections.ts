export type RichSection = { id: string; title: string; html: string };

const CARD_TEXT_LIMIT = 900;

const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function unescapeText(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Подзаголовки с коротким текстом становятся карточками, длинный текст и таблицы идут сплошным потоком. */
function groupCards(html: string) {
  const [lead, ...groups] = html.split(/(?=<h3[ >])/);
  if (groups.length < 2) return html;
  const fits = groups.every((group) => !group.includes("<table") && plainText(group).length <= CARD_TEXT_LIMIT);
  if (!fits) return html;
  return `${lead}<div class="rich-cards">${groups.map((group) => `<div class="rich-card">${group}</div>`).join("")}</div>`;
}

function decorate(html: string) {
  return html
    .replace(/<table[\s\S]*?<\/table>/g, (table) => `<div class="rich-table">${table}</div>`)
    .replace(/(?:(?:<p>\s*)?<img [^>]*>(?:\s*<\/p>)?\s*){2,}/g, (run) => `<div class="rich-gallery">${run.replace(/<\/?p>/g, "")}</div>`)
    .replace(/<img /g, '<img loading="lazy" ');
}

/**
 * Раскладывает HTML страницы на вступление и разделы по заголовкам h2.
 * Оформление строится из обычной разметки редактора, поэтому его не нужно задавать вручную.
 * HTML уже очищен при сохранении (lib/sanitize.ts).
 */
export function splitRichSections(html: string) {
  const [first, ...rest] = html.split(/(?=<h2[ >])/);
  const hasIntro = !first.startsWith("<h2");
  const parts = hasIntro ? rest : [first, ...rest];
  const sections: RichSection[] = parts.map((part, i) => {
    const heading = part.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/);
    return {
      id: `section-${i + 1}`,
      title: unescapeText(plainText(heading?.[1] ?? "")),
      html: decorate(groupCards(part)),
    };
  });
  return { intro: hasIntro ? decorate(first) : "", sections };
}
