import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { reindexAll } from "../../services/search/engine";
import { closeDb, getDb } from "./index";
import {
  appointments, degrees, departments, events, faculties, mediaFiles, mediaFolders, menuItems, news, offices,
  pages, persons, programs, siteSettings, studentOrgs, users, type Localized,
} from "./schema";

/**
 * Демонстрационное наполнение. Все люди, контакты, цифры и тексты вымышленные
 * и должны быть заменены настоящими данными университета через админку.
 */
const l = (kk: string, ru: string, en: string): Localized => ({ kk, ru, en });
const p = (kk: string, ru: string, en: string): Localized => ({ kk: `<p>${kk}</p>`, ru: `<p>${ru}</p>`, en: `<p>${en}</p>` });
const days = (n: number, hour = 10) => {
  const date = new Date(Date.now() + n * 86_400_000);
  date.setUTCHours(hour - 5, 0, 0, 0);
  return date;
};

const db = getDb();

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) throw new Error("Задайте ADMIN_EMAIL и ADMIN_PASSWORD (от 10 символов) в .env");
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!existing) {
    await db.insert(users).values({ email, name: "Администратор", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) });
    console.log(`Создан администратор ${email}`);
  }
}

async function seedContent() {
  await db.insert(siteSettings).values({
    key: "site",
    value: {
      name: l("TAU Университеті", "Университет TAU", "TAU University"),
      shortName: "TAU",
      tagline: l("Білім. Ғылым. Болашақ.", "Знания. Наука. Будущее.", "Knowledge. Science. Future."),
      heroTitle: l("Болашағыңызды бізбен бірге құрыңыз", "Создавайте своё будущее вместе с нами", "Shape your future with us"),
      heroSubtitle: l(
        "Заманауи білім беру бағдарламалары, тәжірибелі оқытушылар және ашық университеттік орта.",
        "Современные образовательные программы, опытные преподаватели и открытая университетская среда.",
        "Modern degree programmes, experienced teaching staff and an open university community.",
      ),
      heroImageId: null,
      stat1Value: "4", stat1Label: l("факультет", "факультета", "faculties"),
      stat2Value: "12", stat2Label: l("білім беру бағдарламасы", "образовательных программ", "degree programmes"),
      stat3Value: "4", stat3Label: l("оқу деңгейі", "уровня обучения", "levels of study"),
      stat4Value: "3", stat4Label: l("оқыту тілі", "языка обучения", "languages of instruction"),
      about: l(
        "Университет студенттерге сапалы білім, ғылыми зерттеулерге қатысу мүмкіндігін және кәсіби дамуға қолдау көрсетеді. Біз оқытушылар мен студенттерді бір академиялық қауымдастыққа біріктіреміз.",
        "Университет даёт студентам качественное образование, возможность участвовать в научных исследованиях и поддержку в профессиональном развитии. Мы объединяем преподавателей и студентов в одно академическое сообщество.",
        "The university offers students a quality education, the chance to take part in research and support for their professional growth. We bring teaching staff and students together as one academic community.",
      ),
      aboutPath: "about",
      rectorMessage: l(
        "Университет — бұл ең алдымен адамдар. Әр студенттің өз жолын табуына көмектесу — біздің басты міндетіміз.",
        "Университет — это прежде всего люди. Помочь каждому студенту найти свой путь — наша главная задача.",
        "A university is, above all, its people. Helping every student find their own path is our main mission.",
      ),
      address: l("Астана қ., Үлгі көшесі, 1", "г. Астана, ул. Примерная, 1", "1 Example Street, Astana"),
      phone: "+7 (7172) 00-00-00",
      admissionsPhone: "+7 (7172) 00-00-01",
      email: "info@example.edu.kz",
      instagram: null, facebook: null, youtube: null, telegram: null,
    },
  });

  /* ----- Степени ----- */
  const [bachelor, master, doctorate, mba] = await db.insert(degrees).values([
    {
      slug: "bachelor", sortOrder: 1,
      name: l("Бакалавриат", "Бакалавриат", "Bachelor's degree"),
      awarded: l("Бакалавр", "Бакалавр", "Bachelor"),
      duration: l("4 жыл", "4 года", "4 years"),
      summary: l("Кәсіби мансаптың негізін қалайтын жоғары білімнің алғашқы сатысы.", "Первая ступень высшего образования, закладывающая основу профессиональной карьеры.", "The first stage of higher education and the foundation of a professional career."),
      content: p("Бакалавриат бағдарламалары іргелі дайындық пен практикалық дағдыларды ұштастырады.", "Программы бакалавриата сочетают фундаментальную подготовку и практические навыки.", "Bachelor's programmes combine a solid academic grounding with practical skills."),
    },
    {
      slug: "master", sortOrder: 2,
      name: l("Магистратура", "Магистратура", "Master's degree"),
      awarded: l("Магистр", "Магистр", "Master"),
      duration: l("1–2 жыл", "1–2 года", "1–2 years"),
      summary: l("Терең кәсіби және ғылыми дайындық.", "Углублённая профессиональная и научная подготовка.", "Advanced professional and research training."),
      content: p("Магистратура таңдаған саладағы білімді тереңдетуге және зерттеу жүргізуге мүмкіндік береді.", "Магистратура позволяет углубить знания в выбранной области и вести исследования.", "A master's degree lets you deepen your knowledge of your chosen field and carry out research."),
    },
    {
      slug: "doctorate", sortOrder: 3,
      name: l("Докторантура", "Докторантура", "Doctoral studies"),
      awarded: l("Философия докторы (PhD)", "Доктор философии (PhD)", "Doctor of Philosophy (PhD)"),
      duration: l("3 жыл", "3 года", "3 years"),
      summary: l("Дербес ғылыми зерттеулерге бағытталған ең жоғары саты.", "Высшая ступень, ориентированная на самостоятельные научные исследования.", "The highest stage of study, focused on independent research."),
      content: p("Докторантура ғылыми жетекшімен бірге зерттеу жүргізіп, диссертация қорғауды қамтиды.", "Докторантура включает исследования под руководством научного консультанта и защиту диссертации.", "Doctoral study involves research with an academic supervisor and the defence of a dissertation."),
    },
    {
      slug: "mba", sortOrder: 4,
      name: l("MBA", "MBA", "MBA"),
      awarded: l("Іскерлік әкімшілендіру магистрі (MBA)", "Магистр делового администрирования (MBA)", "Master of Business Administration (MBA)"),
      summary: l("Басшылар мен кәсіпкерлерге арналған бизнес-білім.", "Бизнес-образование для руководителей и предпринимателей.", "Business education for managers and entrepreneurs."),
      content: p("Бұл бетке MBA бағдарламасының сипаттамасын әкімшілік панельден қосыңыз.", "Добавьте на эту страницу описание программы MBA через панель управления.", "Add a description of the MBA programme to this page from the admin panel."),
    },
  ]).returning();

  /* ----- Факультеты ----- */
  const [econ, tech, law, hum] = await db.insert(faculties).values([
    {
      slug: "economics-business", sortOrder: 1,
      name: l("Экономика және бизнес факультеті", "Факультет экономики и бизнеса", "Faculty of Economics and Business"),
      summary: l("Экономистер, қаржыгерлер және менеджерлер дайындайды.", "Готовит экономистов, финансистов и менеджеров.", "Educating economists, finance specialists and managers."),
      content: p("Факультет студенттерге нарықты талдауды, бизнесті басқаруды және қаржылық шешім қабылдауды үйретеді.", "Факультет учит студентов анализировать рынки, управлять бизнесом и принимать финансовые решения.", "The faculty teaches students to analyse markets, run businesses and make sound financial decisions."),
      phone: "+7 (7172) 00-00-10", email: "econ@example.edu.kz", location: l("1-корпус, 204-кабинет", "Корпус 1, кабинет 204", "Building 1, room 204"),
    },
    {
      slug: "it-engineering", sortOrder: 2,
      name: l("Ақпараттық технологиялар және инженерия факультеті", "Факультет информационных технологий и инженерии", "Faculty of Information Technology and Engineering"),
      summary: l("Бағдарламалық жасақтама, деректер және цифрлық жүйелер мамандары.", "Специалисты по программному обеспечению, данным и цифровым системам.", "Specialists in software, data and digital systems."),
      content: p("Факультетте студенттер нақты жобалармен жұмыс істеп, заманауи технологияларды меңгереді.", "На факультете студенты работают над реальными проектами и осваивают современные технологии.", "Students at the faculty work on real projects and master modern technologies."),
      phone: "+7 (7172) 00-00-11", email: "it@example.edu.kz", location: l("2-корпус, 310-кабинет", "Корпус 2, кабинет 310", "Building 2, room 310"),
    },
    {
      slug: "law-social-sciences", sortOrder: 3,
      name: l("Құқық және әлеуметтік ғылымдар факультеті", "Факультет права и социальных наук", "Faculty of Law and Social Sciences"),
      summary: l("Заңгерлер мен қоғамдық сала мамандарын дайындау.", "Подготовка юристов и специалистов общественной сферы.", "Educating lawyers and public-sector specialists."),
      content: p("Факультет құқықтық сауаттылық пен қоғамдық жауапкершілікті дамытады.", "Факультет развивает правовую грамотность и общественную ответственность.", "The faculty builds legal literacy and a sense of public responsibility."),
      phone: "+7 (7172) 00-00-12", email: "law@example.edu.kz", location: l("1-корпус, 105-кабинет", "Корпус 1, кабинет 105", "Building 1, room 105"),
    },
    {
      slug: "humanities-education", sortOrder: 4,
      name: l("Гуманитарлық ғылымдар және педагогика факультеті", "Факультет гуманитарных наук и педагогики", "Faculty of Humanities and Education"),
      summary: l("Педагогтар, аудармашылар және филологтар.", "Педагоги, переводчики и филологи.", "Teachers, translators and philologists."),
      content: p("Факультет тіл, мәдениет және білім беру салаларына маман даярлайды.", "Факультет готовит специалистов в сфере языка, культуры и образования.", "The faculty prepares specialists in language, culture and education."),
      phone: "+7 (7172) 00-00-13", email: "hum@example.edu.kz", location: l("3-корпус, 201-кабинет", "Корпус 3, кабинет 201", "Building 3, room 201"),
    },
  ]).returning();

  /* ----- Кафедры ----- */
  const dep = (slug: string, facultyId: string, sortOrder: number, name: Localized, summary: Localized) => ({
    slug, facultyId, sortOrder, name, summary,
    content: { kk: `<p>${summary.kk}</p>`, ru: `<p>${summary.ru}</p>`, en: `<p>${summary.en}</p>` },
    email: `${slug}@example.edu.kz`,
  });
  const [dEcon, dMgmt, dCs, dData, dLaw, dSoc, dLang, dPed] = await db.insert(departments).values([
    dep("economics-finance", econ.id, 1, l("Экономика және қаржы кафедрасы", "Кафедра экономики и финансов", "Department of Economics and Finance"), l("Экономикалық теория, қаржы және есеп пәндері.", "Экономическая теория, финансы и учёт.", "Economic theory, finance and accounting.")),
    dep("management-marketing", econ.id, 2, l("Менеджмент және маркетинг кафедрасы", "Кафедра менеджмента и маркетинга", "Department of Management and Marketing"), l("Ұйымдарды басқару және маркетинг.", "Управление организациями и маркетинг.", "Organisational management and marketing.")),
    dep("computer-science", tech.id, 3, l("Компьютерлік ғылымдар кафедрасы", "Кафедра компьютерных наук", "Department of Computer Science"), l("Бағдарламалау, алгоритмдер және жүйелер.", "Программирование, алгоритмы и системы.", "Programming, algorithms and systems.")),
    dep("data-science", tech.id, 4, l("Деректер ғылымы кафедрасы", "Кафедра науки о данных", "Department of Data Science"), l("Деректерді талдау және жасанды интеллект.", "Анализ данных и искусственный интеллект.", "Data analysis and artificial intelligence.")),
    dep("jurisprudence", law.id, 5, l("Құқықтану кафедрасы", "Кафедра юриспруденции", "Department of Jurisprudence"), l("Азаматтық, қылмыстық және халықаралық құқық.", "Гражданское, уголовное и международное право.", "Civil, criminal and international law.")),
    dep("social-sciences", law.id, 6, l("Әлеуметтік ғылымдар кафедрасы", "Кафедра социальных наук", "Department of Social Sciences"), l("Психология, әлеуметтану және саясаттану.", "Психология, социология и политология.", "Psychology, sociology and political science.")),
    dep("foreign-languages", hum.id, 7, l("Шет тілдері кафедрасы", "Кафедра иностранных языков", "Department of Foreign Languages"), l("Шет тілдері және аударма ісі.", "Иностранные языки и переводческое дело.", "Foreign languages and translation.")),
    dep("pedagogy", hum.id, 8, l("Педагогика кафедрасы", "Кафедра педагогики", "Department of Education"), l("Оқыту әдістемесі және педагогикалық тәжірибе.", "Методика обучения и педагогическая практика.", "Teaching methods and pedagogical practice.")),
  ]).returning();

  /* ----- Программы ----- */
  const langs3 = l("қазақша, орысша, ағылшынша", "казахский, русский, английский", "Kazakh, Russian, English");
  const langs2 = l("қазақша, орысша", "казахский, русский", "Kazakh, Russian");
  const fullTime = l("Күндізгі", "Очная", "Full-time");
  const prog = (slug: string, code: string, degreeId: string, facultyId: string, departmentId: string, sortOrder: number, durationYears: number, credits: number, languages: Localized, name: Localized, summary: Localized) => ({
    slug, code, degreeId, facultyId, departmentId, sortOrder, durationYears, credits, languages, name, summary, studyForm: fullTime,
    content: { kk: `<p>${summary.kk}</p>`, ru: `<p>${summary.ru}</p>`, en: `<p>${summary.en}</p>` },
  });
  await db.insert(programs).values([
    prog("finance", "6B04101", bachelor.id, econ.id, dEcon.id, 1, 4, 240, langs3, l("Қаржы", "Финансы", "Finance"), l("Қаржы нарықтары, банк ісі және инвестициялар.", "Финансовые рынки, банковское дело и инвестиции.", "Financial markets, banking and investment.")),
    prog("management", "6B04102", bachelor.id, econ.id, dMgmt.id, 2, 4, 240, langs2, l("Менеджмент", "Менеджмент", "Management"), l("Команданы, жобаларды және ұйымдарды басқару.", "Управление командами, проектами и организациями.", "Leading teams, projects and organisations.")),
    prog("software-engineering", "6B06101", bachelor.id, tech.id, dCs.id, 3, 4, 240, langs3, l("Бағдарламалық инженерия", "Программная инженерия", "Software Engineering"), l("Бағдарламалық жүйелерді жобалау және әзірлеу.", "Проектирование и разработка программных систем.", "Designing and building software systems.")),
    prog("data-analytics", "6B06102", bachelor.id, tech.id, dData.id, 4, 4, 240, langs3, l("Деректер аналитикасы", "Аналитика данных", "Data Analytics"), l("Деректерді жинау, талдау және шешім қабылдау.", "Сбор и анализ данных, принятие решений на их основе.", "Collecting and analysing data to support decisions.")),
    prog("law", "6B04201", bachelor.id, law.id, dLaw.id, 5, 4, 240, langs2, l("Құқықтану", "Юриспруденция", "Law"), l("Құқықтық жүйе және заң тәжірибесі.", "Правовая система и юридическая практика.", "The legal system and legal practice.")),
    prog("psychology", "6B03101", bachelor.id, law.id, dSoc.id, 6, 4, 240, langs2, l("Психология", "Психология", "Psychology"), l("Адам мінез-құлқы мен психологиялық қолдау.", "Поведение человека и психологическая поддержка.", "Human behaviour and psychological support.")),
    prog("translation", "6B02301", bachelor.id, hum.id, dLang.id, 7, 4, 240, langs3, l("Аударма ісі", "Переводческое дело", "Translation Studies"), l("Жазбаша және ауызша аударма.", "Письменный и устный перевод.", "Written and oral translation.")),
    prog("pedagogy-psychology", "6B01101", bachelor.id, hum.id, dPed.id, 8, 4, 240, langs2, l("Педагогика және психология", "Педагогика и психология", "Education and Psychology"), l("Заманауи мектеп үшін педагогтар дайындау.", "Подготовка педагогов для современной школы.", "Preparing teachers for today's schools.")),
    prog("mba", "7M04101", master.id, econ.id, dMgmt.id, 9, 2, 120, langs3, l("Іскерлік әкімшілік", "Деловое администрирование", "Business Administration"), l("Басшылар мен кәсіпкерлерге арналған бағдарлама.", "Программа для руководителей и предпринимателей.", "A programme for managers and entrepreneurs.")),
    prog("artificial-intelligence", "7M06101", master.id, tech.id, dData.id, 10, 2, 120, langs3, l("Жасанды интеллект", "Искусственный интеллект", "Artificial Intelligence"), l("Машиналық оқыту және интеллектуалды жүйелер.", "Машинное обучение и интеллектуальные системы.", "Machine learning and intelligent systems.")),
    prog("international-law", "7M04201", master.id, law.id, dLaw.id, 11, 2, 120, langs2, l("Халықаралық құқық", "Международное право", "International Law"), l("Халықаралық құқықтық қатынастар.", "Международные правовые отношения.", "International legal relations.")),
    prog("economics-phd", "8D04101", doctorate.id, econ.id, dEcon.id, 12, 3, 180, langs3, l("Экономика", "Экономика", "Economics"), l("Экономика саласындағы ғылыми зерттеулер.", "Научные исследования в области экономики.", "Research in the field of economics.")),
  ]);

  /* ----- Подразделения ----- */
  const [oAcademic, oAdmissions, oDigital, oCareer, oInternational] = await db.insert(offices).values([
    {
      slug: "academic-affairs", kind: "DEPARTMENT" as const, sortOrder: 1,
      name: l("Академиялық мәселелер департаменті", "Департамент по академическим вопросам", "Academic Affairs Department"),
      summary: l("Оқу процесін ұйымдастырады.", "Организует учебный процесс.", "Organises the teaching process."),
      content: p("Департамент оқу жоспарларын, кестелерді және оқу сапасын үйлестіреді.", "Департамент координирует учебные планы, расписание и качество обучения.", "The department coordinates curricula, timetables and the quality of teaching."),
      phone: "+7 (7172) 00-00-20", email: "academic@example.edu.kz", location: l("1-корпус, 301-кабинет", "Корпус 1, кабинет 301", "Building 1, room 301"),
      workingHours: l("Дс–Жм, 9:00–18:00", "Пн–Пт, 9:00–18:00", "Mon–Fri, 9:00–18:00"),
    },
    {
      slug: "admissions", kind: "OFFICE" as const, sortOrder: 2,
      name: l("Қабылдау комиссиясы", "Приёмная комиссия", "Admissions Office"),
      summary: l("Талапкерлерге кеңес береді және құжаттарды қабылдайды.", "Консультирует абитуриентов и принимает документы.", "Advises applicants and accepts documents."),
      content: p("Комиссия бағдарлама таңдауға және құжаттарды тапсыруға көмектеседі.", "Комиссия помогает выбрать программу и подать документы.", "The office helps you choose a programme and submit your documents."),
      phone: "+7 (7172) 00-00-01", email: "admissions@example.edu.kz", location: l("1-корпус, 101-кабинет", "Корпус 1, кабинет 101", "Building 1, room 101"),
      workingHours: l("Дс–Сб, 9:00–18:00", "Пн–Сб, 9:00–18:00", "Mon–Sat, 9:00–18:00"),
    },
    {
      slug: "digital-development", kind: "DEPARTMENT" as const, sortOrder: 3,
      name: l("Цифрлық даму департаменті", "Департамент цифрового развития", "Digital Development Department"),
      summary: l("Университеттің цифрлық сервистерін дамытады.", "Развивает цифровые сервисы университета.", "Develops the university's digital services."),
      content: p("Департамент ақпараттық жүйелерге және пайдаланушыларды қолдауға жауап береді.", "Департамент отвечает за информационные системы и поддержку пользователей.", "The department looks after information systems and user support."),
      phone: "+7 (7172) 00-00-21", email: "digital@example.edu.kz", location: l("2-корпус, 110-кабинет", "Корпус 2, кабинет 110", "Building 2, room 110"),
    },
    {
      slug: "career-center", kind: "CENTER" as const, sortOrder: 4,
      name: l("Мансап орталығы", "Центр карьеры", "Career Centre"),
      summary: l("Студенттерге тағылымдама мен жұмыс табуға көмектеседі.", "Помогает студентам найти стажировку и работу.", "Helps students find internships and jobs."),
      content: p("Орталық жұмыс берушілермен кездесулер мен кеңестер ұйымдастырады.", "Центр организует встречи с работодателями и консультации.", "The centre runs employer meetings and career advice sessions."),
      phone: "+7 (7172) 00-00-22", email: "career@example.edu.kz", location: l("1-корпус, 115-кабинет", "Корпус 1, кабинет 115", "Building 1, room 115"),
    },
    {
      slug: "international-office", kind: "OFFICE" as const, sortOrder: 5,
      name: l("Халықаралық офис", "Международный офис", "International Office"),
      summary: l("Академиялық ұтқырлық пен серіктестікті қолдайды.", "Поддерживает академическую мобильность и партнёрство.", "Supports academic mobility and partnerships."),
      content: p("Офис шетелдік студенттерге және алмасу бағдарламаларына көмектеседі.", "Офис помогает иностранным студентам и участникам программ обмена.", "The office supports international students and exchange participants."),
      phone: "+7 (7172) 00-00-23", email: "international@example.edu.kz", location: l("1-корпус, 305-кабинет", "Корпус 1, кабинет 305", "Building 1, room 305"),
    },
  ]).returning();

  const [oRegistrar] = await db.insert(offices).values({
    slug: "registrar", kind: "DIVISION", parentId: oAcademic.id, sortOrder: 6,
    name: l("Тіркеу бөлімі", "Отдел регистрации", "Registrar's Division"),
    summary: l("Студенттердің оқу жетістіктерін есепке алады.", "Ведёт учёт учебных достижений студентов.", "Keeps records of students' academic progress."),
    content: p("Бөлім анықтамалар береді және тіркеуді ұйымдастырады.", "Отдел выдаёт справки и организует регистрацию на дисциплины.", "The division issues certificates and organises course registration."),
    phone: "+7 (7172) 00-00-24", email: "registrar@example.edu.kz", location: l("1-корпус, 303-кабинет", "Корпус 1, кабинет 303", "Building 1, room 303"),
  }).returning();

  /* ----- Люди ----- */
  type Role = { kind: "LEADERSHIP" | "DEAN" | "TEACHER" | "SPECIALIST"; position: Localized; facultyId?: string; departmentId?: string; officeId?: string; isHead?: boolean };
  const addPerson = async (slug: string, fullName: Localized, degree: Localized | null, roles: Role[], sortOrder = 0) => {
    const [person] = await db.insert(persons).values({
      slug, fullName, sortOrder,
      academicDegree: degree ?? {},
      email: `${slug}@example.edu.kz`,
      bio: p("Университеттің демонстрациялық профилі. Нақты өмірбаянды әкімшілік панельде енгізіңіз.", "Демонстрационный профиль. Настоящую биографию можно указать в панели управления.", "A demonstration profile. Add the real biography in the admin panel."),
    }).returning();
    await db.insert(appointments).values(roles.map((r, i) => ({ ...r, personId: person.id, sortOrder: sortOrder * 10 + i })));
  };
  const phdEcon = l("экономика ғылымдарының докторы", "доктор экономических наук", "Doctor of Economics");
  const cand = l("ғылым кандидаты", "кандидат наук", "Candidate of Sciences");
  const phd = l("PhD докторы", "доктор PhD", "PhD");
  const seniorLecturer = l("Аға оқытушы", "Старший преподаватель", "Senior Lecturer");
  const professor = l("Профессор", "Профессор", "Professor");
  const headDept = l("Кафедра меңгерушісі", "Заведующий кафедрой", "Head of Department");

  await addPerson("aibek-saparov", l("Әйбек Сапаров", "Айбек Сапаров", "Aibek Saparov"), phdEcon, [{ kind: "LEADERSHIP", position: l("Ректор", "Ректор", "Rector") }], 1);
  await addPerson("dana-omarova", l("Дана Омарова", "Дана Омарова", "Dana Omarova"), cand, [{ kind: "LEADERSHIP", position: l("Академиялық мәселелер жөніндегі проректор", "Проректор по академическим вопросам", "Vice-Rector for Academic Affairs") }], 2);
  await addPerson("ruslan-akhmetov", l("Руслан Ахметов", "Руслан Ахметов", "Ruslan Akhmetov"), phd, [{ kind: "LEADERSHIP", position: l("Ғылым және инновациялар жөніндегі проректор", "Проректор по науке и инновациям", "Vice-Rector for Research and Innovation") }], 3);
  await addPerson("zhanar-bekova", l("Жанар Бекова", "Жанар Бекова", "Zhanar Bekova"), null, [{ kind: "LEADERSHIP", position: l("Тәрбие және әлеуметтік мәселелер жөніндегі проректор", "Проректор по воспитательной и социальной работе", "Vice-Rector for Student and Social Affairs") }], 4);

  await addPerson("marat-kasymov", l("Марат Қасымов", "Марат Касымов", "Marat Kassymov"), cand, [{ kind: "DEAN", position: l("Факультет деканы", "Декан факультета", "Dean of the Faculty"), facultyId: econ.id }, { kind: "TEACHER", position: professor, departmentId: dEcon.id }], 5);
  await addPerson("aliya-nurlanova", l("Әлия Нұрланова", "Алия Нурланова", "Aliya Nurlanova"), phd, [{ kind: "DEAN", position: l("Факультет деканы", "Декан факультета", "Dean of the Faculty"), facultyId: tech.id }], 6);
  await addPerson("serik-tulegenov", l("Серік Төлегенов", "Серик Тулегенов", "Serik Tulegenov"), cand, [{ kind: "DEAN", position: l("Факультет деканы", "Декан факультета", "Dean of the Faculty"), facultyId: law.id }], 7);
  await addPerson("gulnara-iskakova", l("Гүлнар Ысқақова", "Гульнара Искакова", "Gulnara Iskakova"), cand, [{ kind: "DEAN", position: l("Факультет деканы", "Декан факультета", "Dean of the Faculty"), facultyId: hum.id }], 8);

  const teachers: [string, Localized, Localized, string, Localized, boolean][] = [
    ["aidana-sultanova", l("Айдана Сұлтанова", "Айдана Султанова", "Aidana Sultanova"), phd, dEcon.id, headDept, true],
    ["timur-abenov", l("Тимур Әбенов", "Тимур Абенов", "Timur Abenov"), cand, dMgmt.id, headDept, true],
    ["daniyar-ospanov", l("Данияр Оспанов", "Данияр Оспанов", "Daniyar Ospanov"), phd, dCs.id, headDept, true],
    ["madina-zhunusova", l("Мәдина Жүнісова", "Мадина Жунусова", "Madina Zhunussova"), phd, dData.id, headDept, true],
    ["erlan-baimukhanov", l("Ерлан Баймұханов", "Ерлан Баймуханов", "Yerlan Baimukhanov"), cand, dLaw.id, headDept, true],
    ["saule-rakhimova", l("Сәуле Рахимова", "Сауле Рахимова", "Saule Rakhimova"), cand, dSoc.id, headDept, true],
    ["assel-mukanova", l("Әсел Мұқанова", "Асель Муканова", "Assel Mukanova"), phd, dLang.id, headDept, true],
    ["bolat-esenov", l("Болат Есенов", "Болат Есенов", "Bolat Yessenov"), cand, dPed.id, headDept, true],
    ["kamila-seitova", l("Камила Сейітова", "Камила Сеитова", "Kamila Seitova"), phd, dCs.id, seniorLecturer, false],
    ["nurlan-zhakupov", l("Нұрлан Жақыпов", "Нурлан Жакупов", "Nurlan Zhakupov"), cand, dCs.id, professor, false],
    ["ainur-kairatova", l("Айнұр Қайратова", "Айнур Кайратова", "Ainur Kairatova"), phd, dData.id, seniorLecturer, false],
    ["olga-petrenko", l("Ольга Петренко", "Ольга Петренко", "Olga Petrenko"), cand, dLang.id, seniorLecturer, false],
    ["azamat-yerzhanov", l("Азамат Ержанов", "Азамат Ержанов", "Azamat Yerzhanov"), phd, dEcon.id, seniorLecturer, false],
    ["laura-dosanova", l("Лаура Досанова", "Лаура Досанова", "Laura Dossanova"), cand, dLaw.id, seniorLecturer, false],
  ];
  for (const [slug, name, degree, departmentId, position, isHead] of teachers) {
    await addPerson(slug, name, degree, [{ kind: "TEACHER", position, departmentId, isHead }], 20);
  }

  const headDepartment = l("Департамент директоры", "Директор департамента", "Director of the Department");
  const headOffice = l("Бөлім басшысы", "Руководитель", "Head of Office");
  const specialist = l("Маман", "Специалист", "Specialist");
  const leadSpecialist = l("Жетекші маман", "Ведущий специалист", "Lead Specialist");
  const staff: [string, Localized, string, Localized, boolean][] = [
    ["baurzhan-amirov", l("Бауыржан Әміров", "Бауржан Амиров", "Baurzhan Amirov"), oAcademic.id, headDepartment, true],
    ["dinara-saparova", l("Динара Сапарова", "Динара Сапарова", "Dinara Saparova"), oAcademic.id, leadSpecialist, false],
    ["aigerim-tokhtarova", l("Айгерім Тоқтарова", "Айгерим Тохтарова", "Aigerim Tokhtarova"), oAdmissions.id, headOffice, true],
    ["yerbol-karimov", l("Ербол Кәрімов", "Ербол Каримов", "Yerbol Karimov"), oAdmissions.id, specialist, false],
    ["zarina-alimova", l("Зарина Әлімова", "Зарина Алимова", "Zarina Alimova"), oAdmissions.id, specialist, false],
    ["maksat-nurgaliyev", l("Мақсат Нұрғалиев", "Максат Нургалиев", "Maksat Nurgaliyev"), oDigital.id, headDepartment, true],
    ["alina-kim", l("Алина Ким", "Алина Ким", "Alina Kim"), oDigital.id, leadSpecialist, false],
    ["gaukhar-zhaksylyk", l("Гауһар Жақсылық", "Гаухар Жаксылык", "Gaukhar Zhaksylyk"), oCareer.id, headOffice, true],
    ["daulet-orazov", l("Дәулет Оразов", "Даулет Оразов", "Daulet Orazov"), oInternational.id, headOffice, true],
    ["anel-serikova", l("Әнел Серікова", "Анель Серикова", "Anel Serikova"), oRegistrar.id, headOffice, true],
  ];
  for (const [slug, name, officeId, position, isHead] of staff) {
    await addPerson(slug, name, null, [{ kind: "SPECIALIST", position, officeId, isHead }], 30);
  }

  /* ----- Новости ----- */
  await db.insert(news).values([
    {
      slug: "open-doors-day", publishedAt: days(-2), featured: true,
      title: l("Университетте ашық есік күні өтті", "В университете прошёл день открытых дверей", "The university held an open day"),
      summary: l("Талапкерлер мен ата-аналар факультеттермен, бағдарламалармен және оқытушылармен танысты.", "Абитуриенты и родители познакомились с факультетами, программами и преподавателями.", "Prospective students and parents met the faculties, programmes and teaching staff."),
      content: p("Қонақтар кампусты аралап, деканаттардан кеңес алды.", "Гости осмотрели кампус и получили консультации в деканатах.", "Guests toured the campus and received advice from the deans' offices."),
    },
    {
      slug: "student-research-conference", publishedAt: days(-6), facultyId: tech.id,
      title: l("Студенттік ғылыми конференция қорытындыланды", "Подведены итоги студенческой научной конференции", "Student research conference results announced"),
      summary: l("Студенттер өз зерттеулерін таныстырып, тәжірибесімен бөлісті.", "Студенты представили свои исследования и поделились опытом.", "Students presented their research and shared their experience."),
      content: p("Үздік жұмыстардың авторлары дипломдармен марапатталды.", "Авторы лучших работ награждены дипломами.", "The authors of the best papers received diplomas."),
    },
    {
      slug: "new-it-laboratory", publishedAt: days(-11), facultyId: tech.id,
      title: l("Жаңа IT-зертхана ашылды", "Открылась новая IT-лаборатория", "A new IT laboratory has opened"),
      summary: l("Зертхана студенттердің жобалық жұмысына арналған.", "Лаборатория предназначена для проектной работы студентов.", "The laboratory is designed for students' project work."),
      content: p("Студенттер мұнда командалық жобалармен айналыса алады.", "Здесь студенты смогут работать над командными проектами.", "Students can work on team projects here."),
    },
    {
      slug: "career-fair-results", publishedAt: days(-16), facultyId: econ.id,
      title: l("Мансап жәрмеңкесі студенттерді жұмыс берушілермен таныстырды", "Ярмарка карьеры познакомила студентов с работодателями", "Career fair connects students with employers"),
      summary: l("Студенттер компаниялардың өкілдерімен кездесті.", "Студенты встретились с представителями компаний.", "Students met company representatives."),
      content: p("Қатысушылар тағылымдама мүмкіндіктері туралы білді.", "Участники узнали о возможностях стажировок.", "Participants learned about internship opportunities."),
    },
    {
      slug: "exchange-program-open", publishedAt: days(-21),
      title: l("Академиялық алмасуға өтінім қабылдау басталды", "Начался приём заявок на академический обмен", "Applications open for academic exchange"),
      summary: l("Студенттер серіктес университеттерде оқи алады.", "Студенты могут пройти обучение в университетах-партнёрах.", "Students can study at partner universities."),
      content: p("Толық ақпаратты Халықаралық офистен алуға болады.", "Подробности можно узнать в Международном офисе.", "Further details are available from the International Office."),
    },
    {
      slug: "law-moot-court", publishedAt: days(-27), facultyId: law.id,
      title: l("Заңгер студенттер сот процесін сахналады", "Студенты-юристы провели учебный судебный процесс", "Law students stage a moot court"),
      summary: l("Оқу процесі кәсіби дағдыларды шыңдауға көмектесті.", "Учебный процесс помог отработать профессиональные навыки.", "The exercise helped them practise professional skills."),
      content: p("Студенттер судья, прокурор және адвокат рөлдерін орындады.", "Студенты выступили в ролях судьи, прокурора и адвоката.", "Students took the roles of judge, prosecutor and defence counsel."),
    },
  ]);

  /* ----- Мероприятия ----- */
  const hall = l("1-корпус, акт залы", "Корпус 1, актовый зал", "Building 1, assembly hall");
  await db.insert(events).values([
    {
      slug: "admissions-consultation", startsAt: days(5, 11), endsAt: days(5, 14), location: hall,
      title: l("Талапкерлерге арналған кеңес", "Консультация для абитуриентов", "Consultation for applicants"),
      summary: l("Қабылдау ережелері, бағдарлама таңдау және құжаттар туралы.", "О правилах приёма, выборе программы и документах.", "On admission rules, choosing a programme and documents."),
      content: p("Қабылдау комиссиясының мамандары сұрақтарға жауап береді.", "Специалисты приёмной комиссии ответят на вопросы.", "Admissions staff will answer your questions."),
    },
    {
      slug: "ai-in-education-seminar", startsAt: days(12, 15), location: l("2-корпус, 310-кабинет", "Корпус 2, кабинет 310", "Building 2, room 310"), facultyId: tech.id,
      title: l("«Білім берудегі жасанды интеллект» семинары", "Семинар «Искусственный интеллект в образовании»", "Seminar: Artificial Intelligence in Education"),
      summary: l("Оқытушылар мен студенттерге арналған ашық семинар.", "Открытый семинар для преподавателей и студентов.", "An open seminar for staff and students."),
      content: p("Семинарда жасанды интеллектті оқуда пайдалану тәжірибесі талқыланады.", "На семинаре обсудят опыт применения ИИ в обучении.", "The seminar will discuss experience of using AI in teaching."),
    },
    {
      slug: "career-day", startsAt: days(20, 10), endsAt: days(20, 16), location: hall, facultyId: econ.id,
      title: l("Мансап күні", "День карьеры", "Career Day"),
      summary: l("Жұмыс берушілермен кездесу және түйіндеме бойынша кеңестер.", "Встречи с работодателями и советы по резюме.", "Meet employers and get CV advice."),
      content: p("Студенттер мен түлектер үшін кездесулер мен шеберлік сабақтары.", "Встречи и мастер-классы для студентов и выпускников.", "Meetings and workshops for students and graduates."),
    },
    {
      slug: "languages-festival", startsAt: days(33, 14), location: l("3-корпус, фойе", "Корпус 3, фойе", "Building 3, foyer"), facultyId: hum.id,
      title: l("Тілдер фестивалі", "Фестиваль языков", "Festival of Languages"),
      summary: l("Тілдер мен мәдениеттердің студенттік фестивалі.", "Студенческий фестиваль языков и культур.", "A student festival of languages and cultures."),
      content: p("Қонақтарды презентациялар мен концерт күтеді.", "Гостей ждут презентации и концерт.", "Presentations and a concert await guests."),
    },
    {
      slug: "open-lecture-economy", startsAt: days(-9, 16), location: hall, facultyId: econ.id,
      title: l("Экономика бойынша ашық дәріс", "Открытая лекция по экономике", "Open lecture on economics"),
      summary: l("Дәріс студенттер мен оқытушылар үшін өтті.", "Лекция прошла для студентов и преподавателей.", "The lecture was held for students and staff."),
      content: p("Дәрісте экономикалық үрдістер талқыланды.", "На лекции обсудили экономические тенденции.", "The lecture discussed economic trends."),
    },
  ]);

  /* ----- Студенческие объединения ----- */
  const org = (slug: string, sortOrder: number, name: Localized, category: Localized, summary: Localized, facultyId?: string) => ({
    slug, sortOrder, name, category, summary, facultyId,
    content: { kk: `<p>${summary.kk}</p>`, ru: `<p>${summary.ru}</p>`, en: `<p>${summary.en}</p>` },
    email: `${slug}@example.edu.kz`,
  });
  await db.insert(studentOrgs).values([
    org("student-council", 1, l("Студенттік кеңес", "Студенческий совет", "Student Council"), l("Өзін-өзі басқару", "Самоуправление", "Self-government"), l("Студенттердің мүддесін білдіреді және бастамаларды қолдайды.", "Представляет интересы студентов и поддерживает их инициативы.", "Represents students' interests and supports their initiatives.")),
    org("debate-club", 2, l("Пікірсайыс клубы", "Дебатный клуб", "Debate Club"), l("Интеллектуалдық", "Интеллектуальный", "Intellectual"), l("Шешендік өнер мен сыни ойлауды дамытады.", "Развивает ораторское мастерство и критическое мышление.", "Develops public speaking and critical thinking."), law.id),
    org("it-community", 3, l("IT-қауымдастық", "IT-сообщество", "IT Community"), l("Кәсіби", "Профессиональный", "Professional"), l("Хакатондар, кездесулер және бірлескен жобалар.", "Хакатоны, встречи и совместные проекты.", "Hackathons, meet-ups and shared projects."), tech.id),
    org("volunteers", 4, l("Волонтерлер орталығы", "Центр волонтёров", "Volunteer Centre"), l("Қоғамдық", "Общественный", "Community"), l("Қайырымдылық және әлеуметтік жобалар.", "Благотворительные и социальные проекты.", "Charity and social projects.")),
    org("creative-studio", 5, l("Шығармашылық студия", "Творческая студия", "Creative Studio"), l("Шығармашылық", "Творческий", "Creative"), l("Музыка, театр және университет іс-шаралары.", "Музыка, театр и университетские мероприятия.", "Music, theatre and university events."), hum.id),
  ]);

  /* ----- Страницы ----- */
  const [pAbout, , pContacts, pAdmission] = await db.insert(pages).values([
    {
      path: "about",
      title: l("Университет туралы", "Об университете", "About the university"),
      summary: l("Миссиямыз, құндылықтарымыз және қауымдастығымыз.", "Наша миссия, ценности и сообщество.", "Our mission, values and community."),
      content: {
        kk: "<h2>Миссиямыз</h2><p>Сапалы білім мен ғылым арқылы адамдар мен қоғамның дамуына үлес қосу.</p><h2>Құндылықтарымыз</h2><ul><li>Академиялық адалдық</li><li>Ашықтық пен құрмет</li><li>Даму мен жаңашылдық</li></ul><h2>Толығырақ</h2><ul><li><a href=\"/kk/about/history\">Тарих</a></li><li><a href=\"/kk/about/councils\">Кеңестер</a></li><li><a href=\"/kk/about/sustainability\">Тұрақты даму</a></li></ul>",
        ru: "<h2>Наша миссия</h2><p>Вносить вклад в развитие людей и общества через качественное образование и науку.</p><h2>Наши ценности</h2><ul><li>Академическая честность</li><li>Открытость и уважение</li><li>Развитие и новаторство</li></ul><h2>Подробнее</h2><ul><li><a href=\"/ru/about/history\">История</a></li><li><a href=\"/ru/about/councils\">Советы</a></li><li><a href=\"/ru/about/sustainability\">Устойчивое развитие</a></li></ul>",
        en: "<h2>Our mission</h2><p>To contribute to the development of people and society through quality education and research.</p><h2>Our values</h2><ul><li>Academic integrity</li><li>Openness and respect</li><li>Growth and innovation</li></ul><h2>Learn more</h2><ul><li><a href=\"/en/about/history\">History</a></li><li><a href=\"/en/about/councils\">Councils</a></li><li><a href=\"/en/about/sustainability\">Sustainable development</a></li></ul>",
      },
    },
    {
      path: "about/history",
      title: l("Тарих", "История", "History"),
      summary: l("Университеттің даму жолы.", "Путь развития университета.", "How the university developed."),
      content: p("Бұл бетке университеттің нақты тарихын әкімшілік панельден қосыңыз.", "Добавьте на эту страницу настоящую историю университета через панель управления.", "Add the university's real history to this page from the admin panel."),
    },
    {
      path: "contacts",
      title: l("Байланыс", "Контакты", "Contacts"),
      summary: l("Бізбен қалай байланысуға болады.", "Как с нами связаться.", "How to reach us."),
      content: {
        kk: "<p><strong>Мекенжай:</strong> Астана қ., Үлгі көшесі, 1</p><p><strong>Телефон:</strong> +7 (7172) 00-00-00</p><p><strong>Пошта:</strong> info@example.edu.kz</p>",
        ru: "<p><strong>Адрес:</strong> г. Астана, ул. Примерная, 1</p><p><strong>Телефон:</strong> +7 (7172) 00-00-00</p><p><strong>Почта:</strong> info@example.edu.kz</p>",
        en: "<p><strong>Address:</strong> 1 Example Street, Astana</p><p><strong>Phone:</strong> +7 (7172) 00-00-00</p><p><strong>Email:</strong> info@example.edu.kz</p>",
      },
    },
    {
      path: "admission",
      title: l("Оқуға қалай түсуге болады", "Как поступить", "How to apply"),
      summary: l("Талапкерлерге арналған қадамдар.", "Шаги для абитуриентов.", "Steps for applicants."),
      content: {
        kk: "<h2>Қадамдар</h2><ol><li>Білім беру бағдарламасын таңдаңыз.</li><li>Сайттағы «Оқуға түскім келеді» формасы арқылы өтінім қалдырыңыз.</li><li>Қабылдау комиссиясы сізбен байланысып, қажетті құжаттар туралы айтады.</li><li>Құжаттарды тапсырып, оқуға қабылдану туралы шешімді күтіңіз.</li></ol>",
        ru: "<h2>Шаги</h2><ol><li>Выберите образовательную программу.</li><li>Оставьте заявку через форму «Хочу поступить» на сайте.</li><li>Приёмная комиссия свяжется с вами и расскажет о необходимых документах.</li><li>Подайте документы и дождитесь решения о зачислении.</li></ol>",
        en: "<h2>Steps</h2><ol><li>Choose a degree programme.</li><li>Send a request using the “Apply now” form on the site.</li><li>The admissions office will contact you and explain which documents you need.</li><li>Submit your documents and wait for the admission decision.</li></ol>",
      },
    },
  ]).returning();

  /* Сводные страницы: содержимое переносится со старого сайта через админку, адреса старых страниц — в lib/legacy-redirects.ts */
  const stubs = await db.insert(pages).values(([
    ["admission/tuition-grants", l("Оқу ақысы және гранттар", "Стоимость и гранты", "Tuition and grants")],
    ["admission/why-tau", l("Неге TAU", "Почему TAU", "Why TAU")],
    ["admission/dormitory", l("Жатақхана", "Общежитие", "Dormitory")],
    ["admission/contacts", l("Қабылдау комиссиясының байланыстары", "Контакты приёмной комиссии", "Admissions office contacts")],
    ["education/additional", l("Қосымша білім беру", "Дополнительное образование", "Continuing education")],
    ["science/activity", l("Ғылыми қызмет", "Научная деятельность", "Research activity")],
    ["science/centers", l("Орталықтар мен зертханалар", "Центры и лаборатории", "Centres and laboratories")],
    ["science/publications", l("Басылымдар мен жарияланымдар", "Издания и публикации", "Journals and publications")],
    ["science/young-scientists", l("Жас ғалымдарға", "Молодым учёным", "Young researchers")],
    ["science/events", l("Ғылыми іс-шаралар", "Научные мероприятия", "Research events")],
    ["innohub", l("TAU-InnoHub", "TAU-InnoHub", "TAU-InnoHub")],
    ["students/calendar", l("Күнтізбе және кесте", "Календарь и расписание", "Calendar and timetable")],
    ["students/handbook", l("Студент анықтамалығы", "Справочник студента", "Student handbook")],
    ["students/library", l("Кітапхана", "Библиотека", "Library")],
    ["students/campus", l("Кампус және қолдау", "Кампус и поддержка", "Campus and support")],
    ["students/alumni", l("Түлектерге", "Выпускникам", "Alumni")],
    ["about/councils", l("Кеңестер", "Советы", "Councils")],
    ["about/sustainability", l("Тұрақты даму", "Устойчивое развитие", "Sustainable development")],
    ["international", l("Халықаралық қызмет", "Международная деятельность", "International affairs")],
    ["vacancies", l("Бос орындар", "Вакансии", "Vacancies")],
    ["rector-blog", l("Ректор блогы", "Блог ректора", "Rector's blog")],
    ["situation-center", l("Жағдаяттық орталық", "Ситуационный центр", "Situation centre")],
  ] as const).map(([path, title]) => ({
    path, title,
    content: p("Бұл беттің мазмұнын әкімшілік панельден қосыңыз.", "Добавьте содержимое этой страницы через панель управления.", "Add the content of this page from the admin panel."),
  }))).returning();

  /* ----- Меню ----- */
  let order = 0;
  type Item = { kind: "GROUP" | "SECTION" | "PAGE" | "URL"; label?: Localized; sectionKey?: string; pageId?: string; url?: string; openInNewTab?: boolean; children?: Item[] };
  const addMenu = async (location: "HEADER" | "FOOTER", items: Item[], parentId: string | null = null) => {
    for (const item of items) {
      const [row] = await db.insert(menuItems).values({
        location, parentId, kind: item.kind, label: item.label ?? {}, sectionKey: item.sectionKey, pageId: item.pageId, url: item.url, openInNewTab: item.openInNewTab ?? false, sortOrder: ++order,
      }).returning();
      if (item.children) await addMenu(location, item.children, row.id);
    }
  };
  const section = (sectionKey: string, label?: Localized): Item => ({ kind: "SECTION", sectionKey, label });
  const page = (pageId: string): Item => ({ kind: "PAGE", pageId, label: undefined });
  const withTitle = (pageId: string, label: Localized): Item => ({ ...page(pageId), label });
  const stub = (path: string): Item => {
    const row = stubs.find((s) => s.path === path);
    if (!row) throw new Error(`Нет страницы ${path}`);
    return withTitle(row.id, row.title);
  };
  const link = (url: string, label: Localized): Item => ({ kind: "URL", url, label });
  const service = (url: string, label: string): Item => ({ kind: "URL", url, label: l(label, label, label), openInNewTab: true });

  const university = l("Университет", "Университет", "University");
  const education = l("Оқыту", "Обучение", "Education");
  const science = l("Ғылым", "Наука", "Research");
  const admission = l("Түсу", "Поступление", "Admissions");
  const students = l("Студенттерге", "Студентам", "Students");
  const rules = l("Қабылдау ережелері", "Правила приёма", "Admission rules");
  await addMenu("HEADER", [
    { kind: "GROUP", label: admission, children: [
      withTitle(pAdmission.id, rules),
      stub("admission/tuition-grants"),
      stub("admission/why-tau"),
      stub("admission/dormitory"),
      stub("admission/contacts"),
    ] },
    { kind: "GROUP", label: education, children: [
      link(`/degrees/${bachelor.slug}`, bachelor.name),
      link(`/degrees/${master.slug}`, master.name),
      link(`/degrees/${doctorate.slug}`, l("PhD докторантурасы", "Докторантура PhD", "PhD")),
      link(`/degrees/${mba.slug}`, mba.name),
      stub("education/additional"),
      section("faculties", l("Жоғары мектептер мен кафедралар", "Высшие школы и кафедры", "Schools and departments")),
      section("teachers"),
    ] },
    { kind: "GROUP", label: science, children: [
      stub("science/activity"),
      stub("science/centers"),
      stub("science/publications"),
      stub("science/young-scientists"),
      stub("science/events"),
      stub("innohub"),
    ] },
    { kind: "GROUP", label: students, children: [
      service("https://platonus.tau-edu.kz/", "PLATONUS"),
      stub("students/calendar"),
      stub("students/handbook"),
      stub("students/library"),
      stub("students/campus"),
      section("studentOrgs", l("Студенттік өмір", "Студенческая жизнь", "Student life")),
      stub("students/alumni"),
    ] },
    { kind: "GROUP", label: university, children: [
      withTitle(pAbout.id, pAbout.title),
      section("leadership", l("Басшылық және кеңестер", "Руководство и советы", "Leadership and councils")),
      section("offices", l("Құрылым", "Структура", "Structure")),
      stub("international"),
      section("documents", l("Құжаттар және аккредитация", "Документы и аккредитация", "Documents and accreditation")),
      stub("vacancies"),
      withTitle(pContacts.id, pContacts.title),
    ] },
    { kind: "GROUP", label: l("Жаңалықтар", "Новости", "News"), children: [
      section("news"),
      section("events", l("Іс-шаралар мен хабарландырулар", "События и объявления", "Events and announcements")),
      stub("rector-blog"),
    ] },
  ]);
  await addMenu("FOOTER", [
    { kind: "GROUP", label: university, children: [
      withTitle(pAbout.id, pAbout.title),
      section("leadership"),
      stub("about/councils"),
      stub("about/sustainability"),
      section("documents"),
      withTitle(pContacts.id, pContacts.title),
    ] },
    { kind: "GROUP", label: admission, children: [withTitle(pAdmission.id, rules), section("programs"), stub("admission/tuition-grants"), section("apply")] },
    { kind: "GROUP", label: l("Сервистер", "Сервисы", "Services"), children: [
      service("https://digital.tau-edu.kz/", "DIGITAL TAU"),
      service("https://digital.tau-edu.kz/ai-sana", "AI-SANA"),
      service("https://mooc.tau-edu.kz/", "MOOC"),
      service("https://platonus.tau-edu.kz/", "PLATONUS"),
      service("https://lib.tau-edu.kz", "e-Library"),
      stub("situation-center"),
    ] },
  ]);

  /* ----- Файлы ----- */
  const [folder] = await db.insert(mediaFolders).values({ name: "Нормативные документы", listed: true, isPublic: true }).returning();
  await db.insert(mediaFolders).values({ name: "Изображения сайта" });
  const uploads = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
  await mkdir(uploads, { recursive: true });
  const storageKey = `${randomUUID()}.txt`;
  const body = "Демонстрационный документ. Загрузите настоящие правила приёма через раздел «Файлы» в панели управления.\n";
  await writeFile(path.join(uploads, storageKey), body);
  await db.insert(mediaFiles).values({
    folderId: folder.id, name: "Правила приёма (образец).txt", storageKey, mime: "text/plain", size: Buffer.byteLength(body),
    title: l("Қабылдау ережелері (үлгі)", "Правила приёма (образец)", "Admission rules (sample)"),
  });
}

async function main() {
  await seedAdmin();
  const [{ total }] = await db.select({ total: count() }).from(faculties);
  if (total > 0) {
    console.log("Контент уже есть, наполнение пропущено");
  } else {
    await seedContent();
    await reindexAll();
    console.log("Демо-контент добавлен");
  }
  await closeDb();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
