(function(){
  var d=document,root=d.documentElement,$$=function(s,r){return [].slice.call((r||d).querySelectorAll(s))};
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var hero=d.querySelector('.hero'),nav=d.querySelector('.nav'),wa=d.querySelector('.wa');
  var img=d.querySelector('.hero .bg img');
  function go(){root.classList.add('ready')}
  if(img&&!img.complete){img.addEventListener('load',go);setTimeout(go,900)}else requestAnimationFrame(go);

  /* menu */
  var bg=d.querySelector('.burger');
  function setMenu(o){root.classList.toggle('menu-open',o);d.body.classList.toggle('lock',o);bg&&bg.setAttribute('aria-expanded',o)}
  if(bg)bg.addEventListener('click',function(){setMenu(!root.classList.contains('menu-open'))});
  $$('.sheet a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});

  /* nav + whatsapp */
  function onScroll(){
    var y=scrollY,h=hero?hero.offsetHeight:0;
    if(nav)nav.classList.toggle('solid',!hero||y>h-80);
    if(wa)wa.classList.toggle('on',y>(hero?h*.8:200));
    if(img&&!reduce&&y<h)img.style.translate='0 '+(y*.18).toFixed(1)+'px';
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* onglets méthode : défilement auto */
  var tabs=$$('.tab'),panes=$$('.pane-t'),scr=$$('.scr'),cur=0,timer=null,wrap=d.querySelector('.tabs');
  function show(i,user){
    cur=i;tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===i);var p=t.querySelector('.pg');if(p){p.style.animation='none';p.offsetWidth;p.style.animation=''}});
    panes.forEach(function(p,k){p.classList.toggle('on',k===i)});scr.forEach(function(s,k){s.classList.toggle('on',k===i)});
    if(user&&tabs[i].scrollIntoView&&innerWidth<720)tabs[i].scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    clearTimeout(timer);if(!reduce&&!(wrap&&wrap.closest('.paused')))timer=setTimeout(function(){show((cur+1)%tabs.length)},7000);
  }
  tabs.forEach(function(t,i){t.addEventListener('click',function(){var box=t.closest('.rv');if(box)box.classList.add('paused');show(i,true);clearTimeout(timer)})});

  /* compteurs */
  function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
  function count(el){var to=+el.dataset.to,t0=null;if(reduce)return;
    function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-k,4);el.firstChild.nodeValue=fmt(Math.round(to*e));if(k<1)requestAnimationFrame(f)}requestAnimationFrame(f)}

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;t.classList.add('in');
      $$('[data-to]',t).forEach(count);if(t.querySelector('.tabs'))show(0);io.unobserve(t)})},{rootMargin:'0px 0px -8% 0px'});
    $$('.rv').forEach(function(el){io.observe(el)});
  }else{$$('.rv').forEach(function(el){el.classList.add('in')});show(0)}
})();
