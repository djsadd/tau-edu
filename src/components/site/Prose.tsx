/** HTML уже очищен на сервере при сохранении (lib/sanitize.ts). */
export function Prose({ html, className = "" }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`prose prose-site prose-headings:font-serif prose-headings:text-burgundy-950 prose-a:text-burgundy-700 prose-strong:text-ink prose-blockquote:border-burgundy-700 prose-li:marker:text-burgundy-700 text-ink ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
