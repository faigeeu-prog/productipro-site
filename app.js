(function(){
  var d=document,root=d.documentElement,$$=function(s,r){return [].slice.call((r||d).querySelectorAll(s))};
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.add('loaded')})});

  /* menu */
  var bg=d.querySelector('.burger');
  if(bg)bg.addEventListener('click',function(){var o=root.classList.toggle('menu-open');d.body.classList.toggle('lock',o);bg.textContent=o?'Fermer':'Menu';bg.setAttribute('aria-expanded',o)});
  $$('.sheet a').forEach(function(a){a.addEventListener('click',function(){root.classList.remove('menu-open');d.body.classList.remove('lock');if(bg){bg.textContent='Menu';bg.setAttribute('aria-expanded','false')}})});

  /* carte : inclinaison au pointeur */
  var card=d.querySelector('.mcard'),hero=d.querySelector('.hero');
  if(card&&hero&&!reduce&&matchMedia('(pointer:fine)').matches){
    var tx=0,ty=0,cx=0,cy=0,raf=0;
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;if(!raf)raf=requestAnimationFrame(tick)});
    hero.addEventListener('pointerleave',function(){tx=0;ty=0;if(!raf)raf=requestAnimationFrame(tick)});
    function tick(){cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      card.style.setProperty('--ry',(-14+cx*22).toFixed(2)+'deg');card.style.setProperty('--rx',(8-cy*16).toFixed(2)+'deg');
      card.style.setProperty('--mx',(30+cx*80).toFixed(1)+'%');card.style.setProperty('--my',(20+cy*80).toFixed(1)+'%');card.style.setProperty('--sh',(-60+cx*120).toFixed(1)+'%');
      raf=(Math.abs(tx-cx)+Math.abs(ty-cy)>.001)?requestAnimationFrame(tick):0}
  }

  /* manifeste : mots qui s'allument */
  var big=d.querySelector('.man p.big'),words=[];
  if(big){
    var html=big.innerHTML.split(/(\s+)/).map(function(t){return /^\s+$/.test(t)||!t?t:'<span class="w">'+t+'</span>'}).join('');
    big.innerHTML=html;words=$$('.w',big);
  }
  /* calendrier */
  var tl=d.querySelector('.tline'),tlItems=tl?$$(':scope > div',tl):[];
  var wa=d.querySelector('.wa');
  function onScroll(){
    var vh=innerHeight;
    if(words.length){var r=big.getBoundingClientRect();var p=(vh*.82-r.top)/(r.height+vh*.25);p=Math.max(0,Math.min(1,p));var n=Math.round(p*words.length);for(var i=0;i<words.length;i++)words[i].classList.toggle('on',i<n)}
    if(tl){var r2=tl.getBoundingClientRect(),mob=innerWidth<=760;var p2=mob?(vh*.7-r2.top)/r2.height:(vh*.8-r2.top)/(vh*.45);p2=Math.max(0,Math.min(1,p2));tl.style.setProperty('--p',p2.toFixed(3));tlItems.forEach(function(el,k){el.classList.toggle('on',p2>=(mob?k/(tlItems.length-1)*.92:k/(tlItems.length)))})}
    if(wa&&hero)wa.classList.toggle('on',hero.getBoundingClientRect().bottom<vh*.4);
  }
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();

  /* compteurs */
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
  function count(el){var to=+el.dataset.to,dec=+(el.dataset.dec||0),t0=null,dur=1600;
    if(reduce){el.firstChild.nodeValue=dec?to.toFixed(dec).replace('.',','):fmt(to);return}
    function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,4),v=to*e;el.firstChild.nodeValue=dec?v.toFixed(dec).replace('.',','):fmt(Math.round(v));if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;t.classList.add('in');if(t.dataset.to)count(t);io.unobserve(t)})},{rootMargin:'0px 0px -10% 0px'});
    $$('.rv,.nope li,[data-to]').forEach(function(el){io.observe(el)});
    /* méthode : écran épinglé */
    var app=d.querySelector('.stage .app');
    if(app){var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)app.dataset.s=e.target.dataset.s})},{rootMargin:'-45% 0px -45% 0px'});$$('.meth .step').forEach(function(s){so.observe(s)})}
  }else{$$('.rv,.nope li').forEach(function(el){el.classList.add('in')})}
})();
