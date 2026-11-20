/* LOVE ALL v6 — prototype behaviour */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scale the canvas to the viewport: 1440 on desktop, 390 on phones ---------- */
  // phones and tablets share the stacked layout; desktops (≥ 1024) get the 1440 canvas
  const mobileMq = matchMedia('(max-width: 1023px)');
  const MOBILE = mobileMq.matches, BASE = MOBILE ? 390 : 1440;
  // the two layouts are built differently (pile, balls), so crossing the breakpoint rebuilds the page
  mobileMq.addEventListener('change', () => location.reload());
  // Tablets: instead of blowing the 390 phone canvas up to 2–2.6×, cap the scale and let the canvas grow wider
  const MAX_Z = 1.35;
  let Z = 1;
  const setZoom = () => {
    const cw = document.documentElement.clientWidth;
    const zz = MOBILE ? Math.min(cw / BASE, MAX_Z) : cw / BASE;
    Z = zz;
    document.documentElement.style.setProperty('--z', zz);
    if (MOBILE) {
      const W = cw / zz;                                 // canvas width in page px: 390 on phones, up to ~760 on tablets
      const dz = Math.max(.5, W / 1440);                 // the 1440 ball-drop court always spans the canvas
      document.documentElement.style.setProperty('--W', W + 'px');
      document.documentElement.style.setProperty('--dz', dz);
      document.documentElement.style.setProperty('--dm', (W - 1440 * dz) / 2 / dz + 'px');
    }
    document.documentElement.style.setProperty('--cz', clamp(zz, .75, 1)); // cursor follows page scale, within limits
  };
  setZoom();
  addEventListener('resize', setZoom);

  /* ---------- Courts tags (phones/tablets): pinned to the photos, wherever the text above pushes them ---------- */
  if (MOBILE) {
    const courts = $('.courts'), [ph1, ph2] = $$('.courts > .photo'), [pin1, pin2] = $$('.courts > .pin');
    const placeTags = () => {
      const c = courts.getBoundingClientRect(), a = ph1.getBoundingClientRect(), b = ph2.getBoundingClientRect();
      const put = (pin, x, y) => { pin.style.setProperty('left', x / Z + 'px', 'important'); pin.style.setProperty('top', y / Z + 'px', 'important'); };
      put(pin1, a.left - c.left - 16 * Z, a.top - c.top - 14 * Z);        // over the top-left corner of the big photo
      // across the bottom of the small one; on tablets (wider canvas) inside its lower edge, clear of the court map
      const tablet = document.documentElement.clientWidth / Z > 400;
      put(pin2, b.left - c.left - (tablet ? 12 : 4) * Z,
        tablet ? b.bottom - c.top - pin2.getBoundingClientRect().height - 18 * Z : b.bottom - c.top - 26 * Z);
    };
    placeTags();
    addEventListener('resize', placeTags);
    document.fonts && document.fonts.ready.then(placeTags);
  }

  /* ---------- Shared selection state ---------- */
  const state = { side: 'White Side', pass: 'Seeded', level: 'Regular', partner: 'Find me a partner' };

  /* ---------- Marquee ---------- */
  const ballImg = s => `<span class="ball" style="--s:${s}px"><img src="img/ball.png" alt=""></span>`;
  const words = ['16–18 July 2027', 'French Riviera', 'Play at your level. Meet beyond it.'];
  const run = Array.from({ length: 4 }, () => words.map(w => `${ballImg(16)}<span class="label">${w}</span>`).join('')).join('');
  $$('.marquee-track').forEach(t => (t.innerHTML = run + run));

  /* ---------- Court map ---------- */
  const courtSvg = '<svg width="58" height="34" viewBox="0 0 58 34"><g fill="#f8f2df"><rect x="28" y="0" width="1" height="34"/><rect x="13" y="5" width="1" height="24"/><rect x="43" y="5" width="1" height="24"/><rect x="13" y="16" width="30" height="1"/><rect x="3" y="5" width="50" height="1"/><rect x="3" y="28" width="50" height="1"/></g></svg>';
  $('#courtMap').innerHTML = Array.from({ length: 9 }, (_, i) => `<span class="mini-court ${i < 3 ? 'match' : ''}">${courtSvg}</span>`).join('');

  /* ---------- Passes ---------- */
  const passes = [
    { id: 'Wildcard', cls: 'p1', no: '01', price: '€290', note: 'for the courts, the crowd <br>and everything after.',
      items: ['Three-day admission', 'Social-court booking, 09:00–14:00 <br>(subject to availability)', 'All matches and evening performances', 'Food court and bar access (purchases separate)', 'One welcome drink'] },
    { id: 'Seeded', cls: 'p2', no: '02', price: '€490', note: 'your name in the draw.', featured: true, intro: 'Everything in Wildcard, plus:',
      items: ['Entry into the team doubles tournament; <br>partners and opponents matched by experience', 'Extended social-court bookings until 18:00', 'Your side’s cap and socks'] },
    { id: 'Grand Slam', cls: 'p3', no: '03', price: '€890', note: 'the full club weekend.', intro: 'Everything in Seeded, plus:',
      items: ['Priority booking for social courts', 'Dinner by the net', 'Reserved front-row seating <br>at the Sunday closing show', 'Exclusive LOVE ALL gift'] },
  ];
  $('#passList').innerHTML = passes.map((p, i) => `
    <div class="pass ${p.cls}" data-pass="${p.id}" style="top:${429 + i * 328}px" role="button" tabindex="0" aria-label="Choose ${p.id}" data-reveal>
      <div class="pass-body">
        <span class="caption pc-brand" style="left:40px;top:36px">Love All&nbsp;&nbsp;/&nbsp;&nbsp;Tennis weekend</span>
        <span class="h3 pc-name" style="left:38px;top:64px">${p.id}</span>
        <span class="note-m" style="left:42px;top:138px;${p.cls === 'p2' ? 'color:var(--ball)' : ''}">${p.note}</span>
        ${p.featured ? '<span class="pill pill-dark label" style="left:209px;top:26px">Featured pass</span>' : ''}
        <span class="caption pc-date" style="left:40px;top:252px">16–18 July 2027&nbsp;&nbsp;·&nbsp;&nbsp;French Riviera</span>
        <span class="h2 pc-price" style="left:386px;top:62px">${p.price}</span>
        <span class="caption pc-per" style="left:392px;top:162px">per person&nbsp;&nbsp;·&nbsp;&nbsp;three days</span>
        <div class="pass-included">
          ${p.intro ? `<span class="label">${p.intro}</span>` : ''}
          ${p.items.map(t => `<div class="pass-item">${ballImg(10)}<span class="body-s">${t}</span></div>`).join('')}
        </div>
        <span class="perf"></span>
        <span class="caption pc-no" style="left:1054px;top:36px">N° ${p.no}</span>
        <span class="h4 pc-code" style="left:1054px;top:58px">LOVEALL 27</span>
        <span class="pill label side-tag" style="left:1054px;top:122px">${state.side}</span>
        <span class="sticker sel-mark" style="${p.cls === 'p2' ? 'background:var(--cream);color:var(--wine);border-color:var(--cream)' : ''}">selected ✓</span>
        <span class="btn label pass-cta ${p.cls === 'p2' ? 'btn-cream' : 'btn-outline'}">Choose ${p.id} <span>→</span></span>
      </div>
      <span class="notch" style="top:-18px"></span><span class="notch" style="top:286px"></span>
    </div>`).join('');

  /* ---------- FAQ ---------- */
  const faqs = [
    ['Do I have to be an experienced player?', 'No. Matches are grouped by experience, whether you’ve just started or play competitively. Tell us your level when you register.'],
    ['Can I come on my own?', 'Of course. Most people do. Pick “Find me a partner” in the request form and we’ll pair you with someone at your level.'],
    ['What if I only want to watch?', 'Take the Wildcard pass. It covers all matches, the evening performances, the food court and the bar, with no racket required.'],
    ['Can I book a private coach?', 'Yes. Our guest coaches give private lessons every morning, €85 per 60 minutes. Tick the coaching box in the form and we’ll confirm a time separately.'],
    ['Are food and drinks included?', 'Food and drinks are paid separately, apart from the welcome drink that comes with every pass. Grand Slam also includes dinner by the net.'],
    ['What should I wear?', 'Build your look around your side’s colour, white or black. One contrasting detail is encouraged.'],
    ['What if it rains?', 'Clay dries quickly. If a summer storm rolls in, play pauses and the schedule shifts; we’ll keep everyone posted on the day.'],
  ];
  $('#faqList').innerHTML = faqs.map(([q, a], i) => `
    <div class="faq-item ${i === 0 ? 'open' : ''}">
      <button class="faq-q" aria-expanded="${i === 0}"><span class="h4">${q}</span><span class="toggle">${i === 0 ? '–' : '+'}</span></button>
      <div class="faq-a"><div><p class="body">${a}</p></div></div>
    </div>`).join('');
  $$('.faq-q').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.parentElement, open = !item.classList.contains('open');
    $$('.faq-item.open').forEach(o => { o.classList.remove('open'); $('.toggle', o).textContent = '+'; $('.faq-q', o).setAttribute('aria-expanded', 'false'); });
    if (open) { item.classList.add('open'); $('.toggle', item).textContent = '–'; btn.setAttribute('aria-expanded', 'true'); }
  }));

  /* ---------- Selection sync (side cards, passes, form chips) ---------- */
  const extra = $('#extra');
  function sync() {
    $$('.side-card').forEach(c => c.setAttribute('aria-pressed', c.dataset.side === state.side));
    $$('.side-tag').forEach(t => (t.textContent = state.side));
    $$('.pass').forEach(p => p.classList.toggle('selected', p.dataset.pass === state.pass));
    $$('.group').forEach(g => $$('.chip', g).forEach(c => c.setAttribute('aria-pressed', c.dataset.value === state[g.dataset.group])));
    extra.classList.toggle('hide', state.pass === 'Wildcard');
  }
  sync();
  const goToForm = () => setTimeout(() => $('#request').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 420);

  $$('.side-card').forEach(c => c.addEventListener('click', () => { state.side = c.dataset.side; sync(); goToForm(); }));
  $$('.pass').forEach(p => {
    const pick = () => { state.pass = p.dataset.pass; sync(); goToForm(); };
    p.addEventListener('click', pick);
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  $$('.group').forEach(g => $$('.chip', g).forEach(c => c.addEventListener('click', () => { state[g.dataset.group] = c.dataset.value; sync(); })));

  /* ---------- Request form ---------- */
  const form = $('#form');
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim();
    const fName = form.name.closest('.field'), fMail = form.email.closest('.field');
    fName.classList.toggle('err', !name);
    fMail.classList.toggle('err', !emailOk(email));
    if (!name) return form.name.focus();
    if (!emailOk(email)) return form.email.focus();
    const btn = $('button[type=submit]', form).getBoundingClientRect();
    burst(btn.left + btn.width / 2, btn.top + btn.height / 2);
    const first = name.split(' ')[0];
    const extras = state.pass === 'Wildcard' ? '' : ` ${state.level} player, ${state.partner.toLowerCase()}.`;
    $('.done-title', form).textContent = `See you on court, ${first}.`;
    $('.done-text', form).innerHTML = `Your request is in: <b>${state.pass}</b> on the <b>${state.side}</b>.${extras}${form.coaching.checked ? ' Coaching session noted.' : ''} <br>We’ll email ${email.replace(/</g, '&lt;')} with availability, payment details and next steps.`;
    $('.form-body', form).hidden = true;
    $('.form-done', form).hidden = false;
  });
  $$('.field input').forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('err')));
  $('#editReq').addEventListener('click', () => { $('.form-body', form).hidden = false; $('.form-done', form).hidden = true; });

  /* ---------- Ball burst ---------- */
  function burst(x, y) {
    if (reduced) return;
    const balls = Array.from({ length: 14 }, () => {
      const el = document.createElement('span'); el.className = 'burst'; document.body.appendChild(el);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, v = 7 + Math.random() * 7;
      return { el, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 360, vr: (Math.random() - .5) * 30, life: 0 };
    });
    const step = () => {
      let alive = false;
      balls.forEach(b => {
        b.life++; b.vy += .45; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        if (b.y > innerHeight - 11 && b.vy > 0) { b.y = innerHeight - 11; b.vy *= -.55; b.vx *= .8; }
        b.el.style.transform = `translate(${b.x}px,${b.y}px) rotate(${b.r}deg)`;
        b.el.style.left = b.el.style.top = 0;
        b.el.style.opacity = clamp(2 - b.life / 60);
        if (b.life < 120) alive = true; else b.el.remove();
      });
      if (alive) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Ball drop: the pile ---------- */
  const pileData = [[-16.48,387.3,155],[394.36,402.55,154],[633.94,390.72,174],[889.54,373.68,184],[33.04,495.87,173],[173.17,501.39,173],[438.2,493.34,166],[706.25,505.25,167],[826.57,490.56,170],[1082.15,495.08,182],[1508.63,499.88,161],[-26.17,599.72,183],[117.37,618.35,158],[235.79,600.53,182],[368.68,615.63,180],[516.42,619.55,169],[623.26,602.67,178],[780.99,611.12,169],[883.64,605.49,182],[1031.49,617.98,159],[1161.48,595.43,184],[1287.92,618.05,169],[1435.87,619.87,155],[1571.67,607.18,159],[-85.59,715.96,169],[35.75,722.54,173],[178.81,731.45,165],[314.08,710.73,179],[424.91,709.95,184],[556.79,713.62,178],[706.47,724.19,160],[846.79,713.12,167],[954.4,711.61,181],[1097.51,738.9,153],[1231.59,735.59,154],[1364.42,716.08,175],[1499.49,725.12,169],[-23.36,831.91,178],[119.63,825.54,174],[251.67,842.69,158],[379.47,839.85,180],[506.94,827.96,161],[625.73,824.1,176],[778.42,828.93,172],[907.99,837.83,175],[1032.33,821.64,173],[1165.31,827.49,185],[1318.82,843.54,153],[1426.03,837.49,157],[1570.71,832.25,175],[-86.38,944.78,173],[35.72,945.1,165],[178.3,944.62,155],[322.61,948.57,164],[440.9,953.89,160],[569.28,950.39,182],[704.08,943.18,179],[845.63,952,164],[986.43,958.79,153],[1094.95,943.51,163],[1220.82,937.49,167],[1379.13,957.02,161],[1487.02,934.33,174]];
  // on phones only the middle of the court is visible (x ≈ 330–1110), so the decorative balls move in there
  const flyers = MOBILE ? [[980,20,92],[850,40,70],[960,250,120]] : [[1134,114,112],[917,67,86],[1264,234,132]];
  const pile = $('#pile'), pileOver = $('#pileOver'), drop = $('#balldrop');

  // Same ball pictures as before. Each PNG is the ball plus a fixed 24/14/34 px margin (at 1×) for its baked
  // shadow; we clip to the ball's circle and draw our own soft contact shadow on the court instead.
  const SRC = [['img/pile1.png', 203], ['img/pile2.png', 202], ['img/pile3.png', 222], ['img/pile4.png', 232],
               ['img/pile5.png', 221], ['img/pile6.png', 221], ['img/pile7.png', 214], ['img/pile8.png', 215]];
  const BALL_SRC = ['img/ball.png', 208];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // stable layout between replays

  function makeBall(parent, x, y, s, [src, base], cls = '') {
    const el = document.createElement('div');
    el.className = 'pb ' + cls;
    el.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px`;
    const d = base - 48, k = s / d; // ball diameter inside the PNG, at 1×
    el.innerHTML = `<span class="pb-shadow"></span><span class="pb-ball"><img data-src="${src}" alt="" decoding="async" style="width:${base * k}px;height:${base * k}px;left:${-24 * k}px;top:${-14 * k}px"></span>`;
    parent.appendChild(el);
    return { el, ball: el.lastChild, shadow: el.firstChild, x, y, s };
  }

  /* Where the balls come to rest. A tiny physics pass (gravity + balls pushing each other apart + the court)
     run once on load: balls that land on top of another roll off its side, so the result is a packed heap,
     nothing hangs in mid-air and there are no holes. The court "floor" dips towards the sides, so the heap
     is highest in the middle of what is visible (phones see only x ≈ 330–1110).
     K < 1 lets neighbours overlap: in the picture balls also sit in front of / behind each other. */
  const K = .82;
  // capped at 1130: lower than that the balls would show below the fade, on the next section
  const floorAt = cx => Math.min(1130, 1060 + (MOBILE ? 170 : 440) * ((cx - 720) / (MOBILE ? 460 : 780)) ** 2);
  function settleAll(items) {
    for (let it = 0; it < 420; it++) {
      items.forEach(p => { p.cy += 3; });                                       // gravity
      for (let k = 0; k < 3; k++) {
        for (let a = 0; a < items.length; a++) for (let c = a + 1; c < items.length; c++) {
          const p = items[a], q = items[c], d = (p.r + q.r) * K;
          let dx = q.cx - p.cx, dy = q.cy - p.cy;
          const dist2 = dx * dx + dy * dy;
          if (dist2 >= d * d) continue;
          if (!dist2) { dx = .01; dy = 0; }
          const dist = Math.sqrt(dx * dx + dy * dy), push = (d - dist) / 2, nx = dx / dist, ny = dy / dist;
          p.cx -= nx * push; p.cy -= ny * push; q.cx += nx * push; q.cy += ny * push;
        }
        items.forEach(p => { p.cy = Math.min(p.cy, floorAt(p.cx) - p.r); p.cx = clamp(p.cx, -120, 1560); });
      }
    }
  }

  // Pile: starts from the Figma positions; sizes varied ±~25% (back rows smaller, front rows larger → depth)
  const specs = pileData.map(([x, y, s], i) => {
    const depth = (y - 387) / (958 - 387);                     // 0 = back row, 1 = front row
    const f = clamp(.8 + depth * .38 + (rnd() - .5) * .16, .75, 1.25);
    const s2 = Math.round(s * f);
    return { i, r: s2 / 2, cx: x + s / 2, cy: y + s - s2 / 2, roll: ((i * 37) % 11 - 5) * 3 };
  });
  // the three decorative balls (hanging by the heading) end up in the heap too
  const flySpecs = flyers.map(([x, y, s], i) => ({ i, r: s / 2, cx: x + s / 2, cy: 300, hangX: x, hangY: y, s }));
  settleAll([...specs, ...flySpecs]);

  const balls = specs.map(o => {
    const s = o.r * 2, b = makeBall(pile, o.cx - o.r - o.roll, o.cy - o.r, s, SRC[o.i % 8]); // lands, then rolls `roll`
    b.el.style.zIndex = Math.round(o.cy + o.r);                // lower on screen = nearer = drawn in front
    return Object.assign(b, { roll: o.roll });
  });

  // A few balls that keep rolling over the bottom edge onto the next section
  const rollers = [[286, 132, 46], [872, 118, -38], [1196, 146, 52]].map(([x, s, dx], i) =>
    Object.assign(makeBall(pileOver, x, 1000 - s * .32, s, SRC[(i * 3 + 1) % 8]), { dx }));

  // Decorative balls by the heading: they sway, then drop and roll to their place in the heap.
  // The element sits under the hanging spot; hanging is just a transform, so the shadow stays on the court.
  const flys = flySpecs.map((o, i) => {
    const land = o.cy - o.r;
    const b = makeBall(pile, o.hangX, land, o.s, BALL_SRC, 'flyer');
    b.el.style.zIndex = Math.round(o.cy + o.r);
    b.roll = o.cx - o.r - o.hangX;                             // sideways roll from under the hanging spot
    b.lift = land - o.hangY;
    b.ball.style.transform = `translateY(${-b.lift}px)`;
    b.ball.style.animationDelay = `${-i * 1.2}s`;
    b.shadow.style.opacity = 0;
    return b;
  });

  // The ~2.6 MB of ball pictures aren't needed on the first screen: they start loading once the visitor
  // reaches the Schedule (well before the court), or a few seconds after the page has loaded, whichever is first.
  // (Native lazy-loading can't be used: the pile is hidden until the drop, and hidden images never load.)
  let ballsRequested = false;
  const loadBalls = () => {
    if (ballsRequested) return; ballsRequested = true;
    $$('#balldrop img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  };
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { loadBalls(); o.disconnect(); } },
    { rootMargin: '0px 0px 600px 0px' }).observe($('#schedule'));
  addEventListener('load', () => setTimeout(loadBalls, 4000));

  const zoomNow = () => drop.getBoundingClientRect().width / 1440; // the court is 1440 wide in its own units
  const anims = [];
  const play = (el, kf, opts) => { const a = el.animate(kf, { fill: 'both', ...opts }); anims.push(a); return a; };

  // Fall → 1–2 small bounces → a short roll. Bounces + roll stay within ~0.25 s.
  // The shadow stays on the ground under the ball: it follows x, grows and darkens as the ball comes down.
  function bounceFall(b, { from, delay, fall, dx, endY = 0, rollTo, r0 = (rnd() - .5) * 160 }) {
    const turn = x => r0 + (x / (Math.PI * b.s)) * 360;       // rolling: angle follows distance
    const h1 = b.s * (.09 + rnd() * .07), two = rnd() > .35;  // 1 or 2 small hops
    const T = fall + (two ? 240 : 170) + (rollTo ? 380 : 0);
    let t = 0;
    const kf = [], sh = [];
    const key = (dt, x, y, ease, shOp, shSc) => {
      t += dt;
      kf.push({ offset: t / T, transform: `translate(${x}px,${y}px) rotate(${turn(x)}deg)`, easing: ease });
      sh.push({ offset: t / T, transform: `translate(${x}px,${endY}px) scale(${shSc})`, opacity: shOp, easing: ease });
    };
    const DOWN = 'cubic-bezier(.5,0,.85,.45)', UP = 'cubic-bezier(.2,.6,.4,1)';
    key(0, 0, from, DOWN, 0, .35);                        // high above — no shadow yet
    key(fall, 0, endY, UP, 1, 1);                         // impact (gravity: accelerating)
    key(60, dx * .35, endY - h1, DOWN, .6, .82);          // hop 1
    key(60, dx * .7, endY, UP, 1, 1);
    if (two) { key(35, dx * .82, endY - h1 * .32, DOWN, .8, .92); key(35, dx * .92, endY, UP, 1, 1); } // hop 2
    key(50, dx, endY, 'cubic-bezier(.25,.8,.3,1)', 1, 1); // short roll to a stop
    if (rollTo) {                                          // …or keep rolling over the edge
      const [rx, ry] = rollTo, x = dx + rx;
      kf.push({ offset: 1, transform: `translate(${x}px,${endY + ry}px) rotate(${turn(x)}deg)` });
      sh.push({ offset: 1, transform: `translate(${x}px,${endY + ry}px) scale(1)`, opacity: .7 });
    }
    kf[kf.length - 1].offset = sh[sh.length - 1].offset = 1;
    play(b.ball, kf, { duration: T, delay });
    play(b.shadow, sh, { duration: T, delay });
    return delay + T;
  }

  /* The drop plays once (by time) when the court comes into view; scrolling back up doesn't undo it.
     It is reset only once the section is completely out of view below, so it can play again next time. */
  let dropped = false, landTimer = 0, flyTimers = [];
  function doDrop() {
    if (dropped) return; dropped = true;
    drop.classList.add('dropped');
    if (reduced) { drop.classList.add('landed'); return; } // reduced motion: the pile simply rests in place
    // start every ball above the top edge of the viewport
    const above = Math.max(0, drop.getBoundingClientRect().top / zoomNow()) + 80;
    let end = 0;
    balls.forEach(b => {
      const depth = (b.y - 387) / (958 - 387);
      end = Math.max(end, bounceFall(b, {
        from: -(above + b.y + b.s + rnd() * 160),
        delay: (1 - depth) * 380 + rnd() * 140,  // front rows land first, the pile builds up
        fall: 380 + rnd() * 220,                 // different falling speeds
        dx: b.roll,                              // a little roll after landing (already counted in its resting spot)
      }));
    });
    rollers.forEach((b, i) => {
      end = Math.max(end, bounceFall(b, {
        from: -(above + b.y + b.s + 60), delay: 120 + i * 90, fall: 460 + i * 40,
        dx: b.dx * .4, endY: -b.s * .55, rollTo: [b.dx, b.s * .55],
      }));
    });
    // "The sides disappear." only on the finished pile
    landTimer = setTimeout(() => drop.classList.add('landed'), end);
    // then the decorative balls let go and drop into the pile
    const flyStart = Math.max(0, end - 250);
    flyTimers = flys.map((b, i) => setTimeout(() => {
      b.el.classList.add('fallen');
      bounceFall(b, { from: -b.lift, delay: 0, fall: 330 + i * 40, dx: b.roll, r0: 0 });
    }, flyStart + i * 110));
  }
  function resetDrop() {
    if (!dropped) return;
    dropped = false; clearTimeout(landTimer); flyTimers.forEach(clearTimeout);
    anims.splice(0).forEach(a => a.cancel());
    drop.classList.remove('dropped', 'landed');
    flys.forEach(b => { b.el.classList.remove('fallen'); b.ball.style.transform = `translateY(${-b.lift}px)`; b.shadow.style.opacity = 0; });
  }

  /* ---------- Scroll observers ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('[data-reveal]').forEach(el => io.observe(el));

  // play when 30% of the court is visible…
  // (on a slow connection, give the ball pictures up to 1.5 s to arrive so the pile never falls invisible)
  const ballsReady = () => { loadBalls(); return Promise.race([Promise.all($$('#pile img').map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 1500))]); };
  let dropPending = false;
  new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || dropped || dropPending) return;
    dropPending = true;
    ballsReady().then(() => { dropPending = false; if (drop.getBoundingClientRect().top < innerHeight) doDrop(); });
  }), { threshold: .3 }).observe(drop);
  // …and reset only when it is entirely out of view below (scrolled back above it), never while visible
  new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting && e.boundingClientRect.top > 0) resetDrop();
  }), { threshold: 0 }).observe(drop);

  const slots = $$('.slot'), fill = $('.timeline-fill');

  /* Active nav link */
  const links = $$('.nav-links a');
  const navIo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'schedule', 'evenings', 'passes', 'faq'].forEach(id => navIo.observe(document.getElementById(id)));

  /* Hero: scroll scrubs the video forwards and backwards */
  const track = $('.hero-track'), hero = $('.hero'), video = $('#heroVideo'), heroPills = $('.hero-pills');
  let heroP = 0, tShown = -1, vShown = -1;
  // Upright windows (phones) get the vertical cut of the clip, wide ones the original 16:9 clip.
  // Chosen by the window shape, not the layout breakpoint; set here, so only one of the two files is downloaded.
  // No reload when the shape changes: in a near-square window that flips back and forth and would loop.
  // The clip is swapped in place instead (the timings below follow it).
  let TALL = innerHeight > innerWidth;
  video.src = TALL ? video.dataset.srcMobile : video.dataset.src;
  matchMedia('(orientation: portrait)').addEventListener('change', e => {
    if (e.matches === TALL) return;
    TALL = e.matches;
    video.src = TALL ? video.dataset.srcMobile : video.dataset.src;
    vShown = -1;
    video.play().then(() => video.pause()).catch(() => {});
  });
  // Timings inside love_all_transition.mp4 (measured from the frames).
  // The vertical clip turns solid wine at 5.3 s and stays wine to its end (6.33 s).
  // The clip's own Manifesto is a 16:9 picture and gets cropped in taller windows, so we never show it:
  // the video stops on the all-red frame and the real page performs the same dissolve instead.
  const T_RED_OF = () => TALL ? 5.32 : 5.8;     // 5.7–5.9 s: the frame is solid wine — the video stops here
  const FADE_OF = () => TALL ? [5.35, 5.7] : [5.85, 6.2];   // the clip's dissolve into the second screen, replayed on the real page
  const END = .99;            // scroll progress at which the dissolve is complete
  const manifesto = $('#about');
  // the Manifesto appears whole, like in the clip (no per-element fade-ups)
  $$('#about [data-reveal]').forEach(el => { el.classList.add('in'); io.unobserve(el); });
  // the loop runs from the start, so the page still reveals even if the video is slow or fails to load
  video.addEventListener('loadedmetadata', () => { video.pause(); vShown = -1; });
  requestAnimationFrame(tickVideo);
  // iOS/Safari only paint seeks after the video has been "played" once
  video.play().then(() => video.pause()).catch(() => {});
  function tickVideo() {
    // keep the loop alive whatever happens in a frame — if it ever stopped, the first screen would freeze
    requestAnimationFrame(tickVideo);
    // one timeline for the whole first screen: 0→T_RED is the video, then the page's dissolve
    const T_RED = T_RED_OF(), FADE = FADE_OF();
    const target = clamp(heroP / END) * FADE[1];
    if (!Number.isFinite(tShown)) tShown = -1;
    // ease toward the target so wheel steps feel like a smooth glide, both directions
    tShown = tShown < 0 ? target : tShown + (target - tShown) * (reduced ? 1 : .22);
    if (Math.abs(target - tShown) < 0.002) tShown = target;
    const vt = Math.min(tShown, T_RED);
    if (video.duration && Number.isFinite(vt) && Math.abs(vt - vShown) > 0.004 && !video.seeking) { video.currentTime = vt; vShown = vt; }
    // past the pinned zone (e.g. after a nav jump) the page is simply fully there
    const o = heroP >= 1 ? 1 : clamp((tShown - FADE[0]) / (FADE[1] - FADE[0]));
    manifesto.style.opacity = o;
    manifesto.classList.toggle('revealed', o > .98);
  }
  function onScroll() {
    const r = track.getBoundingClientRect(), h = hero.getBoundingClientRect().height;
    // a hidden or zero-size window gives 0/0 here — keep the last good value instead of NaN
    const p = -r.top / (r.height - h);
    if (Number.isFinite(p)) heroP = clamp(p);
    // keep the Manifesto parked on screen while the video is pinned, so its first screen
    // is already in place when it opens; afterwards it scrolls normally
    const parked = r.bottom - h; // screen px between the Manifesto's natural top and the viewport top
    manifesto.style.transform = parked > 0 ? `translateY(${-parked / Z}px)` : '';
    // pills stay on the video and step aside as the ball reaches the lens
    const q = clamp((heroP - .55) / .25);
    heroPills.style.opacity = 1 - q;
    heroPills.style.transform = `translateY(${q * 40}px)`;

    // timeline fills as you scroll through "A day at the club"
    const tr = $('#timeline').getBoundingClientRect();
    const tp = clamp((innerHeight * .85 - tr.top) / (innerHeight * .45));
    fill.style.transform = `scaleX(${tp})`;
    slots.forEach((s, i) => s.classList.toggle('lit', tp >= (i * 342) / 1344 + .01));
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Tennis-ball cursor ---------- */
  if (matchMedia('(pointer: fine)').matches) {
    document.documentElement.classList.add('has-ball-cursor');
    const cur = $('.cursor'), ball = $('.cursor-ball'), body = $('.cursor-body');
    let mx = -100, my = -100, x = mx, y = my, rot = 0, seen = false;
    // only real controls: buttons, links, chips, the checkbox (not cards, photos or containers)
    const HOVER = 'a, .btn, .chip, label.check, .faq-q';
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { x = mx; y = my; seen = true; }
      cur.classList.add('on');
      const t = e.target;
      cur.classList.toggle('text', !!t.closest('input:not([type=checkbox])'));
      cur.classList.toggle('hover', !t.closest('input') && !!t.closest(HOVER));
    }, { passive: true });
    // Over the falling-balls court the ball cursor would hang among the falling balls, so there it steps
    // aside for the normal arrow. Re-checked on scroll too: wheel-scrolling moves the page, not the mouse.
    const checkDrop = () => {
      const over = !!document.elementFromPoint(mx, my)?.closest('#balldrop');
      document.documentElement.classList.toggle('cursor-native', over);
    };
    addEventListener('mousemove', checkDrop, { passive: true });
    addEventListener('scroll', checkDrop, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    document.addEventListener('mouseenter', () => cur.classList.add('on'));
    addEventListener('mousedown', () => cur.classList.add('down'));
    addEventListener('mouseup', e => {
      cur.classList.remove('down');
      cur.classList.remove('bounce'); void body.offsetWidth; cur.classList.add('bounce');
      const m = document.createElement('span'); m.className = 'court-mark';
      m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 14 + 'px';
      document.body.appendChild(m); setTimeout(() => m.remove(), 700);
    });
    body.addEventListener('animationend', () => cur.classList.remove('bounce'));
    const loop = () => {
      const k = reduced ? 1 : .28;
      const nx = x + (mx - x) * k, ny = y + (my - y) * k;
      rot += ((nx - x) + (ny - y) * .45) * 3.8; // roll ≈ distance / circumference
      x = nx; y = ny;
      cur.style.transform = `translate(${x}px, ${y}px)`;
      ball.style.transform = `rotate(${rot}deg)`;
      requestAnimationFrame(loop);
    };
    loop();
  }
})();

// iOS Safari only applies :active (the touch press response) when the page listens for touches
document.addEventListener('touchstart', () => {}, { passive: true });
