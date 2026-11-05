/* однажды. — personal moments, calculated locally. */
const DAY = 86400000;
const YEAR = DAY * 365.2425;
const STORAGE_KEY = 'odnazhdy-life-v1';
const defaults = { birth: '1998-08-14', horizon: 80, sleep: 8, meetings: 4, books: 12, hobby: 5 };
const nf = new Intl.NumberFormat('ru-RU');
const $ = selector => document.querySelector(selector);
const sessionStart = Date.now();
let settings = { ...defaults };
let personalized = false;
let weekIndex = -1;
let timer;
let mainTimer;
let toastTimer;
let presenceStarted = null;
let traceCount = 0;
let selectedWeek = -1;

function localDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}
function endDate(config) {
  const birth = localDate(config.birth);
  const date = new Date(birth);
  date.setFullYear(birth.getFullYear() + config.horizon);
  return date;
}
function validConfig(config) {
  const birth = localDate(config.birth);
  return birth && birth <= new Date() && birth.getFullYear() >= 1900 &&
    Number.isInteger(config.horizon) && config.horizon >= 1 && config.horizon <= 120 &&
    endDate(config) > new Date() &&
    [['sleep', 24], ['meetings', 100], ['books', 365], ['hobby', 168]].every(([key, max]) => Number.isFinite(config[key]) && config[key] >= 0 && config[key] <= max);
}
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('poka-life-v1'));
  if (saved && validConfig(saved)) { settings = saved; personalized = true; }
} catch { /* Storage may be unavailable; the experience still works. */ }

const icons = {
  day: '<rect x="4" y="6" width="20" height="18" rx="2"/><path d="M9 3v6m10-6v6M4 12h20M9 17h3m4 0h3M9 21h3"/>',
  weeks: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="17" y="4" width="6" height="6" rx="1"/><rect x="4" y="17" width="6" height="6" rx="1"/><rect x="17" y="17" width="6" height="6" rx="1"/>',
  weekend: '<path d="M4 16h20v8H4zM7 16v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5M9 24v2m10-2v2M14 8V3m-4 0h8"/>',
  sun: '<circle cx="14" cy="14" r="5"/><path d="M14 1v4m0 18v4M1 14h4m18 0h4M5 5l3 3m12 12 3 3M5 23l3-3M20 8l3-3"/>',
  birthday: '<path d="M4 15h20v10H4zM4 19q3 4 6 0 4 4 7 0 4 4 7 0M9 15v-5m5 5v-5m5 5v-5M9 7q-3-3 0-5 3 2 0 5m5 0q-3-3 0-5 3 2 0 5m5 0q-3-3 0-5 3 2 0 5"/>',
  year: '<path d="m14 2 2 7 7-2-4 6 6 4-8 1-1 8-4-7-7 4 3-8-6-3 8-2z"/>',
  moon: '<circle cx="14" cy="14" r="11"/><path d="M15 3c-6 4-7 17 0 22M11 7h.1m-4 7h.1m5 5h.1"/>',
  sleep: '<path d="M23 17A11 11 0 0 1 11 3a11 11 0 1 0 12 14zM21 3v6m-3-3h6"/>',
  awake: '<path d="M2 14s4-8 12-8 12 8 12 8-4 8-12 8S2 14 2 14z"/><circle cx="14" cy="14" r="4"/>',
  heart: '<path d="M14 24S2 16 2 9a6 6 0 0 1 12-1 6 6 0 0 1 12 1c0 7-12 15-12 15zM5 14h5l2-5 3 10 2-5h6"/>',
  breath: '<path d="M3 10h15a4 4 0 1 0-4-4M3 15h20a4 4 0 1 1-4 4M3 20h8"/>',
  people: '<circle cx="10" cy="8" r="4"/><path d="M2 25v-4a8 8 0 0 1 16 0v4M20 4a4 4 0 0 1 0 8m1 5a7 7 0 0 1 5 7"/>',
  book: '<path d="M14 7C10 3 4 4 2 5v19c5-2 9-1 12 1 3-2 7-3 12-1V5c-2-1-8-2-12 2zm0 0v18M6 9l4 1m-4 4 4 1m8-5 4-1m-4 6 4-1"/>',
  hobby: '<path d="m5 23 3-8L21 2l5 5-13 13-8 3zm3-8 5 5M18 5l5 5M3 26h23"/>',
  sunrise: '<path d="M2 22h24M6 18a8 8 0 0 1 16 0M14 2v6M3 8l4 4m14 0 4-4M1 17h4m18 0h4"/>'
};
const definitions = [
  ['days','day','дней для новых историй','И каждый может принести что-то своё.'],
  ['weeks','weeks','недель маленьких открытий','Иногда история начинается с обычного понедельника.'],
  ['weekends','weekend','выходных для любимых планов','Для поездок без повода и долгих завтраков.'],
  ['summers','sun','лет, которые могут запомниться','Тёплый воздух. Знакомые голоса. Длинные вечера. С 1 июня.'],
  ['birthdays','birthday','дней рождения с новым желанием','Любимые лица рядом. И ещё одно желание.'],
  ['newyears','year','новых начал','Новые привычки. Старые друзья. Что-то незнакомое.'],
  ['moons','moon','полных лунных циклов','Иногда просто стоит посмотреть наверх.'],
  ['sleep','sleep','часов доброго сна','Хорошо проснуться отдохнувшим. При 8 ч/сутки.'],
  ['awake','awake','часов, чтобы быть здесь','Смотреть, слушать, удивляться и быть собой.'],
  ['heart','heart','ударов сердца','Тихая работа внутри. Около 70 ударов в минуту.'],
  ['breath','breath','вдохов','Один из них — прямо сейчас. Около 16 вдохов в минуту.'],
  ['meetings','people','встреч, которые станут историями','Если встречаться 4 раза в месяц.'],
  ['books','book','новых книжных историй','Есть книги, после которых чуть иначе смотришь на мир.'],
  ['hobby','hobby','часов для того, что любишь','Если отдавать ему 5 часов в неделю.'],
  ['sunrises','sunrise','утр, которые могут удивить','Свет, который всякий раз падает по-новому.']
];

function metricText(key, main = false) {
  const [, , title, description] = definitions.find(item => item[0] === key);
  return `<div class="${main ? 'scene-value' : 'metric-value'}" id="metric-${key}">—</div><div class="${main ? 'scene-title-big' : 'metric-title'}">${title}</div><p class="${main ? 'scene-description' : 'metric-description'}" id="description-${key}">${description}</p>`;
}
function scene(key, number, caption, art, secondary = []) {
  return `<article class="metric-scene scene-${key}"><div class="wrap"><div class="scene-top"><span class="scene-number"><b>${String(Number(number)+1).padStart(2,'0')} / 08</b> ЕЩЁ МОЖЕТ БЫТЬ</span><span class="scene-title">${caption}</span></div><div class="scene-layout ${key === 'heart' ? 'body-main' : ''}"><div>${metricText(key,true)}</div><div class="scene-art" aria-hidden="true">${art}</div></div>${secondary.length ? `<div class="scene-secondary">${secondary.map(id=>`<div class="secondary-metric">${metricText(id)}</div>`).join('')}</div>` : ''}</div></article>`;
}
const stripes = Array.from({length:52},(_,i)=>`<i style="--bar-height:${35+((i*17)%65)}%"></i>`).join('');
$('#metrics').innerHTML = [
  scene('days','01','ДНИ, ИЗ КОТОРЫХ ПОЛУЧАЕТСЯ ЖИЗНЬ.',`<div class="day-stripes">${stripes}</div><span class="scene-art-caption">У КАЖДОГО БУДЕТ СВОЯ ИСТОРИЯ.</span>`,['weeks','weekends']),
  scene('summers','02','У КАЖДОГО ЛЕТА — СВОЙ СВЕТ.', '<div class="summer-disc"></div><div class="summer-orbit"></div>', ['birthdays','newyears']) + `<div class="summer-controls wrap"><label for="summer-range">Перелистай свои будущие лета</label><input id="summer-range" type="range" min="0" max="1" value="0"><div class="summer-readout"><span id="summer-year">—</span><p id="summer-story" role="status"></p></div><p class="interaction-note">У каждого будет свой запах, свой свет и свои люди.</p></div>`,
  scene('meetings','03','РАЗГОВОРЫ, К КОТОРЫМ ХОЧЕТСЯ ВОЗВРАЩАТЬСЯ.',`<div class="meeting-dots">${'<i></i>'.repeat(84)}</div><span class="scene-art-caption">ПОДУМАЙ, КОГО ТЕБЕ НЕ ХВАТАЕТ.</span>`),
  scene('heart','04','ТИХИЙ РИТМ ТВОЕГО СЕЙЧАС.', '<svg class="body-lines" viewBox="0 0 500 200" preserveAspectRatio="none"><path class="baseline" d="M0 100H500"/><path class="wave" d="M0 100h90l12-15 14 32 18-105 24 165 19-77h105l12-15 14 32 18-105 24 165 19-77h131"/></svg>', ['breath']),
  scene('sleep','05','МИР ПОДОЖДЁТ ДО УТРА.', '<div class="sleep-art"><span></span><span></span><i class="sleep-z">z</i><i class="sleep-z">z</i><i class="sleep-z">z</i></div>', ['awake']),
  scene('sunrises','06','УТРО, В КОТОРОМ МОЖНО УДИВИТЬСЯ.', '<div class="sunrise-lines"></div><span class="scene-art-caption">ХОТЯ БЫ ОДИН — ВСТРЕТЬ НЕ ТОРОПЯСЬ.</span>', ['moons']),
  scene('hobby','07','МАЛЕНЬКИЕ УВЛЕЧЕНИЯ. БОЛЬШИЕ РАДОСТИ.', `<div class="book-sculpture">${'<i></i>'.repeat(18)}</div>`, ['books'])
].join('');
$('.scene-summers').append($('.summer-controls'));
// Scene names describe visual treatments, independent of their calculation keys.
$('.scene-heart').classList.add('scene-body');
$('.scene-hobby').classList.add('scene-self');

function calendarCount(now, end, month, day) {
  let count = 0;
  for (let year = now.getFullYear(); year <= end.getFullYear(); year++) {
    // A February 29 birthday is celebrated on February 28 in non-leap years.
    const maxDay = new Date(year, month + 1, 0).getDate();
    const date = new Date(year, month, Math.min(day, maxDay));
    if (date > now && date <= end) count++;
  }
  return count;
}
function weekendCount(now, end) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let offset = (6 - next.getDay() + 7) % 7;
  if (offset === 0) offset = 7;
  next.setDate(next.getDate() + offset);
  const sundayEnd = new Date(next); sundayEnd.setDate(next.getDate() + 2);
  if (sundayEnd > end) return 0;
  const ordinal = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((ordinal(end) - ordinal(sundayEnd)) / (DAY * 7)) + 1;
}
function getSnapshot(now = new Date()) {
  const birth = localDate(settings.birth);
  const end = endDate(settings);
  const left = Math.max(0, end - now);
  const days = left / DAY;
  const weeks = days / 7;
  const years = left / YEAR;
  const percent = Math.max(0, Math.min(100, (now - birth) / (end - birth) * 100));
  return { birth, end, percent, left, values: {
    days, weeks, weekends: weekendCount(now, end), summers: calendarCount(now,end,5,1),
    birthdays: calendarCount(now,end,birth.getMonth(),birth.getDate()), newyears: calendarCount(now,end,0,1),
    moons: days / 29.53059, sleep: days * settings.sleep, awake: days * (24 - settings.sleep),
    heart: left / 60000 * 70, breath: left / 60000 * 16, meetings: years * 12 * settings.meetings,
    books: years * settings.books, hobby: weeks * settings.hobby, sunrises: days
  }};
}
function paintWeeks(snapshot) {
  const total = Math.ceil((snapshot.end - snapshot.birth) / (DAY * 7));
  const lived = Math.min(total, Math.floor((Date.now() - snapshot.birth) / (DAY * 7)));
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const cell = document.createElement('span');
    cell.className = `week${i < lived ? ' lived' : i === lived ? ' now' : ''}`;
    cell.dataset.week = i;
    fragment.append(cell);
  }
  $('#weeks-grid').replaceChildren(fragment);
  $('#weeks-grid').setAttribute('aria-label', `${nf.format(total)} недель, включая неполную последнюю; ${nf.format(lived)} уже прожито`);
  weekIndex = lived;
  selectedWeek = -1;
  $('#week-readout').textContent = 'ПРОВЕДИ ПО ПОЛЮ ИЛИ ИСПОЛЬЗУЙ СТРЕЛКИ — НАЙДИ СВОЮ НЕДЕЛЮ';
}
function updateMainCounter() {
  const birth = localDate(settings.birth);
  const percent = Math.max(0,Math.min(100,(Date.now()-birth)/(endDate(settings)-birth)*100));
  const [whole,fraction] = percent.toFixed(9).split('.');
  const wholeEl = $('#percent .whole');
  const fractionEl = $('#percent .fraction');
  if (wholeEl.textContent !== whole) wholeEl.textContent = whole;
  fractionEl.textContent = `,${fraction}`;
}
function updateRulerMarker() {
  const track = $('#life-track');
  const cell = track.querySelector('.now') || track.lastElementChild;
  if (!cell) return;
  const bounds = cell.getBoundingClientRect();
  const center = bounds.left - track.getBoundingClientRect().left + bounds.width / 2;
  document.documentElement.style.setProperty('--now-center',`${center}px`);
  document.documentElement.style.setProperty('--scan-left',`${bounds.left+bounds.width/2}px`);
  $('.today-marker').dataset.end = center / track.clientWidth > .8;
}
function animateBreath(el, formatted) {
  if (el.dataset.value === formatted) return;
  const previous = el.dataset.value;
  el.dataset.value = formatted;
  el.setAttribute('aria-label',formatted);
  if (!previous || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = formatted; return;
  }
  const leaving = document.createElement('span');
  leaving.className='breath-out';leaving.textContent=previous;leaving.setAttribute('aria-hidden','true');
  const arriving = document.createElement('span');
  arriving.className='breath-in';arriving.textContent=formatted;
  el.replaceChildren(leaving,arriving);
  leaving.addEventListener('animationend',()=>leaving.remove(),{once:true});
}
function update() {
  const snapshot = getSnapshot();
  updateMainCounter();
  for (const [key, value] of Object.entries(snapshot.values)) {
    const formatted = nf.format(Math.floor(value));
    const el = $(`#metric-${key}`);
    if (key === 'breath') animateBreath(el,formatted);
    else if (el.textContent !== formatted) el.textContent = formatted;
  }
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  $('#session-seconds').textContent = nf.format(elapsed).padStart(2,'0');
  const traces = Math.min(elapsed,240);
  if (traces !== traceCount) {
    const fragment = document.createDocumentFragment();
    for (let i = traceCount; i < traces; i++) fragment.append(document.createElement('i'));
    $('#second-traces').append(fragment); traceCount = traces;
  }
  if (presenceStarted !== null) {
    const remaining = Math.max(0,10-Math.floor((Date.now()-presenceStarted)/1000));
    $('#presence-button').textContent = remaining ? `${String(remaining).padStart(2,'0')} — НИКУДА НЕ НУЖНО СПЕШИТЬ` : 'ЕЩЁ НЕМНОГО ПОБЫТЬ ЗДЕСЬ ↗';
    if (!remaining) {
      presenceStarted = null; $('#presence-button').disabled = false;
      $('#presence-status').textContent = 'ДЕСЯТЬ ТИХИХ СЕКУНД. ХОРОШО, ЧТО ОНИ БЫЛИ.';
    }
  }
  const currentWeek = Math.min(Math.ceil((snapshot.end-snapshot.birth)/(DAY*7)),Math.floor((Date.now()-snapshot.birth)/(DAY*7)));
  if (currentWeek !== weekIndex) paintWeeks(snapshot);
}
function applySettings() {
  const snapshot = getSnapshot();
  $('#example-label').textContent = personalized ? 'ТВОЯ ИСТОРИЯ · ТВОИ МГНОВЕНИЯ' : 'ПРИМЕР · ПОДСТАВЬ СВОЮ ДАТУ';
  $('#birth-label').textContent = snapshot.birth.toLocaleDateString('ru-RU', {day:'numeric',month:'short',year:'numeric'});
  $('#horizon-label').textContent = `Жизнь: ${settings.horizon} лет`;
  $('#horizon-inline').textContent = `${settings.horizon} лет`;
  $('#description-sleep').textContent = `Хорошо проснуться отдохнувшим. При ${settings.sleep} ч/сутки.`;
  $('#description-meetings').textContent = `Встреч в месяц: ${settings.meetings}. Для ваших маленьких историй.`;
  $('#description-books').textContent = `Если читать ${settings.books} книг в год.`;
  $('#description-hobby').textContent = `Любимое дело: ${settings.hobby} ч в неделю.`;
  const total = settings.horizon;
  const yearsElapsed = (Date.now() - snapshot.birth) / (snapshot.end - snapshot.birth) * total;
  $('#life-track').style.gridTemplateColumns = `repeat(${total},minmax(0,1fr))`;
  $('#life-track').innerHTML = Array.from({length:total}, (_, i) => `<span class="${i < Math.floor(yearsElapsed) ? 'lived' : i === Math.floor(yearsElapsed) ? 'now' : ''}"></span>`).join('');
  paintWeeks(snapshot);
  update();
  updateRulerMarker();
  document.dispatchEvent(new Event('odnazhdy:settings'));
}
function showToast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200);
}
function openSettings() {
  const form = $('#settings-form');
  for (const [key, value] of Object.entries(settings)) form.elements.namedItem(key).value = value;
  if (!personalized) $('#birth-input').value = '';
  const now = new Date();
  $('#birth-input').max = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  $('#birth-input').min = '1900-01-01';
  $('#form-error').textContent = '';
  $('#settings-dialog').showModal();
}
document.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', openSettings));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); }}));
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const config = {birth:data.get('birth')};
  for (const key of ['horizon','sleep','meetings','books','hobby']) config[key] = Number(data.get(key));
  if (!validConfig(config)) {
    $('#form-error').textContent = 'Укажи дату рождения и выбери продолжительность больше своего возраста — до 120 лет.';
    return;
  }
  settings = config; personalized = true;
  let saved = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { saved = false; }
  applySettings();
  $('#settings-dialog').close();
  showToast(saved ? 'Теперь это твоя история' : 'Расчёт обновлён. В следующий раз данные нужно будет ввести заново.');
});

async function makeCard() {
  await document.fonts.ready;
  const canvas = $('#share-canvas');
  const ctx = canvas.getContext('2d');
  const snapshot = getSnapshot();
  ctx.fillStyle = '#f4eee3'; ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle = '#2e2924'; ctx.font = '800 84px "Roboto Condensed", sans-serif'; ctx.fillText('однажды',65,115);
  ctx.fillStyle='#b94f37';ctx.fillText('.',65+ctx.measureText('однажды').width,115);
  ctx.strokeStyle='#d1c3b3';ctx.beginPath();ctx.moveTo(65,160);ctx.lineTo(1015,160);ctx.stroke();
  ctx.fillStyle='#2e2924';ctx.font='500 22px "IBM Plex Mono", monospace';ctx.fillText(personalized?'[ МОЯ ИСТОРИЯ / МОИ МГНОВЕНИЯ ]':'[ ПРИМЕР / ИСТОРИЯ В МГНОВЕНИЯХ ]',65,242);
  ctx.font='800 440px "Roboto Condensed", sans-serif';ctx.fillText(String(Math.floor(snapshot.percent)),45,640);
  ctx.fillStyle='#b94f37';ctx.font='400 130px "Roboto Condensed", sans-serif';ctx.fillText(','+snapshot.percent.toFixed(6).split('.')[1]+'%',65,795);
  ctx.fillStyle='#2e2924';ctx.font='500 25px "IBM Plex Mono", monospace';ctx.fillText('УЖЕ СТАЛО ЧАСТЬЮ МОЕЙ ИСТОРИИ',65,870);
  for(let i=0;i<80;i++){ctx.fillStyle=i/80<snapshot.percent/100?'#b94f37':'#d6cabb';ctx.fillRect(65+i*11.9,920,7,55);}
  ctx.fillStyle='#2e2924';
  const headline='СКОЛЬКО ВСЕГО ЕЩЁ МОЖЕТ БЫТЬ.';
  let headlineSize=66;
  do {ctx.font=`600 ${headlineSize--}px "Roboto Condensed",sans-serif`;} while(ctx.measureText(headline).width>950);
  ctx.fillText(headline,65,1082);
  ctx.fillStyle='#7f7164';ctx.font='400 19px "IBM Plex Mono", monospace';ctx.fillText(`Представим жизнь длиной ${settings.horizon} лет. Это не прогноз.`,65,1160);
  ctx.fillStyle='#d99a71';ctx.fillRect(0,1220,1080,130);
  ctx.fillStyle='#2e2924';ctx.font='500 28px "IBM Plex Mono", monospace';ctx.fillText('ИЗ ТВОИХ МГНОВЕНИЙ ↗',65,1297);
  ctx.font='400 22px "Roboto Condensed",sans-serif';ctx.textAlign='right';ctx.fillText('однажды.',1015,1294);ctx.textAlign='left';
}
$('#share-button').addEventListener('click', async () => {
  $('#share-status').textContent = '';
  $('#share-dialog').showModal();
  try { await makeCard(); } catch { $('#share-status').textContent = 'Не удалось создать карточку. Можно скопировать ссылку.'; }
});
$('#download-card').addEventListener('click', () => {
  const link = document.createElement('a'); link.download='odnazhdy-my-story.png';link.href=$('#share-canvas').toDataURL('image/png');link.click();
  $('#share-status').textContent = 'Карточка готова к скачиванию.';
});
$('#copy-link').addEventListener('click', async () => {
  const url = new URL(location.href); url.hash='';url.search='';
  try { await navigator.clipboard.writeText(url.href); $('#share-status').textContent = 'Ссылка скопирована.'; }
  catch { $('#share-status').textContent = `Скопируй адрес: ${url.href}`; }
});
applySettings();
if (!personalized) openSettings();
function startTimer(){clearInterval(timer);clearInterval(mainTimer);timer=setInterval(update,1000);mainTimer=setInterval(updateMainCounter,80);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(timer);clearInterval(mainTimer);}else{update();startTimer();}});
startTimer();
if ('ResizeObserver' in window) new ResizeObserver(updateRulerMarker).observe($('#life-track'));
else window.addEventListener('resize',updateRulerMarker);

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-heading h2,.scene-layout,.scene-secondary,.weeks-heading,.meaning-layout h2').forEach(el => {
    el.classList.add('reveal-on-scroll'); observer.observe(el);
  });
}

$('#presence-button').addEventListener('click', () => {
  presenceStarted = Date.now(); $('#presence-button').disabled = true;
  $('#presence-status').textContent = ''; update();
});

function inspectWeek(index) {
  const grid = $('#weeks-grid');
  const cell = grid.children[index];
  if (!cell || index === selectedWeek) return;
  if (selectedWeek >= 0) grid.children[selectedWeek]?.classList.remove('selected');
  selectedWeek = index; cell.classList.add('selected');
  const birth = localDate(settings.birth);
  const start = new Date(birth); start.setDate(start.getDate()+index*7);
  const finish = new Date(start); finish.setDate(finish.getDate()+6);
  const end = endDate(settings); if (finish > end) finish.setTime(end.getTime());
  const format = date => date.toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});
  const state = cell.classList.contains('lived') ? 'УЖЕ ЧАСТЬ ТВОЕЙ ИСТОРИИ' : cell.classList.contains('now') ? 'ПРОИСХОДИТ СЕЙЧАС' : 'ЕЩЁ МОЖЕТ БЫТЬ';
  $('#week-readout').textContent = `№ ${nf.format(index+1)} / ${format(start)} — ${format(finish)} / ${state}`;
}
$('#weeks-grid').tabIndex=0;
$('#weeks-grid').setAttribute('role','group');
$('#weeks-grid').setAttribute('aria-describedby','week-readout');
$('#weeks-grid').addEventListener('pointermove',event=>{
  const cell=event.target.closest('[data-week]');if(cell)inspectWeek(Number(cell.dataset.week));
});
$('#weeks-grid').addEventListener('click',event=>{
  const cell=event.target.closest('[data-week]');if(cell)inspectWeek(Number(cell.dataset.week));
});
$('#weeks-grid').addEventListener('keydown',event=>{
  const columns=matchMedia('(max-width:650px)').matches?52:104;
  const directions={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns};
  if (!(event.key in directions) && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  const total=$('#weeks-grid').children.length;
  const next=event.key==='Home'?0:event.key==='End'?total-1:(selectedWeek<0?weekIndex:selectedWeek)+directions[event.key];
  inspectWeek(Math.max(0,Math.min(total-1,next)));
});

// Exposed only for focused calculation checks in the local prototype.
if (typeof module !== 'undefined') module.exports = {localDate, endDate, validConfig, calendarCount, weekendCount};
