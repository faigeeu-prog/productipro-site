(function(){
  function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
  var nav=document.querySelector('.nav'),bg=document.querySelector('.burger');
  if(bg)bg.addEventListener('click',function(){var o=nav.classList.toggle('open');bg.setAttribute('aria-expanded',o);document.body.classList.toggle('lock',o)});
  $$('.drawer a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');document.body.classList.remove('lock')})});
  var mbar=null;
  function onScroll(){var y=scrollY;nav&&nav.classList.toggle('stuck',y>8);if(mbar)mbar.classList.toggle('on',y>520)}
  var pg=document.createElement('div');pg.className='progress';document.body.appendChild(pg);
  function onProg(){var h=document.documentElement.scrollHeight-innerHeight;pg.style.transform='scaleX('+(h>0?scrollY/h:0)+')'}
  addEventListener('scroll',onProg,{passive:true});onProg();
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* apparition au scroll */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    $$('.rv').forEach(function(el){var p=el.parentElement,k=[].indexOf.call(p.children,el);el.style.transitionDelay=Math.min(k,4)*80+'ms';io.observe(el)});
  }else $$('.rv').forEach(function(el){el.classList.add('in')});

  /* bouton WhatsApp flottant */
  var w=document.querySelector('.wa');
  if(w){var mob=matchMedia('(max-width:700px)');function waVis(){w.classList.toggle('on',!mob.matches||scrollY>innerHeight*.6)}setTimeout(function(){waVis();addEventListener('scroll',waVis,{passive:true})},700)}

  /* mot qui tourne */
  $$('.rot').forEach(function(r){var s=$$('span',r),i=0;if(s.length<2)return;setInterval(function(){var o=s[i];o.classList.remove('on');o.classList.add('out');setTimeout(function(){o.classList.remove('out')},600);i=(i+1)%s.length;s[i].classList.add('on')},2600)});

  /* onglets services */
  $$('.svc').forEach(function(w){
    var b=$$('.svc-list button',w),p=$$('.svc-pane',w);
    b.forEach(function(x,i){x.addEventListener('click',function(){b.forEach(function(y,j){y.setAttribute('aria-selected',i===j);p[j].hidden=i!==j})})});
  });
})();
