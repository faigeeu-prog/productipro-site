(function(){
  function $$(s){return [].slice.call(document.querySelectorAll(s))}
  var nav=document.querySelector('.nav'),bg=document.querySelector('.burger');
  function close(){nav.classList.remove('open');document.body.classList.remove('lock');bg&&bg.setAttribute('aria-expanded','false')}
  if(bg)bg.addEventListener('click',function(){var o=nav.classList.toggle('open');bg.setAttribute('aria-expanded',o);document.body.classList.toggle('lock',o)});
  $$('.drawer a').forEach(function(a){a.addEventListener('click',close)});
  var w=document.querySelector('.wa');
  function onScroll(){var y=scrollY;nav&&nav.classList.toggle('stuck',y>8);if(w)w.classList.toggle('on',y>innerHeight*.7)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px'});
    $$('.rv').forEach(function(el){io.observe(el)});
  }else $$('.rv').forEach(function(el){el.classList.add('in')});
})();
