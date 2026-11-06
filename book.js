// A small book, with a note left between its last pages.
(() => {
  const mount = document.querySelector('#story-book-mount');
  const art = mount.closest('.scene-art');
  art.removeAttribute('aria-hidden');
  art.classList.add('book-art');
  const spreads = [
    ['ПРОЛОГ', 'однажды.', 'Ты открыл книгу.<br>И на мгновение<br>остался здесь.', '01', 'Помнишь?', 'Книгу, которую читал<br>под одеялом.<br>Ещё одну главу.<br>И ещё чуть-чуть.'],
    ['02', 'Между строк', 'В поезде. На кухне.<br>В тишине чужого города.<br>У каждой истории<br>есть место в твоей.', '03', 'На полях', 'Иногда запоминается<br>одна строчка.<br>А иногда — человек,<br>который дал тебе книгу.'],
    ['04', 'Ещё глава', 'Есть история,<br>о которой ты пока<br>даже не знаешь.<br>Вы ещё встретитесь.', '05', 'Чистый лист', 'Куда ты возьмёшь<br>следующую книгу?'],
  ];
  mount.innerHTML = `<div class="reading-book" role="group" aria-label="Книга маленьких историй">
    <div class="book-spread" tabindex="0" aria-label="Страницы книги. Листай стрелками влево и вправо"></div>
    <div class="book-navigation"><button type="button" class="book-prev" aria-label="Предыдущий разворот">←</button><span class="book-position" role="status" aria-live="polite"></span><button type="button" class="book-next" aria-label="Следующий разворот">→</button></div>
    <p class="book-hint">ПОТЯНИ ЗА УГОЛОК СТРАНИЦЫ</p>
  </div>`;
  const book = mount.querySelector('.reading-book');
  const spread = book.querySelector('.book-spread');
  let revealed = false;
  const date = new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric'}).format(new Date());
  function pageMarkup(page, side) {
    const data = spreads[page];
    const offset = side === 'left' ? 0 : 3;
    const secret = page === spreads.length-1 && side === 'right';
    return `<span class="book-folio">${data[offset]}</span><h4>${data[offset+1]}</h4><p>${data[offset+2]}</p>${secret ? `<button class="book-note" type="button" aria-expanded="${revealed}" aria-label="Развернуть записку">✳</button><div class="book-secret" ${revealed ? '' : 'hidden'}><span>НА ПАМЯТЬ</span><p>Однажды ты был здесь.<br>${date}<br><em>И эта маленькая история<br>уже случилась.</em></p></div>` : '<span class="book-page-mark" aria-hidden="true">·</span>'}`;
  }
  spread.innerHTML = spreads.map((_,index)=>['left','right'].map(side=>`<div class="story-page" data-density="soft"><div class="book-paper paper-${side}">${pageMarkup(index,side)}</div></div>`).join('')).join('');
  const flip = new St.PageFlip(spread, {
    width:300, height:460, size:'stretch', minWidth:120, maxWidth:310,
    minHeight:184, maxHeight:476, usePortrait:false, showCover:false,
    drawShadow:true, maxShadowOpacity:.3, flippingTime:1050,
    mobileScrollSupport:false, swipeDistance:35, disableFlipByClick:true,
    clickEventForward:true, showPageCorners:true
  });
  function render() {
    const index=Math.floor(flip.getCurrentPageIndex()/2);
    book.querySelector('.book-position').textContent=`${String(index+1).padStart(2,'0')} / 03`;
    book.querySelector('.book-prev').disabled=index===0;
    book.querySelector('.book-next').disabled=index===spreads.length-1;
  }
  flip.on('init',()=>render());flip.on('flip',()=>render());flip.on('changeState',()=>render());
  flip.loadFromHTML(spread.querySelectorAll('.story-page'));
  function turn(direction) {
    if(['flipping','user_fold'].includes(flip.getState()))return;
    const index=Math.floor(flip.getCurrentPageIndex()/2);
    if(index+direction<0||index+direction>=spreads.length)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flip.turnToPage((index+direction)*2);render();
    } else if(direction>0)flip.flipNext('bottom');
    else flip.flipPrev('bottom');
  }
  book.querySelector('.book-prev').addEventListener('click',()=>turn(-1));
  book.querySelector('.book-next').addEventListener('click',()=>turn(1));
  spread.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();turn(event.key==='ArrowRight'?1:-1);}
  });
  book.addEventListener('click',event=>{
    const button=event.target.closest('.book-note');
    if(!button)return;
    revealed=!revealed;
    button.setAttribute('aria-expanded',String(revealed));
    button.parentElement.querySelector('.book-secret').hidden=!revealed;
  });
})();
