/* voice/load.js: talk to Curiomatic (voice/voice.js). One line in index.html, after every other script:

     <script src="voice/load.js"></script>

   Loads the command reader (commands.js) and the 🎤 box (voice.js) in order. ?voice=0 leaves it off. */
(function () {
  if (window.__curioVoiceLoad || /[?&]voice=0\b/.test(location.search)) return;
  window.__curioVoiceLoad = true;
  const FILES = ["commands.js", "voice.js"];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.replace(/load\.js(\?.*)?$/, "") : "voice/";
  FILES.forEach((f) => {
    const s = document.createElement("script");
    s.src = base + f;
    s.async = false;
    document.body.appendChild(s);
  });
})();
