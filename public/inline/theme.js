(function () {
  try {
    var h = localStorage.getItem('belofted_theme_hsl');
    if (h) {
      var r = document.querySelector(':root') || document.documentElement;
      r.style.setProperty('--primary', h);
      r.style.setProperty('--accent', h);
      r.style.setProperty('--destructive', h);
      r.style.setProperty('--ring', h);
    }
    var l = localStorage.getItem('belofted_lang');
    if (l) document.documentElement.lang = l;
    var ns = localStorage.getItem('menubar-nav-button-size');
    if (ns) document.documentElement.style.setProperty('--nav-button-size', ns + 'px');
    var ls = localStorage.getItem('menubar-logo-size');
    if (ls) document.documentElement.style.setProperty('--menubar-logo-size', ls + 'px');
  } catch (e) {}
})();
