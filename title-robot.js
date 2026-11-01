(function titleRobot() {
  const title = document.querySelector(".hero h1");
  const text = title.textContent.trim();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const version = document.currentScript.dataset.version;
  if (reduced) return;

  // Letters that land wrong, each with its own mistake.
  const MISTAKES = [
    { word: "LEARNING", index: 3, pose: "translate(0.05em, 0.14em) rotate(19deg)" },
    { word: "WORLD", index: 0, pose: "translate(-0.07em, 0.05em) rotate(-24deg)" },
    { word: "DEPLOYMENT", index: 5, pose: "rotate(180deg)" },
  ];

  // Version 2: the heading starts with these errors; the first pass only partly solves them.
  const FIRST_TRY = [
    { word: "ROBUST", index: 2, pose: "rotate(180deg)", first: "fix" },
    { word: "LEARNING", index: 3, pose: "translate(0.05em, 0.14em) rotate(19deg)", first: "translate(0.02em, 0.06em) rotate(8deg)" },
    { word: "FOR", index: 1, pose: "translate(0, -0.12em) rotate(-16deg)", first: "skip" },
    { word: "WORLD", index: 0, pose: "translate(-0.07em, 0.05em) rotate(-24deg)", first: "fix" },
    { word: "DEPLOYMENT", index: 5, pose: "rotate(180deg)", first: "rotate(155deg)" },
  ];

  const POSES = ["rotate(180deg)", "translate(0.04em, 0.12em) rotate(22deg)", "translate(-0.05em, -0.1em) rotate(-20deg)"];

  const BOT = `
    <svg viewBox="0 0 120 124" aria-hidden="true">
      <line x1="60" y1="27" x2="60" y2="10" stroke="#5e6b78" stroke-width="5" stroke-linecap="round"/>
      <circle cx="60" cy="9" r="8" fill="#cd2e3a"/>
      <circle cx="57" cy="6" r="2.5" fill="#fff" opacity=".8"/>
      <g class="bot-arm"><path d="M60 84 L60 112" stroke="#f0b93a" stroke-width="7" stroke-linecap="round"/><path d="M52 118 Q60 106 68 118" fill="none" stroke="#f0b93a" stroke-width="6" stroke-linecap="round"/></g>
      <rect x="12" y="84" width="96" height="30" rx="15" fill="#2c3440"/>
      <g class="bot-wheel"><circle cx="30" cy="99" r="11" fill="#566373"/><rect x="28" y="89" width="4" height="20" rx="2" fill="#2c3440"/></g>
      <g class="bot-wheel"><circle cx="60" cy="99" r="11" fill="#566373"/><rect x="58" y="89" width="4" height="20" rx="2" fill="#2c3440"/></g>
      <g class="bot-wheel"><circle cx="90" cy="99" r="11" fill="#566373"/><rect x="88" y="89" width="4" height="20" rx="2" fill="#2c3440"/></g>
      <rect x="44" y="76" width="32" height="12" rx="4" fill="#c9d1d6"/>
      <rect x="10" y="26" width="100" height="56" rx="24" fill="#fbf6ea"/>
      <rect x="10" y="26" width="100" height="56" rx="24" fill="none" stroke="#d9cfba" stroke-width="3"/>
      <rect x="21" y="35" width="78" height="38" rx="17" fill="#002f6c"/>
      <circle cx="16" cy="62" r="0" fill="none"/>
      <circle cx="31" cy="64" r="5" fill="#f4a0b5" opacity=".75"/>
      <circle cx="89" cy="64" r="5" fill="#f4a0b5" opacity=".75"/>
      <g class="bot-face face-normal"><g class="bot-eyes"><circle cx="45" cy="52" r="7" fill="#f0b93a"/><circle cx="75" cy="52" r="7" fill="#f0b93a"/></g><path d="M54 62 Q60 67 66 62" fill="none" stroke="#f0b93a" stroke-width="3" stroke-linecap="round"/></g>
      <g class="bot-face face-look"><circle cx="41" cy="51" r="7" fill="#f0b93a"/><circle cx="71" cy="51" r="7" fill="#f0b93a"/><path d="M53 64 h12" stroke="#f0b93a" stroke-width="3" stroke-linecap="round"/></g>
      <g class="bot-face face-think"><circle cx="49" cy="47" r="7" fill="#f0b93a"/><circle cx="79" cy="47" r="4.5" fill="#f0b93a"/><path d="M52 64 q6 -5 12 0" fill="none" stroke="#f0b93a" stroke-width="3" stroke-linecap="round"/></g>
      <g class="bot-face face-happy"><path d="M37 54 q8 -11 16 0 M67 54 q8 -11 16 0" fill="none" stroke="#f0b93a" stroke-width="4.5" stroke-linecap="round"/><path d="M51 60 Q60 71 69 60" fill="#f0b93a"/></g>
    </svg>
    <span class="bot-bubble"></span>`;

  title.setAttribute("aria-label", text);
  title.innerHTML = text.split(" ").map(word =>
    `<span class="word" aria-hidden="true" data-word="${word.toUpperCase()}">${[...word].map(c => `<span class="ch">${c}</span>`).join("")}</span>`
  ).join(" ");

  const bot = document.createElement("div");
  bot.className = "title-bot";
  bot.dataset.face = "normal";
  bot.innerHTML = BOT;
  title.append(bot);
  const svg = bot.querySelector("svg"), bubble = bot.querySelector(".bot-bubble"), wheels = bot.querySelectorAll(".bot-wheel");

  const replay = document.createElement("button");
  replay.type = "button";
  replay.className = "title-replay";
  replay.textContent = "Replay";
  document.querySelector(".hero-inner").append(replay);

  const chars = [...title.querySelectorAll(".ch")];
  const pos = { x: 0, y: 0, flip: 1, tilt: 0, spin: 0 };
  let run = 0;

  function place() {
    bot.style.transform = `translate(${pos.x - bot.offsetWidth / 2}px, ${pos.y - bot.offsetHeight}px)`;
    svg.style.transform = `scaleX(${pos.flip}) rotate(${pos.tilt}deg)`;
    wheels.forEach(w => { w.style.transform = `rotate(${pos.spin}deg)`; });
  }

  function measure() {
    const box = title.getBoundingClientRect();
    const size = parseFloat(getComputedStyle(title).fontSize);
    const lines = [];
    for (const el of chars) {
      el.style.transform = "";
      const r = el.getBoundingClientRect();
      let line = lines.find(l => Math.abs(l.top - (r.top - box.top)) < 4);
      if (!line) lines.push(line = { top: r.top - box.top, height: r.height, letters: [] });
      line.letters.push({ el, x: r.left - box.left + r.width / 2 });
    }
    lines.forEach(l => { l.road = l.top + l.height / 2 - size * 0.42; l.left = l.letters[0].x; l.right = l.letters.at(-1).x; });
    return { lines, size, width: box.width };
  }

  const wait = (ms, id) => new Promise((done, stop) => setTimeout(() => (id === run ? done() : stop()), ms));

  function tween(ms, id, step) {
    return new Promise((done, stop) => {
      const start = performance.now();
      requestAnimationFrame(function tick(now) {
        if (id !== run) return stop();
        const k = Math.min(1, (now - start) / ms);
        step(k);
        place();
        k < 1 ? requestAnimationFrame(tick) : done();
      });
    });
  }

  const smooth = k => k * k * (3 - 2 * k);

  async function drive(x, speed, id, onMove) {
    const from = pos.x, dist = Math.abs(x - from);
    if (dist < 1) return;
    pos.flip = x < from ? -1 : 1;
    await tween((dist / speed) * 1000, id, k => {
      pos.x = from + (x - from) * k;
      pos.spin += (pos.flip * dist) / 40;
      pos.tilt = Math.sin(k * 40) * 1.6;
      onMove?.(pos.x);
    });
    pos.tilt = 0;
  }

  async function hop(x, y, id) {
    const fromX = pos.x, fromY = pos.y;
    pos.flip = x < fromX ? -1 : 1;
    await tween(520, id, k => {
      const e = smooth(k);
      pos.x = fromX + (x - fromX) * e;
      pos.y = fromY + (y - fromY) * e - Math.sin(k * Math.PI) * 34;
    });
  }

  function dropLetter(letter, size) {
    const el = letter.el, pose = letter.pose ?? "none";
    el.style.visibility = "visible";
    el.style.transform = pose === "none" ? "" : pose;
    el.animate(
      [
        { transform: `translateY(${-size * 0.62}px) scale(.3)`, opacity: 0.4 },
        { transform: `translateY(${size * 0.04}px) ${pose === "none" ? "" : pose}`, opacity: 1, offset: 0.65 },
        { transform: pose },
      ],
      { duration: 340, easing: "ease-in" },
    );
  }

  const say = (message, face) => {
    bubble.textContent = message;
    bubble.classList.toggle("show", !!message);
    if (face) bot.dataset.face = face;
  };

  function locate(list, lines) {
    const found = [];
    for (const m of list) {
      const word = title.querySelector(`.word[data-word*="${m.word}"]`);
      const el = word?.querySelectorAll(".ch")[m.word === "WORLD" ? 5 : m.index];
      const line = lines.find(l => l.letters.some(item => item.el === el));
      const letter = line?.letters.find(item => item.el === el);
      if (letter) { letter.pose = m.pose; found.push({ letter, line, first: m.first }); }
    }
    return found;
  }

  async function adjust(item, to, id, size) {
    bot.dataset.reach = "";
    await wait(240, id);
    const el = item.letter.el, from = el.style.transform || "none", end = to ?? "none";
    el.style.transform = to ?? "";
    el.animate(
      [{ transform: from }, { transform: `translateY(${-size * 0.14}px) ${end === "none" ? "" : end}`, offset: 0.55 }, { transform: end }],
      { duration: 460, easing: "ease-in-out" },
    );
    await wait(470, id);
    delete bot.dataset.reach;
  }

  async function goTo(item, id, size) {
    if (Math.abs(pos.y - item.line.road) > 2) await hop(item.letter.x, item.line.road, id);
    else await drive(item.letter.x, size * 6, id);
  }

  async function startSecondVersion() {
    const id = ++run;
    replay.classList.remove("show");
    say("", "normal");
    delete bot.dataset.reach;
    chars.forEach(el => { el.getAnimations().forEach(a => a.cancel()); });
    const { lines, size, width } = measure();
    chars.forEach(el => { el.style.visibility = "visible"; });
    const items = locate(FIRST_TRY, lines);
    items.forEach(i => { i.letter.el.style.transform = i.letter.pose; });

    const margin = size * 0.42;
    pos.x = -margin * 2;
    pos.y = lines[0].road;
    pos.flip = 1;
    bot.style.opacity = 0;
    place();
    await wait(1400, id);
    bot.style.opacity = 1;

    // First try: fixes some letters, half-fixes others, and misses one.
    for (const item of items) {
      await goTo(item, id, size);
      if (item.first === "skip") continue;
      await adjust(item, item.first === "fix" ? null : item.first, id, size);
      say("", "happy");
      await wait(200, id);
      say("", "normal");
    }

    const home = lines.at(-1);
    await hopOrDrive(home, id, margin, width);
    await wait(350, id);
    pos.flip = -1;
    place();
    say("", "look");
    await wait(800, id);
    say("?", "think");
    await wait(800, id);
    say("...", "think");
    await wait(1000, id);
    say("!", "happy");
    await tween(280, id, k => { pos.y = home.road - Math.sin(k * Math.PI) * 18; });
    await wait(260, id);
    say("", "normal");

    // Second try: everything still wrong, working back from the end.
    for (const item of [...items].reverse()) {
      if (item.first === "fix") continue;
      await goTo(item, id, size);
      await adjust(item, null, id, size);
      say("", "happy");
      await wait(200, id);
      say("", "normal");
    }

    await celebrate(home, id, margin, width);
    replay.classList.add("show");

    // Version 3: a random letter distorts by itself, and the robot goes to repair it.
    while (version === "3") {
      await wait(2200, id);
      const line = lines[Math.floor(Math.random() * lines.length)];
      const letter = line.letters[Math.floor(Math.random() * line.letters.length)];
      const item = { letter, line };
      const pose = POSES[Math.floor(Math.random() * POSES.length)];
      letter.el.style.transform = pose;
      letter.el.animate([{ transform: "none" }, { transform: pose }], { duration: 380, easing: "cubic-bezier(.3,1.5,.6,1)" });
      await wait(450, id);
      say("!", "look");
      await tween(280, id, k => { pos.y = home.road - Math.sin(k * Math.PI) * 18; });
      await wait(260, id);
      say("", "normal");
      await goTo(item, id, size);
      say("?", "think");
      await wait(550, id);
      say("", "normal");
      await adjust(item, null, id, size);
      say("", "happy");
      await wait(300, id);
      say("", "normal");
      await celebrate(home, id, margin, width);
    }
  }

  async function celebrate(home, id, margin, width) {
    await hopOrDrive(home, id, margin, width);
    pos.flip = 1;
    say("", "happy");
    for (let i = 0; i < 2; i++) {
      await tween(300, id, k => { pos.y = home.road - Math.sin(k * Math.PI) * 16; });
    }
  }

  async function start() {
    const id = ++run;
    replay.classList.remove("show");
    say("", "normal");
    delete bot.dataset.reach;
    chars.forEach(el => { el.getAnimations().forEach(a => a.cancel()); });
    const { lines, size, width } = measure();
    chars.forEach(el => { el.style.visibility = "hidden"; });

    const wrong = [];
    for (const m of MISTAKES) {
      const word = title.querySelector(`.word[data-word*="${m.word}"]`);
      const el = word?.querySelectorAll(".ch")[m.word === "WORLD" ? 5 : m.index];
      const line = lines.find(l => l.letters.some(item => item.el === el));
      const letter = line?.letters.find(item => item.el === el);
      if (letter) { letter.pose = m.pose; wrong.push({ letter, line }); }
    }

    const margin = size * 0.42;
    pos.x = -margin * 2;
    pos.y = lines[0].road;
    pos.flip = 1;
    bot.style.opacity = 1;
    place();

    for (const [n, line] of lines.entries()) {
      if (n > 0) {
        await hop(Math.min(pos.x, width - margin), line.road, id);
        await drive(line.left - margin * 1.2, 1500, id);
        pos.flip = 1;
        await wait(120, id);
      }
      let next = 0;
      await drive(Math.min(line.right + margin, width + margin), size * 5.4, id, x => {
        while (next < line.letters.length && line.letters[next].x <= x) dropLetter(line.letters[next++], size);
      });
      while (next < line.letters.length) dropLetter(line.letters[next++], size);
    }

    // Notice, think, and go back to fix each mistake, nearest first.
    await wait(450, id);
    pos.flip = -1;
    place();
    say("", "look");
    await wait(700, id);
    say("?", "think");
    await wait(750, id);
    say("...", "think");
    await wait(900, id);
    say("!", "happy");
    await tween(280, id, k => { pos.y = lines.at(-1).road - Math.sin(k * Math.PI) * 18; });
    await wait(280, id);
    say("", "normal");

    for (const { letter, line } of [...wrong].reverse()) {
      if (Math.abs(pos.y - line.road) > 2) await hop(letter.x, line.road, id);
      else await drive(letter.x, size * 8, id);
      bot.dataset.reach = "";
      await wait(260, id);
      const el = letter.el, pose = letter.pose;
      el.style.transform = "";
      el.animate(
        [{ transform: pose }, { transform: `translateY(${-size * 0.14}px) rotate(0deg)`, offset: 0.55 }, { transform: "translateY(0)" }],
        { duration: 460, easing: "ease-in-out" },
      );
      await wait(470, id);
      delete bot.dataset.reach;
      say("", "happy");
      await wait(240, id);
      say("", "normal");
    }

    const home = lines.at(-1);
    await hopOrDrive(home, id, margin, width);
    pos.flip = 1;
    say("", "happy");
    for (let i = 0; i < 2; i++) {
      await tween(300, id, k => { pos.y = home.road - Math.sin(k * Math.PI) * 16; });
    }
    replay.classList.add("show");
  }

  async function hopOrDrive(home, id, margin, width) {
    const x = Math.min(home.right + margin, width + margin);
    if (Math.abs(pos.y - home.road) > 2) await hop(x, home.road, id);
    else await drive(x, 900, id);
  }

  const begin = () => (version ? startSecondVersion() : start()).catch(() => {});
  document.fonts.ready.then(begin);
  replay.addEventListener("click", begin);

  let resize;
  let lastWidth = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastWidth) return;
    lastWidth = innerWidth;
    clearTimeout(resize);
    resize = setTimeout(begin, 250);
  });
})();
