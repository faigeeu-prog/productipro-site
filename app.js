(function(){
  var d=document,root=d.documentElement,$=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return [].slice.call((r||d).querySelectorAll(s))};
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* découpe des titres en mots */
  $$('[data-split]').forEach(function(el){
    var walk=function(node,acc){[].slice.call(node.childNodes).forEach(function(n){
      if(n.nodeType===3){n.textContent.split(/(\s+)/).forEach(function(t){if(!t)return;if(/^\s+$/.test(t)){acc.push(d.createTextNode(' '));return}var w=d.createElement('span');w.className='wd';var i=d.createElement('span');i.textContent=t;w.appendChild(i);acc.push(w)})}
      else{var c=n.cloneNode(false);var inner=[];walk(n,inner);inner.forEach(function(x){c.appendChild(x)});acc.push(c)}
    })};
    var acc=[];walk(el,acc);el.textContent='';acc.forEach(function(x){el.appendChild(x)});
    $$('.wd > span',el).forEach(function(s,k){s.style.transitionDelay=(k*45)+'ms'});
  });

  /* défilement doux */
  var lenis=null;
  function startLenis(){
    if(reduce||!window.Lenis||matchMedia('(pointer:coarse)').matches)return;
    lenis=new Lenis({lerp:.1,smoothWheel:true});
    function raf(t){lenis.raf(t);requestAnimationFrame(raf)}requestAnimationFrame(raf);
    lenis.on('scroll',onScroll);
  }
  addEventListener('load',startLenis);
  $$('a[href^="#"],a[href^="/#"]').forEach(function(a){a.addEventListener('click',function(e){
    var id=a.getAttribute('href').replace(/^\//,'');var t=id.length>1&&$(id);if(!t)return;e.preventDefault();setMenu(false);
    if(lenis)lenis.scrollTo(t,{offset:-90,duration:1.4});else t.scrollIntoView({behavior:reduce?'auto':'smooth'});
  })});

  /* arrivée */
  var heroImg=$('.hero .bg img');
  function go(){root.classList.add('ready');var h=$('.hero h1');if(h)setTimeout(function(){h.classList.add('in')},150)}
  if(heroImg&&!heroImg.complete){heroImg.addEventListener('load',go);setTimeout(go,1000)}else requestAnimationFrame(go);

  /* menu */
  var bg=$('.burger');
  function setMenu(o){root.classList.toggle('menu-open',o);d.body.classList.toggle('lock',o);if(bg)bg.setAttribute('aria-expanded',o);if(lenis)o?lenis.stop():lenis.start()}
  if(bg)bg.addEventListener('click',function(){setMenu(!root.classList.contains('menu-open'))});

  /* défilement : parallaxe, manifeste, calendrier, whatsapp, méthode */
  var hero=$('.hero'),heroBg=$('.hero .bg'),wa=$('.wa'),words=$$('#man .wr'),man=$('#man'),tl=$('#tl'),tlLine=tl&&$('.ln i',tl),tlSt=tl?$$('.st',tl):[];
  var steps=$$('.steps .step'),scr=$$('.stage .scr'),prog=$$('.prog i'),endImg=$('[data-par]');
  var cur=-1;
  function setStep(i){if(i===cur)return;cur=i;steps.forEach(function(s,k){s.classList.toggle('on',k===i)});scr.forEach(function(s,k){s.classList.toggle('on',k===i)});prog.forEach(function(p,k){p.classList.toggle('on',k===i)})}
  function onScroll(){
    var y=window.scrollY,vh=innerHeight;
    if(heroBg&&!reduce&&y<vh*1.2)heroBg.style.transform='translate3d(0,'+(y*.22).toFixed(1)+'px,0)';
    if(wa)wa.classList.toggle('on',y>(hero?hero.offsetHeight*.75:300));
    if(words.length){var r=man.getBoundingClientRect(),p=(vh*.85-r.top)/(r.height+vh*.35);p=Math.max(0,Math.min(1,p));var n=Math.round(p*words.length);for(var i=0;i<words.length;i++)words[i].classList.toggle('on',i<n)}
    if(tl&&tlLine){var r2=tl.getBoundingClientRect(),p2=(vh*.75-r2.top)/(r2.width*.55);p2=Math.max(0,Math.min(1,p2));tlLine.style.setProperty('--p',p2.toFixed(3));tlSt.forEach(function(s,k){s.classList.toggle('on',p2>=k/(tlSt.length-1)-.02)})}
    if(steps.length&&scr.length){var mid=vh*.5,best=0;steps.forEach(function(s,k){if(s.getBoundingClientRect().top<mid)best=k});setStep(best)}
    if(endImg&&!reduce){var r3=endImg.parentNode.getBoundingClientRect();if(r3.top<vh&&r3.bottom>0){var pp=(vh-r3.top)/(vh+r3.height);endImg.style.transform='translate3d(0,'+((.5-pp)*r3.height*.16).toFixed(1)+'px,0)'}}
  }
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();

  /* calculateur */
  var A=$('#c-a'),R=$('#c-r'),U=$('#c-u'),H=$('#c-h');
  function fmt(n){return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
  function pc(v){return (+v).toFixed(1).replace('.0','').replace('.',',')+' %'}
  function dec(v){return (Math.round(v*10)/10).toString().replace('.',',')}
  var shown=0,anim=null;
  function tween(el,from,to){var t0=null;cancelAnimationFrame(anim);(function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/700),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(k<1)anim=requestAnimationFrame(f)})(performance.now())}
  function fill(i){i.style.setProperty('--p',((i.value-i.min)/(i.max-i.min)*100)+'%')}
  function calc(first){
    if(!A)return;[A,R,U,H].forEach(fill);
    var a=+A.value,r=+R.value,u=+U.value,h=+H.value,rdv=a*r/100,cl=rdv*u/100,t=cl*h;
    $('#o-a').textContent=fmt(a);$('#o-r').textContent=pc(r);$('#o-u').textContent=Math.round(u)+' %';$('#o-h').textContent=fmt(h)+' €';
    $('#o-m').textContent=fmt(rdv);$('#o-s').textContent=dec(cl);$('#o-y').textContent=fmt(t*12)+' €';$('#o-l').textContent=dec(rdv/4.33);
    var big=$('#o-t');if(first||reduce)big.textContent=fmt(t);else tween(big,shown,t);shown=t;
  }
  [A,R,U,H].forEach(function(i){if(i)i.addEventListener('input',function(){calc()})});calc(true);

  /* FAQ */
  $$('.qa .it').forEach(function(it){var b=$('button',it);b.addEventListener('click',function(){var o=!it.classList.contains('open');$$('.qa .it.open').forEach(function(x){if(x!==it){x.classList.remove('open');$('button',x).setAttribute('aria-expanded','false')}});it.classList.toggle('open',o);b.setAttribute('aria-expanded',o)})});

  /* apparitions */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target)})},{rootMargin:'0px 0px -10% 0px'});
    $$('.rv,[data-split]:not(.hero h1),.wordmark,.bento .box').forEach(function(el){io.observe(el)});
  }else $$('.rv,[data-split],.wordmark').forEach(function(el){el.classList.add('in')});
})();
