(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const V = window.Viz || {};

  let factsOpened = 0;
  const STORAGE_KEY = "berlin1945_memory";

  /** Линейный путь: видео только после «Далее», без автопоказа по скроллу; прокрутка не дальше разрешённого блока. */
  let journeyScrollBoundary = null;
  let journeyScrollRaf = 0;

  function getMainChapters() {
    return $$("main .section.chapter");
  }

  function setJourneyScrollBoundary(sectionEl) {
    journeyScrollBoundary = sectionEl || null;
    scheduleJourneyClamp();
  }

  function getJourneyMaxScrollY() {
    if (!journeyScrollBoundary) return Number.POSITIVE_INFINITY;
    const el = journeyScrollBoundary;
    const bottom = el.offsetTop + el.offsetHeight;
    return Math.max(0, bottom - window.innerHeight);
  }

  function clampJourneyScroll() {
    journeyScrollRaf = 0;
    const maxY = getJourneyMaxScrollY();
    if (window.scrollY > maxY + 2) {
      window.scrollTo(0, maxY);
    }
  }

  function scheduleJourneyClamp() {
    if (journeyScrollRaf) return;
    journeyScrollRaf = requestAnimationFrame(() => {
      journeyScrollRaf = 0;
      clampJourneyScroll();
    });
  }

  function isChapterReachable(sectionEl) {
    if (!sectionEl || !journeyScrollBoundary) return true;
    const order = getMainChapters();
    const bi = order.indexOf(journeyScrollBoundary);
    const ti = order.indexOf(sectionEl);
    if (ti === -1 || bi === -1) return true;
    return ti <= bi;
  }

  function initJourneyScrollLock() {
    window.addEventListener("scroll", scheduleJourneyClamp, { passive: true });
    window.addEventListener("resize", scheduleJourneyClamp);
  }

  function updateFactCounter() {
    const el = $("#factsCount");
    if (el) el.textContent = String(factsOpened);
  }

  function openModal(title, bodyHtml, wide, modalId) {
    const backdrop = $("#modalBackdrop");
    const modalEl = backdrop?.querySelector(".modal");
    if (!backdrop || !modalEl) return;
    $("#pmpTooltip")?.classList.remove("open");
    $("#modalTitle").textContent = title;
    const bodyEl = $("#modalBody");
    bodyEl.innerHTML = bodyHtml;
    bodyEl.className = modalId && String(modalId).startsWith("pmp-") ? "modal-body--pmp" : "";
    modalEl.classList.toggle("modal--wide", !!wide);
    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    factsOpened++;
    updateFactCounter();
    document.body.style.overflow = "hidden";
    $$("#modalBody .viz-row__f").forEach((el) => {
      requestAnimationFrame(() => el.classList.add("viz-row__f--on"));
    });
  }

  function closeModal() {
    const backdrop = $("#modalBackdrop");
    if (!backdrop) return;
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function buildModals() {
    const br = V.barRow || (() => "");
    const dn = V.donut || (() => "");
    const sg = V.statGrid || (() => "");
    const cmp = V.compareTwo || (() => "");
    const fs = V.flowStep || (() => "");
    const mt = V.miniTimeline || (() => "");

    return {
      "san-loss": {
        wide: true,
        html:
          '<div class="modal-viz">' +
          dn(69, "max сутки<br/>1 Бел") +
          '<div class="modal-chart">' +
          br("1 Бел (сутки)", 69) +
          br("1 Укр (сутки)", 66) +
          br("2 Бел (сутки)", 31) +
          "</div></div>" +
          "<p class=\"modal-text\">Среднесуточные санитарные потери в ходе операции. За <strong>23 дня</strong> накопленно поражёнными в боях: 2-й Белорусский — <strong>6,5%</strong>, 1-й Белорусский — <strong>15,8%</strong>, 1-й Украинский — <strong>11,3%</strong> численности.</p>",
      },
      "battle-power": {
        wide: true,
        html:
          sg([
            { v: "~3,5 млн", l: "вовлечённых с обеих сторон" },
            { v: "7750", l: "танков и САУ" },
            { v: "~11 тыс.", l: "самолётов" },
            { v: "300 км", l: "ширина фронта" },
            { v: "464 тыс.", l: "штурмовали город" },
            { v: "1500", l: "танков и САУ у штурма" },
          ]) +
          '<div class="modal-chart" style="margin-top:1rem">' +
          br("Длительность (23 дня ≈ 100%)", 100) +
          "</div>" +
          "<p class=\"modal-text\">Три фронта, 18-я ВА ДД, Днепровская флотилия, часть Балтийского флота. Операция: <strong>16 апреля — 8 мая 1945</strong>.</p>",
      },
      "med-loss": {
        wide: true,
        html:
          '<div class="modal-viz modal-viz--split">' +
          dn(75, "потери медиков<br/>1 Бел") +
          dn(54, "потери медиков<br/>1 Укр") +
          "</div>" +
          '<div class="modal-chart">' +
          br("Укомплектованность врачами — 2 Бел", 89) +
          br("Укомплектованность врачами — 1 Бел", 89.2) +
          br("Укомплектованность врачами — 1 Укр", 92.1) +
          "</div>" +
          "<p class=\"modal-text\">Медицинская служба несёт потери наравне с боевыми частями; награждения отражают масштаб подвига.</p>",
      },
      "evac-0": {
        html:
          '<div class="modal-viz">' +
          fs("1", "Розыск", "санитары обходят здания, развалины и подвалы") +
          fs("2", "Вынос", "доставка раненых к ближайшему ПМП") +
          fs("3", "Оказание медицинской помощи", "в зависимости от показаний и условий боя") +
          "</div>" +
          "<p class=\"modal-text\">Для успешного розыска и выноса раненых в уличных боях создавались специальные <strong>«группы розыска» из санитаров</strong>. Они обходили все здания, развалины и подвалы — чтобы этапы лечения начинались вовремя.</p>",
      },
      "evac-sort": {
        wide: true,
        html:
          sg([
            { v: "Куда", l: "какой этап нужен" },
            { v: "Очередь", l: "кто нуждается в помощи первым" },
            { v: "Положение", l: "сидя / лёжа" },
            { v: "Транспорт", l: "вид эвакуации" },
          ]) +
          '<div class="modal-viz" style="margin-top:1rem">' +
          fs("1", "Осмотр", "распределение по виду поражения и состоянию, определение следующего этапа") +
          fs("2", "Маркировка", "цветные маркеры на одежде") +
          fs("3", "Учет", "данные в карточке передового района") +
          "</div>" +
          "<p class=\"modal-text\">Сортировка — не «бумажная» формальность: она даёт точный ответ <strong>кому, куда, в какой очередности</strong> и <strong>в каком положении</strong> отправлять дальше, включая вид транспорта. Задачи выполняла <strong>сортировочная группа</strong>, обязательно с опытным хирургом; результаты закреплялись в медкарточке и отмечались цветными маркерами. Принципы сортировки восходят к <strong>Н. И. Пирогову</strong>.</p>",
      },
      "evac-1": {
        wide: true,
        html:
          "<p class=\"modal-text\">В ходе <strong>Берлинской операции</strong> объем работы по оказанию медицинской помощи раненым, поступавшим на ПМП, был исключительно велик:</p>" +
          sg([
            { v: "68,3%", l: "1-й Белорусский фронт: на ПМП за первые 2 часа" },
            { v: "84,8%", l: "1-й Украинский фронт: за первые 3 часа" },
            { v: "83,3%", l: "2-й Белорусский фронт: за первые 3 часа" },
            { v: "1-й этап", l: "первая врачебная помощь + сортировка" },
          ]) +
          '<div class="modal-viz" style="margin-top:1rem">' +
          fs("A", "Неотложно", "асфиксия, кровотечение, герметическая повязка") +
          fs("B", "Иммобилизация", "при переломах и травмах") +
          fs("C", "Оформление документов", "регистрация и карточка передового района") +
          "</div>" +
          "<p class=\"modal-text\">ПМП — точка, где время спасает жизнь: раннее вмешательство и грамотная сортировка задают успех всей дальнейшей эвакуации.</p>",
      },
      "evac-2": {
        wide: true,
        html:
          sg([
            { v: "50–60%", l: "всех нуждавшихся в хирургии оперировали в МСБ во время Берлинской операции" },
            { v: "52,7%", l: "оперируемость на ДМП 1-го Украинского фронта" },
            { v: "53%", l: "оперируемость на ДМП 1-го Белорусского фронта" },
            { v: "46,6%", l: "оперируемость на ДМП 2-го Белорусского фронта" },
          ]) +
          '<div class="modal-viz modal-viz--split" style="margin-top:1rem">' +
          dn(92.7, "пневмоторакс<br/>оперирован<br/>1-й Укр") +
          dn(83.3, "пневмоторакс<br/>оперирован<br/>1-й Бел") +
          "</div>" +
          "<p class=\"modal-text\">МСБ — «главные операционные войскового района». Ключевое звено в организации военно-медицинской службы Красной армии.</p>",
      },
      "evac-3": {
        wide: true,
        html:
          sg([
            { v: "2,5–3,5%", l: "контуженые в Великую Отечественную войну (к общему числу потерь)" },
            { v: "62%", l: "выписка контуженых после лечения во время Берлинской операции" },
            { v: "Специализированная медицинская помощь", l: "невропсихиатрические и профильные отделения" },
          ], "viz-stat-grid--cols-3") +
          '<div class="modal-viz" style="margin-top:1rem">' +
          fs("1", "Специализация", "распределение по характеру поражения") +
          fs("2", "Лечение", "специализированная помощь") +
          fs("3", "Результаты", "возвращение в строй / дальнейшая эвакуация") +
          "</div>" +
          "<p class=\"modal-text\">Данный этап завершал лечение «по назначению» и был направлен на сокращение лишней эвакуации за пределы фронта.</p>",
      },
      "evac-4": {
        wide: true,
        html:
          sg([
            { v: "Гужевой", l: "лошади, собаки" },
            { v: "Автомобильный", l: "легковые и грузовые автомобили" },
            { v: "Железнодорожный", l: "военно-санитарные поезда и летучки" },
            { v: "Водный", l: "лодки, баржи, суда (щадящая эвакуация)" },
            { v: "Авиационный", l: "самолёты разных типов" },
          ], "viz-stat-grid--transport") +
          '<div class="modal-viz" style="margin-top:1rem">' +
          fs("1", "Сортировка", "определение очереди, положения и транспорта") +
          fs("2", "Погрузка", "сидя/лёжа по тяжести и профилю") +
          fs("3", "Эвакуация", "в армейские, фронтовые или тыловые учреждения") +
          "</div>"
      },
      "pmp-receive": {
        wide: true,
        html:
          sg([
            { v: "68,3%", l: "1-й Белорусский фронт: первые 2 ч" },
            { v: "84,8%", l: "1-й Украинский фронт: первые 3 ч" },
            { v: "83,3%", l: "2-й Белорусский фронт: за то же время" },
            { v: "Проверка", l: "осмотр → сортировка → регистрация" },
          ]) +
          '<div class="modal-viz" style="margin-top:1rem">' +
          fs("Кому", "распределить по состоянию", "очередь помощи") +
          fs("Куда", "назначение следующего этапа", "рациональная эвакуация") +
          fs("Как", "положение и транспорт", "сидя / лёжа") +
          "</div>" +
          "<p class=\"modal-text\">Приемно-сортировочное отделение на ПМП принимало раненых, проводило осмотр и закрепляло решения в медицинских карточках передового района.</p>",
      },
      "pmp-dressing": {
        wide: true,
        html:
          sg([
            { v: "68,2%", l: "перевязки (3-я гв. армия)" },
            { v: "15,7%", l: "первичные перевязки" },
            { v: "20,4%", l: "иммобилизации (2 Бел)" },
            { v: "4,8%", l: "переливания крови (2 Бел)" },
          ]) +
          "<p class=\"modal-text\">Первая врачебная помощь включала устранение асфиксии, временную остановку наружного кровотечения, герметическую повязку при открытом пневмотораксе и иммобилизацию при переломах.</p>",
      },
      "pmp-evac": {
        wide: true,
        html:
          sg([
            { v: "Куда", l: "в какой этап" },
            { v: "В очередь", l: "кому быстрее" },
            { v: "Как эвакуировать", l: "сидя / лёжа + транспорт" },
            { v: "Фиксация", l: "цветные маркеры + медкарточка" },
          ]) +
          "<p class=\"modal-text\">Эвакуационное отделение на ПМП помогало организовать рациональную эвакуацию по назначению: решение принималось в сортировке и затем выполнялось на практике.</p>",
      },
      "pmp-isolator": {
        wide: true,
        html:
          sg(
            [
              { v: "По показаниям", l: "наблюдение / ограничение" },
              { v: "Чтобы не мешать", l: "бережём поток помощи" },
              { v: "Контакты", l: "ограничение пересечений с другими ранеными" },
            ],
            "viz-stat-grid--cols-3"
          ) +
          "<p class=\"modal-text\">Изолятор использовался как отдельная зона, чтобы работа остальных подразделений не распадалась в условиях массового поступления.</p>",
      },
      "pmp-pharmacy": {
        wide: true,
        html:
          sg([
            { v: "Лекарства", l: "медикаменты" },
            { v: "Перевязка", l: "материалы и расходники" },
            { v: "Снабжение", l: "поддержка лечения" },
            { v: "Связь с асептикой", l: "стерильность и контроль" },
          ]) +
          "<p class=\"modal-text\">Аптека обеспечивала медицинское снабжение ПМП — без этого невозможны ни перевязки, ни профилактика раневой инфекции.</p>",
      },
      "pmp-transport": {
        wide: true,
        html:
          sg([
            { v: "Поток", l: "подвоз и погрузка" },
            { v: "После сортировки", l: "направление дальше" },
            { v: "Очередь", l: "по назначению" },
            { v: "Положение", l: "сидя / лёжа" },
          ]) +
          "<div class=\"modal-viz\" style=\"margin-top:1rem\">" +
          fs("Точка", "где собирают носилки", "перед отправкой") +
          fs("Решение", "формируется в сортировке", "кому дальше") +
          fs("Движение", "эвакуация по назначению", "к этапу") +
          "</div>" +
          "<p class=\"modal-text\">Площадка транспорта на схеме — это «узел движения»: отсюда начинается практическое выполнение решений сортировочной.</p>",
      },
      "pmp-kitchen": {
        wide: true,
        html:
          sg(
            [
              { v: "Непрерывность", l: "работа отделений в смену" },
              { v: "Полевые условия", l: "минимум лишнего" },
              { v: "Забота", l: "о людях, которые спасают других" },
            ],
            "viz-stat-grid--cols-3"
          ) +
          "<p class=\"modal-text\">Кухня обеспечивает персоналу питание и позволяет держать непрерывный цикл работы ПМП.</p>",
      },
      "pmp-osadok": {
        wide: true,
        html:
          sg(
            [
              { v: "Санитария", l: "поддержание порядка" },
              { v: "Безопасность", l: "уменьшение риска инфекции" },
              { v: "В тылу этапов", l: "сохраняет рабочую зону" },
            ],
            "viz-stat-grid--cols-3"
          ) +
          "<p class=\"modal-text\">На схеме «Осадочник» обозначает санитарный элемент обеспечения: он помогает поддерживать чистоту и безопасность в условиях массового поступления.</p>",
      },
      "pmp-bunkers": {
        wide: true,
        html:
          sg(
            [
              { v: "Защита", l: "от огня и обстрела" },
              { v: "Дисциплина", l: "работа без срывов" },
              { v: "Команда", l: "сохранение сил медиков" },
            ],
            "viz-stat-grid--cols-3"
          ) +
          "<p class=\"modal-text\">Блиндажи личного состава нужны, чтобы медики могли пережить обстрел и продолжить работу этапов.</p>",
      },
      "art-chehol": {
        html:
          '<div class="modal-viz">' +
          fs("НКО", "Склад № 320", "поступление комплекта") +
          fs("Стериль", "Кипячение / сухой жар", "инструмент перед операцией") +
          fs("Поле", "Полковой набор", "1943 год") +
          "</div>" +
          "<p class=\"modal-text\">Чехол набора полкового (хирургических инструментов) ВСС РККА.</p>",
      },
      "art-inst": {
        html:
          "<p class=\"modal-text\">Предмет из фондов музея. Инструменты проходили стерилизацию кипячением, прокаливанием или паром — иначе невозможна была асептика в палатке или подвале.</p>",
      },
      "brigades": {
        wide: true,
        html:
          mt([
            { d: "Янв. 1945", t: "Две бригады ВММ для наступления" },
            { d: "Фото", t: "В. С. Фаминский, Е. С. Микулина" },
            { d: "Живопись", t: "Е. А. Львов, Н. Г. Козлов, Н. Г. Яковлев" },
            { d: "Медики", t: "С. М. Рогачевский, Н. Д. Струнин" },
          ]) +
          "<p class=\"modal-text\">Традиция дореволюционной «светописи» и полевых зарисовок продолжена на финише войны.</p>",
      },
      "person-akhutin": {
        html:
          '<div class="modal-viz">' + fs("Фронт", "Главный хирург", "руководство и операции в Берлине") + "</div>" +
          "<p class=\"modal-text\"><strong>М. Н. Ахутин</strong> — лично оперировал и координировал помощь в Берлинской операции.</p>",
      },
      "person-napalkov": {
        html:
          '<div class="modal-viz">' + fs("Тяжёлые", "Грудь, голова", "сложнейшие вмешательства") + "</div>" +
          "<p class=\"modal-text\"><strong>П. Н. Напалков</strong>.</p>",
      },
      "person-popov": {
        html:
          '<div class="modal-viz">' + fs("Этапы", "Эвакуация по назначению", "непрерывность цепочки") + "</div>" +
          "<p class=\"modal-text\"><strong>В. И. Попов</strong>.</p>",
      },
      "person-sisters": {
        wide: true,
        html:
          sg([
            { v: "1–2 ч", l: "до приёма раненых после передислокации ДМП" },
            { v: "24/7", l: "режим в пик боёв" },
            { v: "1000+", l: "писем благодарности от вернувшихся в строй" },
          ]) +
          "<p class=\"modal-text\">Сортировочные, перевязочные, операционные, эвакопоезда и суда. Медсёстры — неотъемлемая часть цепочки Пирогова.</p>",
      },
      "art-sisters": {
        wide: true,
        html:
          sg([
            { v: "17", l: "Герои СССР (санинструкторы и сёстры)" },
            { v: "26", l: "медаль Флоренс Найтингейл" },
          ]) +
          "<p class=\"modal-text\">Тысячи писем благодарности от вернувшихся в строй.</p>",
      },
      "dash-1": {
        html: dn(7.5, "потери медиков") + "<p class=\"modal-text\">1-й Белорусский: каждый примерно <strong>13-й</strong> медик выбыл из строя.</p>",
      },
      "dash-2": {
        html: dn(5.4, "потери медиков") + "<p class=\"modal-text\">1-й Украинский: каждый примерно <strong>18-й</strong>.</p>",
      },
      "dash-3": {
        html: dn(18, "ранения головы и шеи") + "<p class=\"modal-text\">5-я ударная армия, 1-й Белорусский — анатомия уличного боя.</p>",
      },
      "dash-4": {
        html: dn(92.7, "пневмоторакс оперирован") + "<p class=\"modal-text\">1-й Украинский фронт, дивизионные пункты.</p>",
      },
      "dash-5": {
        html: dn(62, "возврат в строй") + "<p class=\"modal-text\">Контуженые после лечения в спецучреждениях.</p>",
      },
      "dash-6": {
        wide: true,
        html:
          '<div class="modal-chart">' +
          br("1 Бел за 2 ч", 68.3) +
          br("1 Укр за 3 ч", 84.8) +
          br("2 Бел за 3 ч", 83.3) +
          "</div>" +
          "<p class=\"modal-text\">Скорость доставки на ПМП — показатель работы санитарной службы в наступлении.</p>",
      },
      "dash-pmp-work": {
        wide: true,
        html:
          '<div class="modal-chart">' +
          br("Перевязки (3 гв. армия)", 68.2) +
          br("Иммобилизации (2 Бел)", 20.4) +
          br("Переливание крови", 4.8) +
          br("Футлярная анестезия", 4.4) +
          "</div>" +
          "<p class=\"modal-text\">Структура вмешательств на ПМП по данным фронтов.</p>",
      },
      "dash-msb-share": {
        html:
          dn(55, "операций в МСБ") +
          "<p class=\"modal-text\">Около половины всех нуждавшихся в хирургии проходили через дивизионные медпункты (МСБ).</p>",
      },
      "dash-evac-prisoners": {
        wide: true,
        html:
          '<div class="modal-chart">' +
          br("В немецких лазаретах", 78.7) +
          br("В армейских госпиталях", 21.3) +
          "</div>" +
          "<p class=\"modal-text\">Из <strong>33 720</strong> раненых и больных военнопленных в армейских госпиталях оказалось <strong>7 175</strong> (21,3%), остальные — в сохранённых немецких учреждениях под контролем.</p>",
      },
    };
  }

  const MODAL_META = buildModals();

  const MODAL_TITLES = {
    "san-loss": "Санитарные потери",
    "battle-power": "Масштаб операции",
    "med-loss": "Медики на фронте",
    "evac-0": "Поле боя и розыск",
    "evac-sort": "Медицинская сортировка",
    "evac-1": "Полковой медпункт (ПМП)",
    "evac-2": "Медико-санитарный батальон (медсанбат) (МСБ)",
    "evac-3": "Госпиталь",
    "evac-4": "Санитарный транспорт",
    "pmp-receive": "Приемно-сортировочное отделение (ПМП)",
    "pmp-dressing": "Перевязочное отделение (ПМП)",
    "pmp-evac": "Эвакуационное отделение (ПМП)",
    "pmp-isolator": "Изолятор (ПМП)",
    "pmp-pharmacy": "Аптека (ПМП)",
    "pmp-transport": "Площадка транспорта (ПМП)",
    "pmp-kitchen": "Кухня (ПМП)",
    "pmp-osadok": "Осадочник (ПМП)",
    "pmp-bunkers": "Блиндажи личного состава (ПМП)",
    "art-chehol": "Чехол набора полкового, 1943",
    "art-inst": "Хирургический инструмент",
    "brigades": "Бригады музея на фронте",
    "person-akhutin": "М. Н. Ахутин",
    "person-napalkov": "П. Н. Напалков",
    "person-popov": "В. И. Попов",
    "person-sisters": "Медицинские сёстры",
    "art-sisters": "Награды",
    "dash-1": "Потери медиков: 1-й Белорусский",
    "dash-2": "Потери медиков: 1-й Украинский",
    "dash-3": "Ранения головы и шеи",
    "dash-4": "Пневмоторакс на ДМП",
    "dash-5": "Исход лечения контуженых",
    "dash-6": "Скорость эвакуации на ПМП",
    "dash-pmp-work": "Что делали на ПМП",
    "dash-msb-share": "Доля операций в МСБ",
    "dash-evac-prisoners": "Пленные: где лечили",
  };

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Модалка витрины: слева фото (или заглушка), справа подпись из .artifact-card__cap */
  function buildInstrumentArtifactModal(artCard) {
    const img = artCard.querySelector("img");
    const place = artCard.querySelector(".artifact-card__placeholder");
    const capEl = artCard.querySelector(".artifact-card__cap");
    const cap = capEl ? capEl.textContent.trim() : "";
    const imgOk = img && img.offsetParent !== null && img.getAttribute("src");
    let photoHtml;
    if (imgOk) {
      const src = img.getAttribute("src") || "";
      const altRaw = (img.getAttribute("alt") || "").trim() || cap.slice(0, 240);
      const alt = altRaw.length > 240 ? altRaw.slice(0, 237) + "…" : altRaw;
      photoHtml =
        '<div class="artifact-modal__photo">' +
        '<img src="' +
        escapeHtml(src) +
        '" alt="' +
        escapeHtml(alt) +
        '" loading="lazy" decoding="async" />' +
        "</div>";
    } else {
      const ph = place ? place.textContent.trim() : "";
      photoHtml =
        '<div class="artifact-modal__photo artifact-modal__photo--empty"><span>' +
        escapeHtml(ph || "Файл изображения не найден") +
        "</span></div>";
    }
    return (
      '<div class="artifact-modal">' +
      photoHtml +
      '<div class="artifact-modal__text"><p class="artifact-modal__cap">' +
      escapeHtml(cap) +
      "</p></div></div>"
    );
  }

  function bindModalTriggers() {
    document.addEventListener("click", (e) => {
      const artCard = e.target.closest("[data-inst-strip] .artifact-card");
      if (artCard) {
        e.preventDefault();
        const title = artCard.getAttribute("aria-label") || "Экспонат";
        openModal(title, buildInstrumentArtifactModal(artCard), true);
        return;
      }
      const t = e.target.closest("[data-modal]");
      if (t) {
        e.preventDefault();
        const id = t.dataset.modal;
        const title = MODAL_TITLES[id] || "Факт";
        const meta = MODAL_META[id];
        const body = meta ? meta.html : "<p class=\"modal-text\">Материал уточняется.</p>";
        const wide = meta?.wide;
        openModal(title, body, wide, id);
      }
    });
    $("#modalBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "modalBackdrop") closeModal();
    });
    $("#modalClose")?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  function intro() {
    const introEl = $("#intro");
    $("#enterEra")?.addEventListener("click", () => {
      introEl?.classList.add("hidden");
      sessionStorage.setItem("berlin1945_entered", "1");
    });
    if (sessionStorage.getItem("berlin1945_entered")) {
      introEl?.classList.add("hidden");
    }
  }

  function animateCharts() {
    const fills = $$(".chart-row__fill, .viz-row__f");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("animate");
            en.target.classList.add("viz-row__f--on");
          }
        });
      },
      { threshold: 0.15 }
    );
    fills.forEach((f) => obs.observe(f));
  }

  /* Вертикальный таймлайн хроники */
  const CHRONICLE = [
    { date: "16 апр", title: "Старт операции", text: "Три фронта; за 23 дня продвижение на Запад 100–220 км; фронт до 300 км." },
    { date: "24 апр", title: "Окружение Берлина", text: "Войска 1-го Белорусского и 1-го Украинского занимают районы. Каждый дом — штурмом." },
    { date: "26 апр", title: "МСБ № 599", text: "94-я стрелковая дивизия; дислокация медсанбата в руинах столицы." },
    { date: "30 апр", title: "Знамя над Рейхстагом", text: "М. А. Егоров и М. В. Кантария, 3-я ударная армия." },
    { date: "2 мая", title: "Капитуляция гарнизона", text: "8 дней уличных боёв: метро, подвалы, рукопашная." },
    { date: "8 мая", title: "Акт в Карлсхорсте", text: "Безоговорочная капитуляция; война в Европе окончена." },
  ];

  function renderChronicle() {
    const host = $("#chronicleTimeline");
    if (!host) return;
    host.innerHTML = CHRONICLE.map(
      (ev, i) =>
        `<div class="chronicle-node" style="--d:${i}">` +
        `<button type="button" class="chronicle-dot" aria-expanded="${i === 0 ? "true" : "false"}" aria-controls="chronicle-panel-${i}" id="chronicle-btn-${i}"></button>` +
        `<div class="chronicle-card" id="chronicle-panel-${i}" ${i === 0 ? "" : "hidden"}>` +
        `<time>${ev.date}</time><h3>${ev.title}</h3><p>${ev.text}</p></div></div>`
    ).join("");

    host.addEventListener("click", (e) => {
      const btn = e.target.closest(".chronicle-dot");
      if (!btn) return;
      const node = btn.closest(".chronicle-node");
      const card = node?.querySelector(".chronicle-card");
      if (!card) return;
      const wasOpen = !card.hidden;
      $$(".chronicle-card", host).forEach((c) => {
        c.hidden = true;
      });
      $$(".chronicle-dot", host).forEach((b) => b.setAttribute("aria-expanded", "false"));
      if (!wasOpen) {
        card.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  function streetPath() {
    const nodes = $$(".street-node");
    const challengeEl = $("#streetChallenge");
    const choicesEl = $("#streetChoices");
    const advanceBtn = $("#streetAdvance");
    if (!nodes.length || !challengeEl || !choicesEl || !advanceBtn) return;

    const STREET_CHALLENGES = [
      {
        q: "Как строилась помощь военных медиков на фронте?",
        options: [
          { t: "Без этапов: сразу в тыл без сортировки", ok: false },
          { t: "Этапное лечение с эвакуацией по назначению (Пирогов)", ok: true },
          { t: "Только лечение на поле боя", ok: false },
        ],
      },
      {
        q: "Кто помогал находить раненых в уличных боях?",
        options: [
          { t: "Только врачи в госпитале", ok: false },
          { t: "Специальные «группы розыска» из санитаров", ok: true },
          { t: "Только разведчики", ok: false },
        ],
      },
      {
        q: "Где развертывались ПМП и МСБ при штурме Берлина?",
        options: [
          { t: "Вдали от фронта, без перемещений", ok: false },
          { t: "В зданиях города, которые медики сами ремонтировали", ok: true },
          { t: "Только в дальних лагерях тыла", ok: false },
        ],
      },
    ];

    let step = 0;
    let answered = false;

    function setNodes() {
      nodes.forEach((n, i) => {
        n.classList.remove("current", "done");
        if (i < step) n.classList.add("done");
        if (i === step) n.classList.add("current");
      });
    }

    function showChallenge() {
      answered = false;
      advanceBtn.disabled = true;
      advanceBtn.textContent = "Дальше по маршруту";
      if (step >= STREET_CHALLENGES.length) {
        challengeEl.textContent = "Этап пройден. Дальше — эвакуация и инструменты.";
        choicesEl.innerHTML = "";
        advanceBtn.textContent = "К эвакуации";
        advanceBtn.disabled = false;
        return;
      }
      const ch = STREET_CHALLENGES[step];
      challengeEl.textContent = ch.q;
      choicesEl.innerHTML = "";
      ch.options.forEach((opt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice-btn";
        b.textContent = opt.t;
        b.addEventListener("click", () => {
          if (answered) return;
          answered = true;
          $$(".choice-btn", choicesEl).forEach((btn) => {
            btn.disabled = true;
            const ok = ch.options.find((o) => o.t === btn.textContent)?.ok;
            btn.classList.add(ok ? "correct" : "wrong");
          });
          advanceBtn.disabled = false;
        });
        choicesEl.appendChild(b);
      });
    }

    advanceBtn.addEventListener("click", () => {
      if (step >= STREET_CHALLENGES.length) {
        document.getElementById("evakuaciya")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (!answered) return;
      step++;
      setNodes();
      showChallenge();
    });

    setNodes();
    showChallenge();
  }

  function memoryBook() {
    const input = $("#memoryName");
    const btn = $("#memorySubmit");
    const list = $("#memoryList");
    if (!input || !btn || !list) return;

    function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        list.innerHTML =
          arr
            .slice(-20)
            .reverse()
            .map((n) => "— " + escapeHtml(n))
            .join("<br>") || "<span style='opacity:0.5'>Пока нет записей</span>";
      } catch {
        list.textContent = "";
      }
    }

    btn.addEventListener("click", () => {
      const name = input.value.trim();
      if (name.length < 2) return;
      let arr = [];
      try {
        arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch {
        arr = [];
      }
      arr.push(name + " · " + new Date().toLocaleString("ru-RU"));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      input.value = "";
      load();
    });
    load();
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function checkHeroImage() {
    const hero = $(".hero-panorama");
    const img = new Image();
    img.onload = () => hero?.classList.remove("hero-panorama--fallback");
    img.onerror = () => hero?.classList.add("hero-panorama--fallback");
    img.src = "assets/panorama-msb599-26apr.jpg";
  }

  function checkScheme() {
    const sc = $("#pmpDiagram");
    const imgEl = $("#pmpDiagramImg");
    const img = new Image();
    img.onload = () => {
      sc?.classList.remove("evac-scheme--empty");
    };
    img.onerror = () => sc?.classList.add("evac-scheme--empty");
    img.src = "assets/scheme-pmp.jpg";
  }

  function setupPmpDiagram() {
    const host = $("#pmpImgWrap");
    const tooltip = $("#pmpTooltip");
    if (!host || !tooltip) return;

    const TIP_DATA = {
      "pmp-receive": {
        title: "Приемно-сортировочная",
        body:
          "Сортировка распределяет раненых по виду поражения, очередности и положению. Данные фиксируются в медицинских карточках передового района.",
      },
      "pmp-dressing": {
        title: "Перевязочная",
        body:
          "Здесь выполнялись перевязки и неотложные манипуляции. На ПМП 3-й гвардейской армии 1-го Украинского фронта перевязки составляли 68,2% (в т.ч. первичные 15,7%).",
      },
      "pmp-evac": {
        title: "Эвакуационное отделение",
        body:
          "Организация отправки: куда дальше, в какой очереди и в каком положении (сидя/лёжа) — с учетом рациональной эвакуации по назначению.",
      },
      "pmp-isolator": {
        title: "Изолятор",
        body:
          "Отдельная зона для раненых, нуждающихся в наблюдении/ограничении контактов. Это помогает сохранить порядок работы этапов в тяжелой боевой обстановке.",
      },
      "pmp-transport": {
        title: "Площадка транспорта",
        body:
          "Место для подвозки и погрузки: раненых и носилки направляли дальше после решений сортировки. Там удобнее всего организовать поток эвакуации по назначению.",
      },
      "pmp-kitchen": {
        title: "Кухня",
        body:
          "Питание и быт персонала ПМП в полевых условиях. Без этого нельзя держать непрерывную работу отделений и заботиться о раненых в длительную смену.",
      },
      "pmp-osadok": {
        title: "Осадочник",
        body:
          "Элемент санитарного обеспечения на схеме: зона для сбора/очистки стоков и поддержания порядка при массовом поступлении раненых.",
      },
      "pmp-bunkers": {
        title: "Блиндажи личного состава",
        body:
          "Укрытия для персонала ПМП. Они позволяют сохранять работу отделений и защищают личный состав во время огневого воздействия.",
      },
    };

    const spots = $$(".pmp-hotspot", host);
    if (!spots.length) return;

    function positionTooltip(btn) {
      const br = btn.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      const hostW = hr.width;
      const hostH = hr.height;
      const margin = 10;

      const tipW = tooltip.offsetWidth;
      const tipH = tooltip.offsetHeight;
      const half = tipW / 2;

      const rawX = br.left - hr.left + br.width / 2;
      const minX = half + margin;
      const maxX = hostW - half - margin;
      const x = Math.min(Math.max(rawX, minX), maxX);

      const aboveY = br.top - hr.top - 8;
      const belowY = br.bottom - hr.top + 8;
      const fitsAbove = aboveY - tipH >= margin;
      const fitsBelow = belowY + tipH <= hostH - margin;

      tooltip.style.left = x + "px";
      if (fitsAbove || !fitsBelow) {
        // Нижний край тултипа — в aboveY; не даём уехать выше контейнера (overflow у .evac-scheme)
        const topAnchored = Math.max(aboveY, margin + tipH);
        tooltip.style.top = topAnchored + "px";
        tooltip.style.transform = "translate(-50%, -100%)";
      } else {
        const topAnchored = Math.min(belowY, hostH - margin - tipH);
        tooltip.style.top = topAnchored + "px";
        tooltip.style.transform = "translate(-50%, 0)";
      }
    }

    function show(btn) {
      const id = btn.dataset.hotspot;
      const tip = TIP_DATA[id];
      if (!tip) return;
      tooltip.innerHTML = "<strong>" + tip.title + "</strong><p>" + tip.body + "</p>";
      tooltip.classList.add("open");
      positionTooltip(btn);
      requestAnimationFrame(() => positionTooltip(btn));
    }

    function hide() {
      tooltip.classList.remove("open");
      tooltip.style.transform = "translate(-50%, -100%)";
    }

    spots.forEach((btn) => {
      btn.addEventListener("mouseenter", () => show(btn));
      btn.addEventListener("mouseleave", hide);
      btn.addEventListener("focus", () => show(btn));
      btn.addEventListener("blur", hide);
      btn.addEventListener("click", hide);
    });
  }

  let openLockedStage = null;

  function initChapters() {
    const entrySections = $$(".chapter[data-stage-entry=\"true\"]");

    const playOverlayVideo = (video, section) => {
      if (!video) return;
      video.controls = false;
      video.muted = true;
      video.loop = section && section.id === "masshtab";
      video.autoplay = true;
      video.playsInline = true;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Autoplay may be blocked on some devices.
        });
      }
    };

    const unlockSection = (section, opts = {}) => {
      const { scrollToPanel = false } = opts;
      if (!section) return;
      const overlay = section.querySelector(".chapter-overlay");
      const video = section.querySelector(".chapter-video");
      section.classList.add("chapter--unlocked");
      section.classList.remove("chapter--stage-open");
      if (overlay) overlay.setAttribute("aria-hidden", "true");
      if (video) video.pause();
      if (!$$(".chapter--stage-open").length) {
        document.body.classList.remove("stage-overlay-open");
      }
      if (section.dataset.stageEntry === "true") {
        if (section.id === "geroi") {
          setJourneyScrollBoundary(null);
        } else {
          const afterVideoUntilSel = {
            masshtab: "#evakuaciya",
            /* После хирургии — только до конца этого раздела; #gumanizm открывается кнопкой «Далее». */
            instrumenty: "#instrumenty",
            transport: "#transport",
          }[section.id];
          const untilEl = afterVideoUntilSel ? $(afterVideoUntilSel) : null;
          setJourneyScrollBoundary(untilEl || section);
        }
      }
      scheduleJourneyClamp();
      if (scrollToPanel) {
        const panel = section.querySelector(".chapter-panel");
        if (panel) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              panel.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          });
        }
      }
    };

    const openStage = (section, opts = {}) => {
      if (!section || section.classList.contains("chapter--unlocked")) return;
      const { scroll = true } = opts;

      entrySections.forEach((entry) => {
        const isTarget = entry === section;
        entry.classList.toggle("chapter--stage-open", isTarget && !entry.classList.contains("chapter--unlocked"));
        const overlay = entry.querySelector(".chapter-overlay");
        if (overlay) overlay.setAttribute("aria-hidden", isTarget ? "false" : "true");
      });

      const video = section.querySelector(".chapter-video");
      const overlay = section.querySelector(".chapter-overlay");
      const hint = section.querySelector(".chapter-overlay__hint");
      if (hint) {
        hint.dataset.typed = "false";
        hint.dataset.typing = "false";
        hint.textContent = "";
      }
      playOverlayVideo(video, section);
      typeStageHint(hint);
      document.body.classList.add("stage-overlay-open");

      if (scroll) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    $$(".chapter").forEach((section) => {
      const overlay = section.querySelector(".chapter-overlay");
      const video = section.querySelector(".chapter-video");
      const skipBtn = section.querySelector(".chapter-skip");
      const stageVideo = section.dataset.stageVideo;
      const isEntry = section.dataset.stageEntry === "true";
      if (overlay && !overlay.querySelector(".chapter-overlay__cinema-bars")) {
        const bars = document.createElement("div");
        bars.className = "chapter-overlay__cinema-bars";
        overlay.prepend(bars);
      }

      if (video && stageVideo) {
        video.preload = "auto";
        video.src = stageVideo;
        video.loop = section.id === "masshtab";
        video.load();
      }

      if (!overlay) return;

      if (!isEntry) {
        unlockSection(section);
        return;
      }

      if (skipBtn && !skipBtn.querySelector(".chapter-skip__arrow")) {
        const arrow = document.createElement("span");
        arrow.className = "chapter-skip__arrow";
        arrow.setAttribute("aria-hidden", "true");
        skipBtn.appendChild(arrow);
      }

      section.classList.remove("chapter--unlocked");
      section.classList.remove("chapter--stage-open");
      overlay.setAttribute("aria-hidden", "true");
      if (video) video.onended = null;
      skipBtn?.addEventListener("click", () => unlockSection(section, { scrollToPanel: true }));
      video?.addEventListener("ended", () => {
        if (section.classList.contains("chapter--unlocked")) return;
        if (!section.classList.contains("chapter--stage-open")) return;
        unlockSection(section, { scrollToPanel: true });
      });
      video?.addEventListener(
        "error",
        () => {
          overlay.classList.add("chapter-overlay--no-video");
          const hint = section.querySelector(".chapter-overlay__hint");
          if (hint && !hint.dataset.fullText) {
            hint.dataset.fullText = "Видео этапа временно недоступно.";
          }
          if (hint) {
            hint.textContent = hint.dataset.fullText || "Видео этапа временно недоступно.";
          }
        },
        { once: true }
      );
    });

    openLockedStage = openStage;

    if (entrySections.length) {
      openStage(entrySections[0], { scroll: false });
      setJourneyScrollBoundary(entrySections[0]);
    }
  }

  function typeStageHint(hintEl) {
    if (!hintEl || hintEl.dataset.typed === "true" || hintEl.dataset.typing === "true") return;
    const fullText = hintEl.dataset.fullText || hintEl.textContent.trim();
    if (!fullText) return;

    hintEl.textContent = "";
    hintEl.dataset.typing = "true";
    hintEl.classList.add("is-typing");

    let idx = 0;
    const speedMs = 22;

    const step = () => {
      idx++;
      hintEl.textContent = fullText.slice(0, idx);
      if (idx < fullText.length) {
        window.setTimeout(step, speedMs);
        return;
      }
      hintEl.dataset.typing = "false";
      hintEl.dataset.typed = "true";
      hintEl.classList.remove("is-typing");
    };

    step();
  }

  function initStageTyping() {
    $$(".chapter[data-stage-entry=\"true\"]").forEach((section) => {
      const hint = section.querySelector(".chapter-overlay__hint");
      if (!hint) return;
      const rawText = hint.textContent.trim();
      if (rawText) {
        hint.dataset.fullText = rawText;
      }
      // Keep fallback text when no typing starts.
      hint.textContent = hint.dataset.fullText || rawText;
      hint.dataset.typed = "false";
      hint.dataset.typing = "false";
    });
  }

  function initStageNextButtons() {
    $$("[data-next-stage]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetSel = btn.dataset.nextStage;
        if (!targetSel) return;
        const nextSection = document.querySelector(targetSel);
        if (!nextSection) return;
        const isLockedStage = nextSection.dataset.stageEntry === "true" && !nextSection.classList.contains("chapter--unlocked");
        if (isLockedStage && typeof openLockedStage === "function") {
          openLockedStage(nextSection);
        } else {
          setJourneyScrollBoundary(nextSection);
          nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        btn.closest(".stage-next")?.remove();
      });
    });

    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href^=\"#\"]");
      if (!link) return;
      const targetSel = link.getAttribute("href");
      if (!targetSel || targetSel.length < 2) return;
      const section = document.querySelector(targetSel);
      if (!section) return;
      if (!isChapterReachable(section)) {
        e.preventDefault();
        return;
      }
      const isLockedStage = section.dataset.stageEntry === "true" && !section.classList.contains("chapter--unlocked");
      if (isLockedStage && typeof openLockedStage === "function") {
        e.preventDefault();
        openLockedStage(section);
      }
    });
  }

  function initSimpleCarousels() {
    const hosts = $$("[data-simple-carousel]");
    hosts.forEach((host) => {
      const track = $(".simple-carousel__track", host);
      const slides = $$(".simple-carousel__slide", host);
      if (!track || !slides.length) return;

      const prev = host.querySelector("[data-prev]");
      const next = host.querySelector("[data-next]");
      const dotsHost = host.querySelector("[data-dots]");

      const count = slides.length;
      let index = 0;
      const dots = [];

      function updateDots() {
        if (!dotsHost) return;
        dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      }

      function setIndex(i, { animate = true } = {}) {
        index = (i + count) % count;
        if (!animate) track.style.transition = "none";
        track.style.transform = "translateX(" + -index * 100 + "%)";
        if (!animate) {
          requestAnimationFrame(() => {
            track.style.transition = "";
          });
        }
        updateDots();
      }

      if (dotsHost) {
        dotsHost.innerHTML = "";
        slides.forEach((_, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "simple-carousel__dot";
          b.setAttribute("aria-label", "Слайд " + (i + 1));
          b.addEventListener("click", () => setIndex(i));
          dotsHost.appendChild(b);
          dots.push(b);
        });
      }

      setIndex(0, { animate: false });

      prev?.addEventListener("click", () => setIndex(index - 1));
      next?.addEventListener("click", () => setIndex(index + 1));

      // Keyboard navigation
      host.tabIndex = host.tabIndex >= 0 ? host.tabIndex : 0;
      host.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setIndex(index - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setIndex(index + 1);
        }
      });

      // Minimal swipe support
      let startX = null;
      host.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        startX = e.clientX;
      });
      host.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) < 45) return;
        setIndex(index - Math.sign(dx));
      });
    });
  }

  function initInstrumentStrip() {
    const host = $("[data-inst-strip]");
    if (!host) return;

    const viewport = host.querySelector("[data-inst-viewport]");
    const prev = host.querySelector("[data-inst-prev]");
    const next = host.querySelector("[data-inst-next]");
    const firstCard = host.querySelector(".artifact-card");
    if (!viewport || !firstCard) return;

    function cardStep() {
      const style = getComputedStyle(viewport.querySelector(".inst-strip__track"));
      const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
      return firstCard.getBoundingClientRect().width + gap;
    }

    function move(dir) {
      viewport.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
    }

    prev?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
  }

  function initSurgicalPath() {
    const host = $("#surgicalPath");
    if (!host) return;

    const tabs = $$(".surgical-path__step", host);
    const panels = $$(".surgical-path__panel", host);
    if (!tabs.length || !panels.length) return;

    const count = Math.min(tabs.length, panels.length);
    const progressNow = $("#surgicalPathProgressNow");

    function activate(i) {
      const idx = ((i % count) + count) % count;
      tabs.forEach((t, ti) => {
        const on = ti === idx;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, pi) => {
        p.hidden = pi !== idx;
      });
      if (progressNow) progressNow.textContent = String(idx + 1);
    }

    tabs.slice(0, count).forEach((t, i) => {
      t.addEventListener("click", () => activate(i));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          tabs[(i + 1) % count].focus();
          activate(i + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          tabs[(i - 1 + count) % count].focus();
          activate(i - 1);
        }
      });
    });

    activate(0);
  }

  function keyboardModals() {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target.closest('[data-modal][tabindex="0"]');
      if (t) {
        e.preventDefault();
        t.click();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initJourneyScrollLock();
    intro();
    bindModalTriggers();
    keyboardModals();
    animateCharts();
    renderChronicle();
    streetPath();
    memoryBook();
    checkHeroImage();
    checkScheme();
    setupPmpDiagram();
    initStageTyping();
    initChapters();
    initStageNextButtons();
    initSimpleCarousels();
    initInstrumentStrip();
    initSurgicalPath();
    updateFactCounter();
  });
})();
