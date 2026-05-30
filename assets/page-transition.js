/* ==========================================================================
   X[STELLAR_WISH] · Page Transition
   所有内部链接的淡入淡出过渡效果
   ========================================================================== */
(function(){
'use strict';

// Create overlay
var overlay = document.createElement('div');
overlay.id = 'pt-overlay';
overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;'+
  'background:radial-gradient(ellipse at 50% 50%,rgba(5,8,26,0.92),rgba(2,2,12,0.98));'+
  'opacity:0;transition:opacity 0.35s ease';
document.body.appendChild(overlay);

// Fade in on page load
window.addEventListener('DOMContentLoaded',function(){
  // Start fully visible (from navigation), then fade out
  if(sessionStorage.getItem('pt-entering')){
    sessionStorage.removeItem('pt-entering');
    overlay.style.opacity = '1';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        overlay.style.opacity = '0';
      });
    });
  }
});

// Intercept internal link clicks
document.addEventListener('click',function(e){
  var a = e.target.closest('a');
  if(!a) return;
  var href = a.getAttribute('href');
  if(!href) return;
  // Only intercept same-origin html navigation
  if(href.startsWith('http') && !href.startsWith(location.origin)) return;
  if(href.startsWith('#') || href.startsWith('javascript:')) return;
  // Skip if already transitioning or wormhole handles it
  if(a.classList.contains('portal')) return; // wormhole.js handles portals
  if(overlay.style.opacity === '1') return;

  e.preventDefault();
  // Mark for entry animation on next page
  sessionStorage.setItem('pt-entering','1');
  // Fade out
  overlay.style.opacity = '1';
  setTimeout(function(){
    location.href = href;
  }, 350);
});

})();
