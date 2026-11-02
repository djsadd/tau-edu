import { fileUrl } from "@/lib/text";

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SHADES = [
  ["#560016", "#800020"],
  ["#33000d", "#6b001b"],
  ["#6b001b", "#96304e"],
  ["#800020", "#560016"],
];

/** Обложка: загруженное изображение или фирменный орнамент, если фото ещё нет. */
export function Cover({
  imageId,
  seed,
  alt = "",
  className = "",
  priority = false,
}: {
  imageId?: string | null;
  seed: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const url = fileUrl(imageId);
  if (url) {
    return (
      // Файлы отдаёт свой обработчик с проверкой доступа, поэтому оптимизатор next/image не используется.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} loading={priority ? "eager" : "lazy"} className={`h-full w-full object-cover ${className}`} />
    );
  }
  const h = hash(seed);
  const [from, to] = SHADES[h % SHADES.length];
  const variant = (h >> 3) % 4;
  const uid = `c${h.toString(36)}`;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${uid})`} />
      <g fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1">
        {variant === 0 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${i * 72 + 8} 240V120a32 32 0 0 1 64 0v120`} />
          ))}
        {variant === 1 &&
          [40, 80, 120, 160, 200, 240, 280].map((r) => <circle key={r} cx={(h % 300) + 50} cy="240" r={r} />)}
        {variant === 2 &&
          [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${i * 60 - 40} 240 L${i * 60 + 80} 0`} />
          ))}
        {variant === 3 && (
          <>
            <path d="M60 96 200 28l140 68Z" />
            <path d="M60 104h280" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M${84 + i * 46} 112v96m12-96v96`} />
            ))}
            <path d="M48 216h304M36 228h328" />
          </>
        )}
      </g>
    </svg>
  );
}

export function Avatar({ imageId, name, className = "h-20 w-20 text-xl" }: { imageId?: string | null; name: string; className?: string }) {
  const url = fileUrl(imageId);
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-burgundy-100 font-serif font-semibold text-burgundy-800 ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{letters}</span>
      )}
    </span>
  );
}
