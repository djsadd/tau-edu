/** Линейный рисунок фасада с колоннадой. Заменяется фотографией через настройки сайта. */
export function HeroArt() {
  const columns = Array.from({ length: 13 }, (_, i) => 330 + i * 88);
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 720" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#33000d" />
          <stop offset="1" stopColor="#800020" />
        </linearGradient>
      </defs>
      <rect width="1440" height="720" fill="url(#hero-bg)" />
      <g fill="none" stroke="#fff" strokeOpacity="0.34" strokeWidth="1.25">
        <path d="M858 70 1440 232H276Z" />
        <path d="M858 100 1345 224H371Z" strokeOpacity="0.16" />
        <circle cx="858" cy="168" r="30" />
        <circle cx="858" cy="168" r="20" strokeOpacity="0.16" />
        <path d="M280 232h1160M280 252h1160M296 272h1144" />
        {columns.map((x) => (
          <g key={x}>
            <path d={`M${x - 26} 272h52l-6 16h-40Z`} />
            <path d={`M${x - 20} 288v304M${x + 20} 288v304`} />
            <path d={`M${x - 10} 288v304M${x} 288v304M${x + 10} 288v304`} strokeOpacity="0.13" />
            <path d={`M${x - 26} 608h52l-6-16h-40Z`} />
          </g>
        ))}
        <path d="M270 608h1170M240 634h1200M210 660h1230M180 686h1260" />
      </g>
    </svg>
  );
}
