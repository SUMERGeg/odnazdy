// Meaningful motion and local interactions; calculations stay in app.js.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = 0;
const scrollingScenes = document.querySelectorAll('.scene-days,.scene-summers,.scene-sunrises,.scene-self');
function paintStoryScroll() {
  scrollFrame = 0;
  if (document.hidden || reducedMotion.matches) return;
  const height = innerHeight;
  for (const scene of scrollingScenes) {
    const rect = scene.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > height) continue;
    const progress = Math.max(0,Math.min(1,(height-rect.top)/(height+rect.height)));
    scene.style.setProperty('--scene-progress',progress.toFixed(4));
  }
}
function queueStoryScroll() { if (!scrollFrame) scrollFrame=requestAnimationFrame(paintStoryScroll); }
addEventListener('scroll',queueStoryScroll,{passive:true});
addEventListener('resize',queueStoryScroll,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueStoryScroll();});
reducedMotion.addEventListener('change',()=>{
  scrollingScenes.forEach(scene=>scene.style.removeProperty('--scene-progress'));
  queueStoryScroll();
});

// A finite collection of summers, dated against the visitor's chosen horizon.
let summerDates = [];
function paintSummer() {
  const index=Number($('#summer-range').value);
  const date=summerDates[index];
  if (!date) {
    $('#summer-year').textContent='СЕГОДНЯ';
    $('#summer-story').textContent='На этой шкале нет следующего июня. Зато сегодняшний день уже здесь.';
    return;
  }
  const birth=localDate(settings.birth);
  const age=date.getFullYear()-birth.getFullYear()-(date < new Date(date.getFullYear(),birth.getMonth(),birth.getDate())?1:0);
  $('#summer-year').textContent=date.getFullYear();
  $('#summer-story').textContent=`Лето ${date.getFullYear()}. Тебе будет ${age}. Интересно, что хорошего оно принесёт?`;
  $('#summer-range').setAttribute('aria-valuetext',`Лето ${date.getFullYear()}, ${index+1} из ${summerDates.length}`);
  $('.scene-summers').style.setProperty('--summer-position',summerDates.length>1?index/(summerDates.length-1):0);
}
$('#summer-range').addEventListener('input',paintSummer);

// The central episode: a future date turns an abstract delay into missed chances.
$('.scene-meetings .scene-art').remove();
$('.scene-meetings').insertAdjacentHTML('beforeend',`<div class="wrap later-episode">
  <div class="later-opening"><p class="eyebrow">МАЛЕНЬКАЯ ИСТОРИЯ О БУДУЩИХ ВСТРЕЧАХ</p><h3>С кем тебе<br><em>хорошо быть рядом?</em></h3><label for="person-name">Напиши имя. Только для себя.<input id="person-name" maxlength="40" autocomplete="off" placeholder="Например, Саша"></label><p class="interaction-note">Можно просто подумать об этом человеке — имя вводить необязательно.</p></div>
  <div class="later-stage"><div class="later-letter"><span id="later-person">Человеку, с которым хорошо.</span><p>«Помнишь тот день?<br><em>Давай повторим».</em></p></div><div class="later-date"><span>ОДИН ИЗ ВАШИХ БУДУЩИХ ДНЕЙ</span><strong id="later-date">—</strong><span id="later-age"></span></div></div>
  <div class="later-frequency"><label for="later-frequency">Как часто вы могли бы видеться?<select id="later-frequency"><option value="custom">Как в моих настройках</option><option value="0.16666666666666666">Дважды в год</option><option value="1">Раз в месяц</option><option value="4">Раз в неделю (4 раза в месяц)</option></select></label></div>
  <div class="later-controls"><label for="later-range">Заглянем немного вперёд? <output id="later-delay" for="later-range">Сегодня</output></label><input id="later-range" type="range" min="0" max="120" value="0"><div class="later-range-ends"><span>СЕГОДНЯ</span><span id="later-max">ЧЕРЕЗ 10 ЛЕТ</span></div></div>
  <div class="later-revelation" role="status"><strong id="later-lost">0</strong><p><span id="later-line">Хороший день, чтобы побыть вместе.</span><small id="later-assumption"></small></p></div>
  <div class="later-dots" aria-hidden="true">${'<i></i>'.repeat(120)}</div><p class="later-dot-note" id="later-dot-note"></p><button class="later-reset text-button" type="button">ВЕРНУТЬСЯ В СЕГОДНЯ <span>↶</span></button>
</div>`);
function dateAfterMonths(months) {
  const date=new Date();
  const day=date.getDate();
  date.setDate(1);date.setMonth(date.getMonth()+months);
  date.setDate(Math.min(day,new Date(date.getFullYear(),date.getMonth()+1,0).getDate()));
  return date;
}
function paintLater() {
  const months=Number($('#later-range').value);
  const date=dateAfterMonths(months);
  const birth=localDate(settings.birth);
  const age=date.getFullYear()-birth.getFullYear()-(date < new Date(date.getFullYear(),birth.getMonth(),birth.getDate())?1:0);
  const frequency=$('#later-frequency').value==='custom'?settings.meetings:Number($('#later-frequency').value);
  const moments=Math.floor(months*frequency+1e-8);
  const max=Number($('#later-range').max);
  const opportunity=Math.floor(max*frequency+1e-8);
  $('#later-date').textContent=date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
  $('#later-age').textContent=`ТЕБЕ БУДЕТ ${age}${personalized?'':' · ПРИМЕР — ВВЕДИ СВОЮ ДАТУ'}`;
  const delay=months===0?'Сегодня':months<12?`${months} мес.`:`${nf.format(Math.floor(months/12))} г. ${months%12?`${months%12} мес.`:''}`;
  $('#later-delay').textContent=delay;
  $('#later-range').setAttribute('aria-valuetext',delay);
  $('#later-lost').textContent=nf.format(moments);
  $('#later-line').textContent=months?'встреч может стать вашими воспоминаниями.':'Хороший день, чтобы побыть вместе.';
  const frequencyLabel=$('#later-frequency').selectedOptions[0].textContent.toLowerCase();
  $('#later-assumption').textContent=$('#later-frequency').value==='custom'?`Встреч в месяц: ${settings.meetings}. Время, которое можно провести вместе.`:`Если встречаться ${frequencyLabel}. Время, которое можно провести вместе.`;
  const fraction=max?months/max:0;
  const litDots=Math.round(120*fraction);
  document.querySelectorAll('.later-dots i').forEach((dot,i)=>dot.classList.toggle('gone',i>=litDots));
  $('#later-dot-note').textContent=opportunity?`На этой маленькой карте — ${max} месяцев будущего. Появляющиеся знаки — возможные встречи. Хорошо, если какие-то станут вашими историями.`:'Выбери, как часто вы хотели бы встречаться.';
  $('.later-dots').classList.toggle('is-empty',!opportunity);
  $('.later-episode').classList.toggle('has-delay',months>0);
}
$('#person-name').addEventListener('input',event=>{
  $('#later-person').textContent=event.target.value.trim()||'Человеку, с которым хорошо.';
});
$('#later-range').addEventListener('input',paintLater);
$('#later-frequency').addEventListener('change',paintLater);
$('.later-reset').addEventListener('click',()=>{$('#later-range').value='0';paintLater();});

// Give sleeping hours a real shape in a 24-hour day.
$('.scene-sleep .scene-art').insertAdjacentHTML('beforeend','<div class="day-night-band" aria-hidden="true"></div>');
$('.scene-sleep .scene-layout').insertAdjacentHTML('afterend','<div class="sleep-explanation"><span id="sleep-day-caption"></span><span>МОЖНО ОТДОХНУТЬ. ЗАВТРА БУДЕТ ЕЩЁ ОДИН ДЕНЬ.</span></div>');
$('.scene-sunrises .scene-layout').insertAdjacentHTML('beforeend','<p class="sunrise-thought">У каждого утра — свой свет.<br><em>И что-то ещё незнакомое.</em></p>');
$('.scene-self .scene-layout').insertAdjacentHTML('afterbegin','<span class="postponed-word" aria-hidden="true">РАДОСТЬ</span>');

// A small, concrete ending, stored only on the visitor's device.
$('.meaning-copy .muted').insertAdjacentHTML('afterend',`<form class="intention-form"><label for="today-action">Для какого момента найдётся место сегодня?<input id="today-action" maxlength="100" placeholder="Чай с близким. Прогулка. Немного любимой музыки." required></label><button class="intention-button" type="submit">ПУСТЬ ЭТО СЛУЧИТСЯ <span>↗</span></button><p id="intention-status" role="status"></p></form>`);
try { $('#today-action').value=localStorage.getItem('odnazhdy-today-action')||localStorage.getItem('poka-today-action')||''; } catch {}
$('.intention-form').addEventListener('submit',event=>{
  event.preventDefault();
  const value=$('#today-action').value.trim();
  if(!value){$('#today-action').focus();return;}
  let saved=true;
  try {localStorage.setItem('odnazhdy-today-action',value);} catch {saved=false;}
  $('#intention-status').textContent=saved?'Для этого момента уже есть место в твоей истории.':'Хорошо, если этот момент однажды вспомнится.';
  $('.intention-form').classList.add('is-committed');
});
$('#today-action').addEventListener('input',()=>{
  $('.intention-form').classList.remove('is-committed');$('#intention-status').textContent='';
});

function refreshExperience() {
  const now=new Date();const end=endDate(settings);
  summerDates=[];
  for(let year=now.getFullYear();year<=end.getFullYear();year++){
    const date=new Date(year,5,1);if(date>now&&date<=end)summerDates.push(date);
  }
  $('#summer-range').max=String(Math.max(0,summerDates.length-1));
  $('#summer-range').value='0';$('#summer-range').disabled=summerDates.length<2;
  paintSummer();
  let months=0;
  while(months<120&&dateAfterMonths(months+1)<=end)months++;
  $('#later-range').max=String(months);$('#later-range').value='0';$('#later-range').disabled=!months;
  $('#later-max').textContent=months?`ЧЕРЕЗ ${months} МЕС.`:'ЕСТЬ ЭТОТ ХОРОШИЙ ДЕНЬ';
  paintLater();
  $('.day-night-band').innerHTML=Array.from({length:24},(_,i)=>`<i class="${i<Math.round(settings.sleep)?'night':'day'}"></i>`).join('');
  $('#sleep-day-caption').textContent=`В КАЖДЫХ СУТКАХ: ${settings.sleep} Ч СНА / ${24-settings.sleep} Ч БОДРСТВОВАНИЯ`;
  queueStoryScroll();
}
document.addEventListener('odnazhdy:settings',refreshExperience);
refreshExperience();
