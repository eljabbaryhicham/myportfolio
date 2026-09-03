(function () {
  // Remove keyboard focus ability site-wide. Interactive elements are made
  // non-focusable via tabindex="-1" so no focus ring can ever appear and the
  // Tab key cannot move focus to them. Mouse/touch clicks still work.
  var SEL = 'a[href],button,input,select,textarea,iframe,audio,video,[tabindex]';

  function disable(root) {
    try {
      var els = root.querySelectorAll ? root.querySelectorAll(SEL) : [];
      for (var i = 0; i < els.length; i++) {
        els[i].setAttribute('tabindex', '-1');
      }
    } catch (e) {}
  }

  disable(document);

  document.addEventListener('focusin', function (e) {
    if (e && e.target && e.target.setAttribute) e.target.setAttribute('tabindex', '-1');
  }, true);
})();
