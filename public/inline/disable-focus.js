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

  // Disable elements already in the DOM, then watch for newly added ones
  // (e.g. after React hydrates or renders dialogs/menus).
  disable(document);

  if (window.MutationObserver) {
    var mo = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          var node = added[n];
          if (node && node.nodeType === 1) disable(node);
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
