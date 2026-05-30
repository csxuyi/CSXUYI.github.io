/* ==========================================================================
   X[STELLAR_WISH] · Page Transition
   内部链接淡入淡出过渡，overlay 通过 HTML 静态放置保证无闪烁
   ========================================================================== */
(function(){
'use strict';

var overlay = document.getElementById('pt-overlay');
if(!overlay) return;

// Entry animation: fade out overlay on page load
if(sessionStorage.getItem('pt-entering')){
  sessionStorage.removeItem('pt-entering');
  // Start fully opaque, then fade
  overlay.style.opacity = '1';
  // Wait for next frame to ensure CSS transition is active
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      overlay.style.opacity = '0';
    });
  });
  // Clean up after transition
  setTimeout(function(){
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }, 500);
}

// Intercept internal link clicks for exit animation
document.addEventListener('click',function(e){
  var a = e.target.closest('a');
  if(!a) return;
  var href = a.getAttribute('href');
  if(!href) return;
  if(href.startsWith('http') && !href.startsWith(location.origin)) return;
  if(href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
  if(a.classList.contains('portal')) return; // wormhole.js handles portals
  if(a.getAttribute('download')!==null) return;
  if(a.getAttribute('target')==='_blank') return;
  if(overlay.style.opacity === '1') return;

  e.preventDefault();
  sessionStorage.setItem('pt-entering','1');
  overlay.style.pointerEvents = 'auto';
  overlay.style.opacity = '1';
  setTimeout(function(){
    location.href = href;
  }, 350);
});

})();
