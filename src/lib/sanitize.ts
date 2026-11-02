import sanitize from "sanitize-html";

/** Всё, что редактор сохраняет в базу, проходит через этот фильтр. */
export function sanitizeRich(html: string) {
  return sanitize(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
      "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
