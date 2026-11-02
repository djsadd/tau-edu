/** Адреса старого сайта tau-edu.kz и их новые места. Покрывают только пункты старого меню. */

/** Новый адрес → страницы старого сайта вида /content/<slug>. */
const CONTENT_MOVES: Record<string, string[]> = {
  "/admission": [
    "postuplenie-2026-2027",
    "podgotovka-k-vstupitelnym-ekzamenam-doktorantury",
    "porogovye-bally-magistratura-na-2025-2026g",
    "threshold-points-for-2025-2026",
    "olimpiady-skolnikov",
    "kak-podpisat-dogovor-na-obucenie",
  ],
  "/admission/tuition-grants": ["stoimost-obucenia", "gosudarstvennye-stipendii-respubliki-kazahstan", "granty-universiteta-turan-astana"],
  "/admission/why-tau": ["buklet-dla-abiturienta"],
  "/admission/dormitory": ["obsezitie-universiteta"],
  "/admission/contacts": ["kontakty-priemnoj-komissii", "virtualnaa-priemnaa-komissia-2"],
  "/degrees/mba": ["mba-2"],
  "/education/additional": ["dopolnitelnye-obrazovatelnye-programmy-2"],
  "/programs": ["obrazovatelnye-programmy"],
  "/faculties": ["vyssaa-skola-biznesa-i-cifrovyh-tehnologij"],
  "/science/activity": ["napravlenia-naucnoj-deatelnosti", "naucno-metodiceskij-komitet"],
  "/science/centers": ["naucnye-centry-i-laboratorii"],
  "/science/publications": ["naucnye-izdania", "publikacii-pps"],
  "/science/young-scientists": ["molodym-ucenym", "naucno-issledovatelskaa-rabota-studentov"],
  "/science/events": ["naucnye-meropriatia"],
  "/innohub": ["tau-innohub-vypolnaet-funkcii-ekosistemy-i-predostavlaet-unikalnye-vozmoznosti-dla-realizacii-startapov-i-innovacionnyh-proektov", "uslugi"],
  "/students/calendar": ["akademiceskij-kalendar", "grafiki-raspisania"],
  "/students/handbook": [
    "spravocnik-putevoditel",
    "kodeks-akademiceskoj-cestnosti",
    "pravila-perevoda-otcislenia-i-vosstanovlenia",
    "letnij-semestr",
    "informacia-dla-obladatelej-gosgranta-2",
    "kontakty-kuratorov",
  ],
  "/students/library": ["elektronnye-biblioteki"],
  "/students/campus": ["medical-center", "inkluzivnoe-obrazovanie", "materialno-tehniceskaa-baza-2"],
  "/students/alumni": ["vypusknomu-kursu", "vakansii-dla-vypusknikov", "soobsestvo-vypusknikov"],
  "/student-organizations": ["debatnyj-klub-2", "kluby-po-interesam"],
  "/about": ["missia-i-videnie-tau2-2", "strategia-razvitia-universiteta-2025-2029-2"],
  "/about/councils": ["popecitelskij-sovet", "ucenyj-sovet"],
  "/about/sustainability": ["realizacia-celej-ustojcivogo-razvitia-v-universitete-turan-astana"],
  "/offices": ["struktura-tau", "departament-upravlenia-finansami"],
  "/international": [
    "mezdunarodnoe-sotrudnicestvo",
    "proekty-erasmus",
    "mezdunarodnye-stipendii",
    "akademiceskaa-mobilnost-studentov-tau",
    "tau-internationalization-strategy-2024-2029",
    "akademiceskoe-sotrudnicestvo",
  ],
  "/documents": ["normativnye-dokumenty-respubliki-kazahstan", "normativnye-dokumenty-universiteta", "akkreditacia-i-rejtingi", "otcetnost-tau"],
  "/contacts": ["kak-nas-najti"],
  "/situation-center": ["situacionnyj-centr"],
};

/** Порядок важен: срабатывает первое совпадение, поэтому общие /department и /chair стоят в конце. */
const PATH_MOVES: [string, string][] = [
  ["/entrants", "/admission/why-tau"],
  ["/faculty/bakalavriat", "/degrees/bachelor"],
  ["/faculty/magistratura", "/degrees/master"],
  ["/faculty/doktorantura-phd", "/degrees/doctorate"],
  ["/management", "/leadership"],
  ["/vacancy", "/vacancies"],
  ["/blog/rector", "/rector-blog"],
  ["/department/departament-nauki-i-innovacij", "/science/activity"],
  ["/department/higher-school-of-law-and-humanities", "/faculties"],
  ["/department/psychological-service", "/students/campus"],
  ["/department/:slug*", "/offices"],
  ["/chair/:slug*", "/departments"],
];

/** Старые адреса, у которых страницу определяет параметр запроса. */
const QUERY_MOVES: { source: string; key: string; value: string; destination: string }[] = [
  { source: "/op/front/category", key: "slug", value: "bachelor", destination: "/degrees/bachelor" },
  { source: "/op/front/category", key: "slug", value: "master", destination: "/degrees/master" },
  { source: "/op/front/category", key: "slug", value: "phd", destination: "/degrees/doctorate" },
  { source: "/op/front/category", key: "slug", value: "mba", destination: "/degrees/mba" },
  { source: "/news/front/index", key: "category", value: "11", destination: "/innohub" },
];

const LOCALES = "/:locale(kk|ru|en)";

/** Каждый адрес работает и без языка, и с ним: /content/x и /ru/content/x. */
export function legacyRedirects() {
  const moves = [
    ...Object.entries(CONTENT_MOVES).flatMap(([to, slugs]) => slugs.map((slug): [string, string] => [`/content/${slug}`, to])),
    ...PATH_MOVES,
  ];
  return [
    ...moves.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `${LOCALES}${from}`, destination: `/:locale${to}`, permanent: true },
    ]),
    ...QUERY_MOVES.flatMap(({ source, key, value, destination }) => {
      const has = [{ type: "query" as const, key, value }];
      return [
        { source, has, destination, permanent: true },
        { source: `${LOCALES}${source}`, has, destination: `/:locale${destination}`, permanent: true },
      ];
    }),
  ];
}
