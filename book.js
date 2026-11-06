// A small book, with a note left between its last pages.
(() => {
  const mount = document.querySelector('#story-book-mount');
  const art = mount.closest('.scene-art');
  art.removeAttribute('aria-hidden');
  art.classList.add('book-art');
  const spreads = [
    ['ПРОЛОГ', 'однажды.', 'Ты открыл книгу.<br>И на мгновение<br>остался здесь.', '01', 'Помнишь?', 'Книгу, которую читал<br>под одеялом.<br>Ещё одну главу.<br>И ещё чуть-чуть.'],
    ['02', 'Между строк', 'В поезде. На кухне.<br>В тишине чужого города.<br>У каждой истории<br>есть место в твоей.', '03', 'На полях', 'Иногда запоминается<br>одна строчка.<br>А иногда — человек,<br>который дал тебе книгу.'],
    ['04', 'Ещё глава', 'Есть история,<br>о которой ты пока<br>даже не знаешь.<br>Вы ещё встретитесь.', '05', 'Чистый лист', 'Куда ты возьмёшь<br>следующую книгу?<br><br>Пусть у этой главы<br>будет хороший вид.'],
    ['06', 'Послесловие', 'Не каждая история<br>помещается в книгу.<br><br>Некоторые ты<br>просто проживаешь.', '07', 'Между страниц', 'Кажется, здесь<br>кто-то оставил записку.']
  ];
  mount.innerHTML = `<div class="reading-book" role="group" aria-label="Книга маленьких историй">
    <div class="book-spread" tabindex="0" aria-label="Страницы книги. Листай стрелками влево и вправо">
      <div class="book-paper paper-left"></div><div class="book-paper paper-right"></div>
      <div class="turning-leaf" aria-hidden="true"><div class="leaf-face leaf-front"></div><div class="leaf-face leaf-back"></div></div>
    </div>
    <div class="book-navigation"><button type="button" class="book-prev" aria-label="Предыдущий разворот">←</button><span class="book-position" role="status" aria-live="polite"></span><button type="button" class="book-next" aria-label="Следующий разворот">→</button></div>
    <p class="book-hint">ПЕРЕЛИСТНИ. ТАМ ЕЩЁ КОЕ-ЧТО ЕСТЬ.</p>
  </div>`;
  const book = mount.querySelector('.reading-book');
  const spread = book.querySelector('.book-spread');
  const leaf = book.querySelector('.turning-leaf');
  let index = 0, turning = false, revealed = false;
  const date = new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric'}).format(new Date());
  function pageMarkup(page, side) {
    const data = spreads[page];
    const offset = side === 'left' ? 0 : 3;
    const secret = page === spreads.length-1 && side === 'right';
    return `<span class="book-folio">${data[offset]}</span><h4>${data[offset+1]}</h4><p>${data[offset+2]}</p>${secret ? `<button class="book-note" type="button" aria-expanded="${revealed}" aria-label="Развернуть записку">✳</button><div class="book-secret" ${revealed ? '' : 'hidden'}><span>НА ПАМЯТЬ</span><p>Однажды ты был здесь.<br>${date}<br><em>И эта маленькая история<br>уже случилась.</em></p></div>` : '<span class="book-page-mark" aria-hidden="true">·</span>'}`;
  }
  function render() {
    book.querySelector('.paper-left').innerHTML = pageMarkup(index,'left');
    book.querySelector('.paper-right').innerHTML = pageMarkup(index,'right');
    book.querySelector('.book-position').textContent = `${String(index+1).padStart(2,'0')} / ${String(spreads.length).padStart(2,'0')}`;
    book.querySelector('.book-prev').disabled = index === 0 || turning;
    book.querySelector('.book-next').disabled = index === spreads.length-1 || turning;
  }
  function turn(direction) {
    const next = index + direction;
    if (turning || next < 0 || next >= spreads.length) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { index=next; render(); return; }
    turning = true;
    leaf.querySelector('.leaf-front').innerHTML = pageMarkup(direction>0?index:next,'right');
    leaf.querySelector('.leaf-back').innerHTML = pageMarkup(direction>0?next:index,'left');
    // The animated copies are decorative; controls exist only in the real pages.
    leaf.querySelectorAll('button').forEach(button=>button.replaceWith(document.createElement('span')));
    leaf.classList.toggle('turn-backward',direction<0);
    if (direction>0) book.querySelector('.paper-right').innerHTML=pageMarkup(next,'right');
    else book.querySelector('.paper-left').innerHTML=pageMarkup(next,'left');
    leaf.classList.add('is-turning');
    book.querySelectorAll('.book-navigation button').forEach(button=>button.disabled=true);
    setTimeout(()=>{index=next; turning=false; leaf.classList.remove('is-turning'); render();},850);
  }
  book.querySelector('.book-prev').addEventListener('click',()=>turn(-1));
  book.querySelector('.book-next').addEventListener('click',()=>turn(1));
  spread.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();turn(event.key==='ArrowRight'?1:-1);}
  });
  let startX=0,startY=0;
  spread.addEventListener('touchstart',event=>{startX=event.changedTouches[0].clientX;startY=event.changedTouches[0].clientY;},{passive:true});
  spread.addEventListener('touchend',event=>{
    const dx=event.changedTouches[0].clientX-startX,dy=event.changedTouches[0].clientY-startY;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx<0?1:-1);
  },{passive:true});
  book.addEventListener('click',event=>{
    if(!event.target.closest('.book-note'))return;
    revealed=!revealed;
    const button=book.querySelector('.paper-right .book-note');
    button.setAttribute('aria-expanded',String(revealed));
    book.querySelector('.paper-right .book-secret').hidden=!revealed;
  });
  render();
})();
