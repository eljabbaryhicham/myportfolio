(function () {
  function setAppHeight() {
    try {
      var vv = window.visualViewport;
      var h = Math.round((vv ? vv.height : 0) || window.innerHeight || document.documentElement.clientHeight);
      if (h > 0) document.documentElement.style.setProperty('--app-height', h + 'px');
    } catch (e) {}
  }
  setAppHeight();
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', function () {
    setTimeout(setAppHeight, 150);
  });
})();
