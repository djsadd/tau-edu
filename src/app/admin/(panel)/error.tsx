"use client";

export default function PanelError({ reset }: { reset: () => void }) {
  return (
    <div className="border border-line bg-white px-6 py-12 text-center">
      <h1 className="text-2xl text-burgundy-950">Раздел временно недоступен</h1>
      <p className="mt-2 text-muted">Сервис этого раздела не отвечает. Остальные разделы панели продолжают работать.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-5">Повторить</button>
    </div>
  );
}
