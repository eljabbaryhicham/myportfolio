(function () {
  try {
    var ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) document.documentElement.classList.add('is-android');
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
      document.documentElement.classList.add('is-ios');
  } catch (e) {}
})();
