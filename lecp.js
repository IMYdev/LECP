(function (g) {
  var OUT = 200, IN = 240, STEP = 35, CAP = 160, SHIFT = 20;
  var LEAVE = 'lecp-section--leaving', ENTER = 'lecp-section--entering';
  var busy = false, queued = null;

  function reduced() { return g.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function sections(host) { return Array.prototype.slice.call(host.querySelectorAll('[data-section]')); }

  function aim(el) {
    var r = el.getBoundingClientRect(), vw = g.innerWidth, vh = g.innerHeight;
    var cx = Math.min(Math.max(r.left + r.width / 2, 0), vw);
    var cy = Math.min(Math.max(r.top + r.height / 2, 0), vh);
    var d = { t: cy, b: vh - cy, l: cx, r: vw - cx };
    if (r.height >= vh * 0.9) d.t = -1;
    var k = Object.keys(d).reduce(function (a, b) { return d[b] < d[a] ? b : a; });
    el.style.setProperty('--lecp-dx', (k === 'l' ? -SHIFT : k === 'r' ? SHIFT : 0) + 'px');
    el.style.setProperty('--lecp-dy', (k === 't' ? -SHIFT : k === 'b' ? SHIFT : 0) + 'px');
  }

  function run(host, cls) {
    var list = sections(host), last = 0;
    list.forEach(function (el, i) {
      last = Math.min(i * STEP, CAP);
      aim(el);
      el.style.setProperty('--lecp-delay', last + 'ms');
      el.classList.remove(LEAVE, ENTER);
      void el.offsetWidth;
      el.classList.add(cls);
    });
    return reduced() ? Promise.resolve() : wait((cls === LEAVE ? OUT : IN) + last);
  }

  function clear(host) {
    sections(host).forEach(function (el) {
      el.classList.remove(ENTER);
      el.style.removeProperty('--lecp-delay');
    });
  }

  async function go(host, render) {
    queued = render;
    if (busy) return;
    busy = true;
    try {
      while (queued) {
        if (sections(host).length) await run(host, LEAVE);
        var fn = queued; queued = null;
        fn(host);
        await run(host, ENTER);
        clear(host);
      }
    } finally { busy = false; }
  }

  g.LECP = { go: go };
})(window);
