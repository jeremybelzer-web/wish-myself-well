/* voice/commands.js: how Curiomatic understands a spoken (or typed) command. Pure: no page, no microphone,
   so tests can check it with plain Node (voice/tests/run.js).

   window.CurioVoiceWords = { norm, numbers, clean, split, chain, pattern, score, rank }

   What happens to "Um, could you please go to moment twelve and then play":
     chain()   splits it at "and then" / "then" / "after that" into two commands,
     clean()   drops the polite and filler words ("um", "could you", "please"),
     numbers() turns number words into digits ("twelve" -> 12),
     pattern() spots the fixed shapes (go to moment N, undo N times, set X to N, type ..., pick N, help),
     rank()    scores everything the app can do right now against what is left, best first.

   A thing the app can do is { id, label, words?, group?, boost? }. label is what a person would call it (a
   button's words, a curiosity's name, an action's name); words are extra words that also point at it (its
   plain description, a category). The score asks two questions: how much of the label was said (most of all),
   and how much of what was said is about this thing. So "open the export menu" finds "Export ▾" and "make it
   warmer" does not land on a button that only shares the word "make". */
(function (root) {
  const ONES = { zero: 0, oh: 0, one: 1, won: 1, two: 2, three: 3, four: 4, for: null, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
  const TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, last: -1 };

  /* Lower case, accents off, anything but letters, digits, % and . as one space. */
  function norm(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9%.]+/g, " ")
      .replace(/(^|\s)\.+|\.+(\s|$)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  /* "twenty one" -> 21, "a hundred and five" -> 105, "three point five" -> 3.5. Words that are not numbers stay. */
  function numbers(s) {
    const w = norm(s).split(" ").filter(Boolean);
    const out = [];
    let i = 0;
    const isNum = (x) => (x in ONES && ONES[x] != null) || x in TENS || x === "hundred";
    while (i < w.length) {
      /* "a hundred" */
      if ((w[i] === "a" || w[i] === "one") && w[i + 1] === "hundred") w[i] = "one";
      if (!isNum(w[i]) || (w[i] === "hundred" && !out.length)) {
        out.push(w[i++]);
        continue;
      }
      /* "oh" and "won" only count next to another number word. */
      if ((w[i] === "oh" || w[i] === "won") && !isNum(w[i + 1] || "")) {
        out.push(w[i++]);
        continue;
      }
      let n = 0;
      let cur = 0;
      while (i < w.length && (isNum(w[i]) || (w[i] === "and" && isNum(w[i + 1] || "") && cur >= 100))) {
        const x = w[i++];
        if (x === "and") continue;
        if (x === "hundred") cur = (cur || 1) * 100;
        else if (x in TENS) cur += TENS[x];
        else cur += ONES[x];
      }
      n += cur;
      if (w[i] === "point" && /^\d$|^(zero|one|two|three|four|five|six|seven|eight|nine)$/.test(w[i + 1] || "")) {
        i++;
        let dec = "";
        while (i < w.length && (/^\d$/.test(w[i]) || (w[i] in ONES && ONES[w[i]] != null && ONES[w[i]] < 10))) dec += /^\d$/.test(w[i]) ? w[i++] : String(ONES[w[i++]]);
        out.push(n + "." + dec);
      } else out.push(String(n));
    }
    return out.join(" ").replace(/(\d+) percent\b/g, "$1%");
  }
  /* Polite and filler words people put around a command. Taken off the front (and "please"/"thanks" anywhere). */
  const LEAD = [
    "hey curiomatic", "hey curio", "ok curio", "okay curio", "curiomatic", "curio",
    "um", "uh", "uhh", "umm", "er", "hmm", "so", "okay", "ok", "alright", "all right", "now", "and", "also",
    "can you", "could you", "would you", "will you", "can we", "could we", "i want you to", "i want to", "i would like to", "id like to", "i wanna", "i need to", "i need you to", "lets", "let us", "go ahead and", "just", "please", "kindly",
  ];
  function clean(s) {
    let t = " " + numbers(s) + " ";
    t = t.replace(/ (please|thanks|thank you|for me|right now) /g, " ");
    let again = true;
    while (again) {
      again = false;
      t = t.trim();
      for (const l of LEAD)
        if (t === l || t.startsWith(l + " ")) {
          t = t.slice(l.length);
          again = true;
          break;
        }
    }
    return t.trim();
  }
  /* "go to moment 3 and then play" -> two commands. A plain "and" is left alone ("cut and paste" is one thing). */
  function chain(s) {
    return String(s || "")
      .split(/\s*(?:[.;!?]\s+|,?\s+and then\s+|,?\s+then\s+|,?\s+after that\s+|,?\s+next\s+(?=[a-z]+ ))/i)
      .map((x) => x.trim().replace(/^(?:and )?then\s+/i, ""))
      .filter(Boolean);
  }
  const split = (s) => (s ? s.split(" ").filter(Boolean) : []);

  /* Words that say how, not what: they neither help nor hurt a match. */
  const NEUTRAL = new Set("the a an to of on at my this that these those it its me you your our please go do run use open click press tap hit choose pick select get bring give make let lets want would like into onto for with from by is are be some thing button item option and or as".split(" "));
  /* Same idea, other word: what is said -> what labels often say. */
  const SAME = {
    pause: ["play"], stop: ["pause", "shuttle"], everything: ["all", "every"], every: ["all"], put: ["add"], start: ["play"], begin: ["play"],
    delete: ["remove", "take", "out"], remove: ["delete", "take", "out"], erase: ["delete", "clear"],
    hide: ["off", "close"], close: ["hide", "off", "exit", "leave"], exit: ["leave", "close", "back"],
    enlarge: ["zoom", "bigger"], bigger: ["zoom", "in"], smaller: ["zoom", "out"],
    picture: ["png", "frame", "image"], photo: ["png", "picture"], image: ["png", "picture"],
    spreadsheet: ["csv"], csv: ["spreadsheet"], subtitles: ["captions"], caption: ["captions"], captions: ["caption"],
    back: ["previous", "undo"], forward: ["next"], previous: ["back", "prev"], next: ["forward"],
    film: ["movie"], movie: ["film"], video: ["film", "clip"], fullscreen: ["full", "screen"],
    redo: ["reset"], help: ["shortcuts", "guide", "walkthrough"], search: ["find"], find: ["search"],
    moment: ["frame", "panel", "beat"], frame: ["moment", "panel"], panel: ["moment", "frame"], beat: ["moment"],
  };
  /* Light stemming: "markers" = "marker", "moving" = "move", "zoomed" = "zoom". */
  function stem(w) {
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith("es") && /(sh|ch|x|ss)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  }
  const same = (a, b) => a === b || stem(a) === stem(b) || (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a)));
  function wordsOf(s) {
    return split(norm(s)).filter((w) => !NEUTRAL.has(w));
  }
  /* A thing's label and extra words, made ready once (rank asks about the same things many times). */
  const prepared = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function prep(it) {
    let p = prepared && prepared.get(it);
    if (p && p.label === it.label) return p;
    /* Number words in a label read as digits too, the way what is said is read ("Back one moment"). */
    const ln = numbers(it.label);
    const Ls = wordsOf(ln);
    p = { label: it.label, ln, L: Ls.length ? Ls : split(ln), X: wordsOf(it.words) };
    if (prepared) prepared.set(it, p);
    return p;
  }
  /* How much a word tells things apart: "magnet" (on one button) counts for more than "show" or "on" (on many).
     Worked out over the list being ranked; a word no label has counts as rare. */
  const weighed = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function weights(items) {
    let w = weighed && weighed.get(items);
    if (w) return w;
    const df = new Map();
    (items || []).forEach((it) => new Set(prep(it).L.map(stem)).forEach((x) => df.set(x, (df.get(x) || 0) + 1)));
    const N = Math.max(1, (items || []).length);
    const top = Math.log(1 + N);
    w = (word) => {
      const d = df.get(stem(word)) || 0;
      /* Small words stay light whatever the list. */
      const small = /^(on|off|in|out|up|and|or|as|all|no|not|new|here|there|now|turn|show|hide|set|add)$/.test(word) ? 0.6 : 1;
      return (Math.log(1 + N / (1 + d)) / top) * small + 0.15;
    };
    if (weighed) weighed.set(items, w);
    return w;
  }
  const flat = () => 1;
  /* How well the cleaned command fits one thing. 0: no match. Two questions: how much of the label was said
     (cover), and how much of what was said is about this thing (used), each weighed by how telling the words are. */
  function score(said, label, extra, ready, weigh) {
    const S = Array.isArray(said) ? said : wordsOf(said);
    const n = Array.isArray(said) ? said.whole || S.join(" ") : norm(said);
    const p = ready || prep({ label, words: extra });
    const wt = weigh || flat;
    const L = p.L;
    if (!p.ln || !S.length || !L.length) return 0;
    const X = p.X;
    /* SAME maps a word said to the words a label may use for it. */
    const said1 = (w) => S.some((x) => same(w, x) || (SAME[x] || []).some((y) => same(y, w)));
    const inLabel = (w, list) => list.some((x) => same(w, x) || (SAME[w] || []).some((y) => same(y, x)));
    let got = 0;
    let all = 0;
    let gotN = 0;
    L.forEach((w) => {
      all += wt(w);
      if (said1(w)) (got += wt(w)), gotN++;
    });
    if (!gotN) return 0;
    const cover = got / all;
    /* A one-word label must be said; a longer one needs about half of what it means. */
    if (L.length === 1 ? cover < 1 : cover < 0.45) return 0;
    let su = 0;
    let sall = 0;
    S.forEach((w) => {
      sall += wt(w);
      if (inLabel(w, L)) su += wt(w);
      else if (inLabel(w, X)) su += wt(w) * 0.75;
    });
    const used = sall ? su / sall : 0;
    let s = cover * 8 + used * 12 + Math.min(gotN, 4) * 0.75;
    /* A number said must be the label's number: "3 windows" is not "1 window". */
    const nS = S.filter((w) => /^\d/.test(w));
    const nL = L.filter((w) => /^\d/.test(w));
    if (nS.length && nL.length) s += nS.some((w) => nL.includes(w)) ? 3 : -6;
    /* A label that is only a number ("1×") is not what "1 window" means. */
    if (nL.length === L.length && S.length > nS.length) s -= 6;
    if (n === p.ln) s += 8;
    else if ((" " + n + " ").includes(" " + p.ln + " ")) s += 2;
    else if (S.length >= 2 && (" " + p.ln + " ").includes(" " + n + " ")) s += 3;
    return s;
  }
  /* Everything that matches, best first. Same-label things keep the first given (the caller lists its best
     source first). A thing's boost lifts it only when it matches at all. */
  function rank(said, items, max) {
    const seen = new Set();
    const out = [];
    const S = wordsOf(said);
    const whole = norm(said);
    const wt = weights(items);
    (items || []).forEach((it, i) => {
      const s = score(Object.assign(S.slice(), { whole }), it.label, it.words, prep(it), wt);
      if (!s) return;
      const key = norm(it.label) + "|" + (it.dedupe || "");
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ it, s: s + (Number(it.boost) || 0), i });
    });
    out.sort((a, b) => b.s - a.s || a.i - b.i);
    return out.slice(0, max || 8);
  }
  /* The fixed shapes. Returns { kind, ... } or null. Works on cleaned words. */
  function pattern(t) {
    let m;
    if (/^(what can i say|what can you do|help|voice help|show voice help|list (the )?commands|commands)$/.test(t)) return { kind: "help" };
    if (/^(stop listening|stop the (microphone|mic)|mic off|microphone off|hands free off|turn off hands free|go to sleep|thats all|that is all|goodbye|bye)$/.test(t)) return { kind: "sleep" };
    if (/^(hands free|hands free on|turn on hands free|keep listening|always listen|listen all the time)$/.test(t)) return { kind: "handsfree" };
    if (/^(never mind|nevermind|cancel|forget it|scratch that)$/.test(t)) return { kind: "cancel" };
    if ((m = t.match(/^(?:number |option |choice |the )?(\d{1,2})(?:st|nd|rd|th)?(?: one)?$/))) return { kind: "pick", n: Number(m[1]) };
    if ((m = t.match(/^(?:the )?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last) (?:one|1)$/))) return { kind: "pick", n: ORD[m[1]] };
    if (/^(stop|pause|stop playing|stop the film|pause the film|hold it|freeze)$/.test(t)) return { kind: "stop" };
    if ((m = t.match(/^(undo|redo)(?: that| it| the last (?:change|thing|step))?(?: (\d+) times?| twice| three times)?$/))) return { kind: m[1], n: /twice/.test(t) ? 2 : /three times/.test(t) ? 3 : Number(m[2]) || 1 };
    if ((m = t.match(/^(?:go |jump |skip |move )?(?:back|backward|backwards) (\d+) (?:moments?|frames?|panels?|beats?)$/))) return { kind: "step", by: -Number(m[1]) };
    if ((m = t.match(/^(?:go |jump |skip |move )?(?:forward|ahead|on) (\d+) (?:moments?|frames?|panels?|beats?)$/))) return { kind: "step", by: Number(m[1]) };
    if ((m = t.match(/^(?:go to |jump to |skip to |move to |show |take me to |playhead (?:to|on) )?(?:the )?(?:moment|frame|panel|beat|shot|scene) (?:number )?(\d+|to|too|for)$/))) return { kind: "moment", n: m[1] === "to" || m[1] === "too" ? 2 : m[1] === "for" ? 4 : Number(m[1]) };
    if ((m = t.match(/^(?:go to |jump to |skip to )(?:the )?(first|last|start|beginning|end) (?:moment|frame|panel|beat)?$/)) || (m = t.match(/^(?:go to |jump to |back to )(?:the )?(start|beginning|end)$/))) return { kind: "moment", n: /first|start|beginning/.test(m[1]) ? 1 : -1 };
    if ((m = t.match(/^(?:type|write|enter|fill in) (.+)$/))) return { kind: "type", text: m[1] };
    if ((m = t.match(/^scroll (up|down|left|right)(?: a lot| more)?$/))) return { kind: "scroll", dir: m[1], big: / a lot| more/.test(t) };
    if (/^(escape|close (this|that|it)|close the (window|menu|box|list)|get out|go back)$/.test(t)) return { kind: "escape" };
    if ((m = t.match(/^(?:set|make|put|turn|change) (?:the )?(.+?) (?:to|at|up to|down to|=) (-?\d+(?:\.\d+)?)(%| degrees?| seconds?| meters?)?$/))) return { kind: "set", what: m[1], value: Number(m[2]), unit: (m[3] || "").trim() };
    if ((m = t.match(/^(?:turn on|switch on|enable|show) (.+)$/))) return { kind: "on", what: m[1] };
    if ((m = t.match(/^(?:turn off|switch off|disable|hide) (.+)$/))) return { kind: "off", what: m[1] };
    return null;
  }
  const api = { norm, numbers, clean, chain, split, stem, wordsOf, score, rank, pattern, SAME, NEUTRAL };
  root.CurioVoiceWords = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
