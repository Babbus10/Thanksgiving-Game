/* Thanksgiving Escape — browser UI. Rules live in js/logic.js. */
(function () {
  var L = window.TELogic;
  var SAVE_KEY = "thanksgiving-escape-v1";
  var app = document.getElementById("app");
  var simonToken = 0;
  var state = blankState();

  var PRINTER_SWATCHES = [
    { id: "white", fill: "#f8fafc", label: "WHITE", labeled: true },
    { id: "orange", fill: "#f97316" },
    { id: "blue", fill: "#2563eb" },
    { id: "purple", fill: "#7c3aed" },
    { id: "green", fill: "#16a34a" },
    { id: "red", fill: "#dc2626" },
    { id: "yellow", fill: "#eab308" }
  ];

  var ICONS = [
    { id: "turkey", label: "Turkey" },
    { id: "pumpkin", label: "Pumpkin" },
    { id: "corn", label: "Corn" },
    { id: "pie", label: "Pie" },
    { id: "leaf", label: "Leaf" },
    { id: "cornucopia", label: "Cornucopia" },
    { id: "ball", label: "Ball" },
    { id: "robot", label: "Robot" },
    { id: "book", label: "Book" },
    { id: "beaker", label: "Beaker" }
  ];

  function blankState() {
    return {
      phase: "title",
      year: new Date().getFullYear(),
      kids: [],
      draft: { name: "", gender: null, look: null, error: "" },
      turn: 0,
      room: "lobby",
      passes: [],
      items: [],
      clues: [],
      flags: {},
      puzzle: null,
      puzzleState: null,
      modal: null,
      cluesOpen: false,
      pendingAdvance: false,
      notice: "",
      winStep: 0,
      boss: { endsAt: 0, alert: null }
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (err) { /* private mode */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.phase) return;
      if ((data.phase === "play" || data.phase === "win") && (!data.kids || data.kids.length !== 6)) return;
      state = data;
      if (!state.flags) state.flags = {};
      if (!state.boss) state.boss = { endsAt: 0, alert: null };
      if (!state.draft) state.draft = { name: "", gender: null, look: null, error: "" };
      if (state.flags.cured) state.phase = "win";
      if (state.phase === "play" && state.flags.login && !state.flags.cured && state.puzzle !== "boss") {
        state.puzzle = "boss";
        state.puzzleState = state.puzzleState && state.puzzleState.stage ? state.puzzleState : freshBossState(resumeStage());
      }
    } catch (err) { /* ignore broken saves */ }
  }

  function resumeStage() {
    if (state.flags.bossDoors && state.flags.bossIntercom && state.flags.bossCameras) return "shutdown";
    if (state.flags.bossDoors && state.flags.bossIntercom) return "cameras";
    if (state.flags.bossDoors) return "intercom";
    return "doors";
  }

  function freshBossState(stage) {
    return {
      stage: stage || "doors",
      doors: {},
      pickedDoor: null,
      hint: "",
      banner: "Principal.exe is on. The alarms are fake, and you are safe.",
      ih: "",
      im: "",
      home: "",
      guest: "",
      word: "",
      confirm: ""
    };
  }

  function kid() { return state.kids[state.turn]; }

  function ageLabel(index) { return L.AGE_LABELS[index] || ""; }

  function hasPass(id) { return state.passes.indexOf(id) !== -1; }

  function hasItem(id) { return state.items.indexOf(id) !== -1; }

  function addClue(id, text) {
    for (var i = 0; i < state.clues.length; i++) if (state.clues[i].id === id) return;
    state.clues.push({ id: id, text: text });
  }

  function money(cents) { return "$" + (cents / 100).toFixed(2); }

  function clockSvg(hours, minutes, numbered, size) {
    var cx = 50;
    var cy = 50;
    function pt(angleDeg, len) {
      var rad = angleDeg * Math.PI / 180;
      return [cx + len * Math.sin(rad), cy - len * Math.cos(rad)];
    }
    var ticks = "";
    for (var i = 0; i < 12; i++) {
      var outer = pt(i * 30, 40);
      var inner = pt(i * 30, i % 3 === 0 ? 32 : 36);
      ticks += '<line x1="' + inner[0].toFixed(1) + '" y1="' + inner[1].toFixed(1) + '" x2="' + outer[0].toFixed(1) + '" y2="' + outer[1].toFixed(1) + '" stroke="#24160f" stroke-width="' + (i % 3 === 0 ? 3 : 2) + '"/>';
      if (numbered) {
        var tp = pt(i * 30, 24);
        ticks += '<text x="' + tp[0].toFixed(1) + '" y="' + (tp[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#24160f">' + (i === 0 ? 12 : i) + "</text>";
      }
    }
    var hp = pt((hours % 12) * 30 + minutes * 0.5, 18);
    var mp = pt(minutes * 6, 30);
    return '<svg viewBox="0 0 100 100" width="' + (size || 150) + '" height="' + (size || 150) + '" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#24160f" stroke-width="4"/>' + ticks +
      '<line x1="50" y1="50" x2="' + hp[0].toFixed(1) + '" y2="' + hp[1].toFixed(1) + '" stroke="#24160f" stroke-width="5" stroke-linecap="round"/>' +
      '<line x1="50" y1="50" x2="' + mp[0].toFixed(1) + '" y2="' + mp[1].toFixed(1) + '" stroke="#c44912" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="50" cy="50" r="3.2" fill="#c44912"/></svg>';
  }

  function avatarSvg(lookId, height) {
    var look = L.lookById(lookId) || L.LOOKS[0];
    var h = height || 86;
    var w = Math.round(h * 80 / 120);
    var color = look.swatch;
    var head = '<circle cx="40" cy="36" r="16" fill="#f3c7a1" stroke="#24160f" stroke-width="3"/>' +
      '<circle cx="34" cy="36" r="2" fill="#24160f"/><circle cx="46" cy="36" r="2" fill="#24160f"/>' +
      '<path d="M34 43 Q40 48 46 43" fill="none" stroke="#24160f" stroke-width="2.4" stroke-linecap="round"/>';
    var body = look.gender === "girl"
      ? '<path d="M22 40 Q16 72 24 78 Q40 68 56 78 Q64 72 58 40 Q54 16 40 14 Q26 16 22 40Z" fill="#4a3428" stroke="#24160f" stroke-width="3"/>' +
        head + '<path d="M54 18 Q68 16 66 30 Q56 26 54 18Z" fill="' + color + '" stroke="#24160f" stroke-width="3"/>' +
        '<path d="M18 58 H62 L72 108 H8 Z" fill="' + color + '" stroke="#24160f" stroke-width="3"/>' +
        '<rect x="22" y="104" width="14" height="8" rx="3" fill="#24160f"/><rect x="44" y="104" width="14" height="8" rx="3" fill="#24160f"/>'
      : '<rect x="22" y="78" width="14" height="28" rx="5" fill="#334155" stroke="#24160f" stroke-width="3"/>' +
        '<rect x="44" y="78" width="14" height="28" rx="5" fill="#334155" stroke="#24160f" stroke-width="3"/>' +
        '<rect x="18" y="104" width="18" height="8" rx="3" fill="#24160f"/><rect x="44" y="104" width="18" height="8" rx="3" fill="#24160f"/>' +
        '<rect x="22" y="54" width="36" height="32" rx="8" fill="' + color + '" stroke="#24160f" stroke-width="3"/>' +
        '<rect x="6" y="58" width="16" height="12" rx="5" fill="' + color + '" stroke="#24160f" stroke-width="3"/>' +
        '<rect x="58" y="58" width="16" height="12" rx="5" fill="' + color + '" stroke="#24160f" stroke-width="3"/>' +
        head + '<path d="M24 34 Q25 14 40 14 Q55 14 56 34 Q47 24 40 24 Q33 24 24 34Z" fill="#4a3428" stroke="#24160f" stroke-width="3"/>';
    return '<svg viewBox="0 0 80 120" width="' + w + '" height="' + h + '" aria-hidden="true">' + body + "</svg>";
  }

  function jmaSvg(height) {
    var h = height || 120;
    return '<svg viewBox="0 0 80 120" width="' + Math.round(h * 80 / 120) + '" height="' + h + '" aria-hidden="true">' +
      '<path d="M22 50 Q16 78 24 86 Q40 76 56 86 Q64 78 58 50 Q54 20 40 18 Q26 20 22 50Z" fill="#d9dde3" stroke="#24160f" stroke-width="3"/>' +
      '<circle cx="40" cy="38" r="16" fill="#f3c7a1" stroke="#24160f" stroke-width="3"/>' +
      '<circle cx="40" cy="16" r="8" fill="#c5cad1" stroke="#24160f" stroke-width="3"/>' +
      '<circle cx="34" cy="38" r="2" fill="#24160f"/><circle cx="46" cy="38" r="2" fill="#24160f"/>' +
      '<path d="M30 36 H38 M42 36 H50" stroke="#24160f" stroke-width="2"/>' +
      '<path d="M33 46 Q40 51 47 46" fill="none" stroke="#24160f" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M16 60 H64 L70 112 H10 Z" fill="#b43346" stroke="#24160f" stroke-width="3"/>' +
      '<rect x="24" y="108" width="14" height="8" rx="3" fill="#24160f"/><rect x="44" y="108" width="14" height="8" rx="3" fill="#24160f"/>' +
      "</svg>";
  }

  function principalFace(cured) {
    var mouth = cured
      ? '<path d="M78 118 Q110 142 142 118" fill="none" stroke="#24160f" stroke-width="6" stroke-linecap="round"/>'
      : '<path d="M78 128 L96 112 L114 128 L132 112 L146 128" fill="none" stroke="#24160f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
    var shell = cured ? "#d8f3dc" : "#d7ecf5";
    return '<svg class="face" viewBox="0 0 220 180" aria-hidden="true">' +
      '<rect x="24" y="20" width="172" height="130" rx="16" fill="' + shell + '" stroke="#24160f" stroke-width="6"/>' +
      '<rect x="40" y="36" width="140" height="86" rx="8" fill="' + (cured ? "#14352c" : "#102033") + '"/>' +
      '<circle cx="82" cy="78" r="10" fill="#f8fafc"/><circle cx="138" cy="78" r="10" fill="#f8fafc"/>' +
      '<circle cx="85" cy="78" r="4" fill="#24160f"/><circle cx="141" cy="78" r="4" fill="#24160f"/>' +
      mouth +
      '<rect x="96" y="150" width="28" height="16" fill="#8b5a2b" stroke="#24160f" stroke-width="4"/>' +
      '<line x1="110" y1="20" x2="110" y2="6" stroke="#24160f" stroke-width="4"/>' +
      '<circle cx="110" cy="6" r="6" fill="#f0b429" stroke="#24160f" stroke-width="3"/>' +
      "</svg>";
  }

  function miniIcon(kind) {
    var common = 'viewBox="0 0 64 64" width="42" height="42" aria-hidden="true"';
    if (kind === "plate") {
      return '<svg ' + common + '><ellipse cx="30" cy="34" rx="16" ry="12" fill="#fff" stroke="#24160f" stroke-width="3"/><path d="M50 18 v28 M56 18 v28 M52 46 h6" fill="none" stroke="#24160f" stroke-width="3" stroke-linecap="round"/></svg>';
    }
    if (kind === "whistle") {
      return '<svg ' + common + '><circle cx="26" cy="34" r="14" fill="#f8fafc" stroke="#24160f" stroke-width="3"/><rect x="36" y="28" width="18" height="10" rx="2" fill="#f8fafc" stroke="#24160f" stroke-width="3"/><circle cx="22" cy="34" r="3" fill="#24160f"/></svg>';
    }
    if (kind === "computer") {
      return '<svg ' + common + '><rect x="10" y="12" width="44" height="32" rx="4" fill="#d7ecf5" stroke="#24160f" stroke-width="3"/><path d="M16 28 C22 18 28 38 34 24 C40 14 46 36 50 26" fill="none" stroke="#7c3aed" stroke-width="3"/><rect x="24" y="46" width="16" height="6" fill="#24160f"/></svg>';
    }
    if (kind === "door") {
      return '<svg ' + common + '><rect x="16" y="8" width="32" height="48" rx="3" fill="#8b5a2b" stroke="#24160f" stroke-width="3"/><circle cx="40" cy="32" r="3" fill="#f0b429"/></svg>';
    }
    if (kind === "printer") {
      return '<svg ' + common + '><rect x="14" y="24" width="36" height="22" rx="4" fill="#e8eef2" stroke="#24160f" stroke-width="3"/><rect x="20" y="10" width="24" height="14" fill="#fff" stroke="#24160f" stroke-width="3"/><rect x="20" y="38" width="24" height="12" fill="#fff" stroke="#24160f" stroke-width="3"/></svg>';
    }
    return '<svg ' + common + '><circle cx="32" cy="32" r="16" fill="#f0b429" stroke="#24160f" stroke-width="3"/></svg>';
  }

  function holidayIcon(id) {
    var art = {
      turkey: '<ellipse cx="32" cy="40" rx="14" ry="10" fill="#8b5a2b"/><circle cx="46" cy="34" r="7" fill="#f3c7a1"/><path d="M18 36 Q10 18 24 22" fill="none" stroke="#b43346" stroke-width="4"/>',
      pumpkin: '<circle cx="32" cy="36" r="16" fill="#ef6c2a"/><rect x="29" y="14" width="6" height="8" fill="#2f6b4f"/>',
      corn: '<path d="M32 14 C40 14 44 48 32 52 C20 48 24 14 32 14Z" fill="#f0b429"/><path d="M24 20 H40 M22 30 H42 M24 40 H40" stroke="#c44912" stroke-width="2"/>',
      pie: '<path d="M12 36 H52 L44 50 H20 Z" fill="#8b5a2b"/><path d="M16 36 Q32 18 48 36" fill="#f0b429"/>',
      leaf: '<path d="M32 50 Q10 30 20 14 Q40 20 32 50 Q54 20 44 14 Q32 28 32 50Z" fill="#c44912"/>',
      cornucopia: '<path d="M14 40 Q20 18 40 22 Q58 26 48 48 Q30 58 16 46" fill="#8b5a2b"/><circle cx="42" cy="24" r="5" fill="#ef6c2a"/><circle cx="50" cy="32" r="4" fill="#16a34a"/>',
      ball: '<circle cx="32" cy="32" r="16" fill="#f8fafc"/><path d="M16 32 H48 M32 16 C24 24 24 40 32 48 M32 16 C40 24 40 40 32 48" fill="none" stroke="#24160f" stroke-width="2"/>',
      robot: '<rect x="16" y="18" width="32" height="26" rx="4" fill="#d7ecf5"/><circle cx="26" cy="30" r="3"/><circle cx="38" cy="30" r="3"/><rect x="24" y="46" width="6" height="8"/><rect x="34" y="46" width="6" height="8"/>',
      book: '<path d="M12 16 H32 V50 H12 Z M32 16 H52 V50 H32 Z" fill="#24527a"/>',
      beaker: '<path d="M24 12 H40 L36 28 L50 50 H14 L28 28 Z" fill="#d7ecf5"/>'
    };
    return '<svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">' + (art[id] || art.leaf) + "</svg>";
  }

  function scenery(room) {
    var wall = "#f4e7d4";
    var floor = "#d7c09a";
    var sky = "#f6d7a7";
    var extra = "";
    if (room === "lobby") {
      var screen = hasPass("hallway") ? "OPEN" : "PASS NEEDED";
      extra = '<rect x="70" y="250" width="460" height="28" fill="#8b5a2b"/><rect x="90" y="278" width="420" height="150" rx="8" fill="#a56b3c" stroke="#24160f" stroke-width="6"/>' +
        '<rect x="130" y="210" width="150" height="70" rx="8" fill="#e8eef2" stroke="#24160f" stroke-width="6"/><rect x="150" y="248" width="110" height="18" fill="#fff" stroke="#24160f" stroke-width="4"/>' +
        '<rect x="760" y="150" width="280" height="300" rx="8" fill="#6b4423" stroke="#24160f" stroke-width="6"/><rect x="800" y="190" width="200" height="54" rx="6" fill="#10261c"/>' +
        '<text x="900" y="226" text-anchor="middle" fill="#9dffb0" font-size="26" font-family="Courier New, monospace" font-weight="700">' + screen + "</text>";
    } else if (room === "hallway") {
      extra = '<rect x="40" y="120" width="90" height="300" fill="#c44912"/><rect x="150" y="120" width="90" height="300" fill="#24527a"/><rect x="260" y="120" width="90" height="300" fill="#2f6b4f"/>' +
        '<rect x="1040" y="120" width="90" height="300" fill="#7c3aed"/><rect x="930" y="120" width="90" height="300" fill="#b43346"/>';
    } else if (room === "art") {
      extra = '<circle cx="180" cy="180" r="50" fill="#f97316"/><circle cx="300" cy="150" r="36" fill="#7c3aed"/><circle cx="420" cy="190" r="44" fill="#16a34a"/>' +
        '<rect x="80" y="300" width="70" height="120" fill="#f8fafc" stroke="#24160f" stroke-width="5"/><rect x="170" y="320" width="70" height="100" fill="#fff4cc" stroke="#24160f" stroke-width="5"/>';
    } else if (room === "math") {
      extra = '<rect x="80" y="80" width="520" height="250" rx="8" fill="#1c3a34" stroke="#24160f" stroke-width="6"/>' +
        '<circle cx="860" cy="170" r="70" fill="#fff" stroke="#24160f" stroke-width="6"/>';
    } else if (room === "cafeteria") {
      extra = '<rect x="80" y="300" width="1040" height="24" fill="#8b5a2b"/><rect x="120" y="324" width="20" height="80" fill="#6b4423"/><rect x="420" y="324" width="20" height="80" fill="#6b4423"/><rect x="760" y="324" width="20" height="80" fill="#6b4423"/>' +
        '<rect x="860" y="120" width="220" height="160" rx="8" fill="#24527a"/>';
    } else if (room === "gym") {
      extra = '<rect x="0" y="360" width="1200" height="280" fill="#e7c27a"/><rect x="80" y="70" width="360" height="140" rx="8" fill="#163652" stroke="#24160f" stroke-width="6"/>' +
        '<rect x="900" y="80" width="16" height="220" fill="#24160f"/><circle cx="908" cy="300" r="54" fill="none" stroke="#ef6c2a" stroke-width="8"/>';
    } else if (room === "office") {
      extra = '<rect x="360" y="220" width="480" height="36" fill="#8b5a2b"/><rect x="400" y="256" width="24" height="90" fill="#6b4423"/><rect x="760" y="256" width="24" height="90" fill="#6b4423"/>' +
        '<rect x="500" y="90" width="220" height="140" rx="10" fill="#d7ecf5" stroke="#24160f" stroke-width="6"/><path d="M520 150 C560 110 600 190 680 130" fill="none" stroke="#7c3aed" stroke-width="6"/>';
    }
    return '<svg class="scenery" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="1200" height="640" fill="' + wall + '"/>' +
      '<rect x="0" y="40" width="1200" height="26" fill="#24527a"/>' +
      '<rect x="70" y="70" width="180" height="110" rx="8" fill="' + sky + '" stroke="#24160f" stroke-width="6"/>' +
      '<rect x="950" y="70" width="180" height="110" rx="8" fill="' + sky + '" stroke="#24160f" stroke-width="6"/>' +
      '<rect y="430" width="1200" height="210" fill="' + floor + '"/>' + extra +
      '<circle cx="640" cy="120" r="18" fill="#c44912"/><circle cx="680" cy="100" r="14" fill="#ef6c2a"/><circle cx="600" cy="98" r="12" fill="#f0b429"/>' +
      "</svg>";
  }

  function passMeta(id) {
    return {
      hallway: { name: "Hallway pass", ink: "#f8fafc", inkName: "White", icon: "door", blurb: "Opens the hallway." },
      cafeteria: { name: "Cafeteria pass", ink: "#f97316", inkName: "Orange", icon: "plate", blurb: "Plate and utensils. Code " + L.cafeteriaCode() + "." },
      gym: { name: "Gym pass", ink: "#16a34a", inkName: "Green", icon: "whistle", blurb: "Whistle. Code " + L.gymCode() + "." },
      office: { name: "Office pass", ink: "#7c3aed", inkName: "Purple", icon: "computer", blurb: "Twisted computer. Code " + L.officeCode() + "." }
    }[id];
  }

  function passCard(id, expired) {
    var meta = passMeta(id) || passMeta("office");
    return '<article class="pass-card' + (expired ? " expired" : "") + '"><div class="ink" style="background:' + meta.ink + '">' + miniIcon(meta.icon) + "</div><div><p><strong>" +
      (expired ? "Expired office pass" : meta.name) + "</strong></p><p>" + (expired ? '<span class="stamp">EXPIRED</span> Purple ink. Print a new one.' : meta.blurb) + "</p></div></article>";
  }

  function cluePanel() {
    var passes = state.passes.map(function (id) { return passCard(id); }).join("") || "<p>No passes yet.</p>";
    var holding = "";
    if (hasItem("crayon")) holding += "<p><strong>Holding:</strong> red crayon</p>";
    if (hasItem("brush")) holding += "<p><strong>Holding:</strong> yellow paintbrush</p>";
    if (state.flags.seat && !hasPass("office")) holding += passCard("office", true);
    var clues = state.clues.map(function (clue) {
      return "<li>" + escapeHtml(clue.text) + "</li>";
    }).join("") || "<li>Clues you earn will line up here.</li>";
    return '<div class="clue-scroll"><h2>Passes and clues</h2>' + passes + holding + "<ul>" + clues + "</ul>" +
      (state.phase === "play" ? '<button type="button" class="btn btn-danger btn-small" data-act="ask-reset">Start over</button>' : "") + "</div>";
  }

  function modalHtml() {
    if (!state.modal) return "";
    var buttons = state.modal.buttons || [{ act: "close-modal", label: "OK" }];
    return '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><h2>' + escapeHtml(state.modal.title) + "</h2><div>" +
      state.modal.html + '</div><div class="row">' + buttons.map(function (b) {
        return '<button type="button" class="btn btn-primary" data-act="' + b.act + '">' + b.label + "</button>";
      }).join("") + "</div></div></div>";
  }

  function render() {
    simonToken += 1;
    stopBossTimers();
    var html = "";
    if (state.phase === "title") html = renderTitle();
    else if (state.phase === "select") html = renderSelect();
    else if (state.phase === "story") html = renderStory();
    else if (state.phase === "win") html = renderWin();
    else html = renderPlay();
    if (state.puzzle) html += renderPuzzle();
    html += '<div id="clue-scrim" class="clue-scrim" data-act="toggle-clues"' + (state.cluesOpen ? "" : " hidden") + "></div>";
    html += '<aside id="clue-panel" class="clue-panel' + (state.cluesOpen ? " open" : "") + '"' + (state.cluesOpen ? "" : " inert") + ">" +
      '<div class="row"><button type="button" class="btn btn-small" data-act="toggle-clues">Close clues</button></div>' + cluePanel() + "</aside>";
    html += modalHtml();
    app.innerHTML = html;
    afterRender();
  }

  function renderTitle() {
    return '<section class="screen"><p class="kicker">Maple Street School</p><h1>Thanksgiving Escape</h1>' +
      '<p class="lede">JMa dropped six kids at an empty school. Principal.exe locked the doors. Dinner is waiting at home.</p>' +
      "<ul class=\"help-list\"><li>Pick looks from youngest to oldest.</li><li>Gold outlines are things to investigate. The kid on the banner walks over.</li><li>Some outlines are just silly. Real puzzles still fill the screen.</li><li>A wrong answer gets a hint. Try again.</li></ul>" +
      '<div class="row"><button type="button" class="btn btn-primary" data-act="start">Start</button><button type="button" class="btn" data-act="fullscreen">Full screen</button></div></section>';
  }

  function renderSelect() {
    var index = state.kids.length;
    var draft = state.draft || { name: "", gender: null, look: null, error: "" };
    var taken = {};
    state.kids.forEach(function (k) { taken[k.look] = k.name; });
    var looks = L.LOOKS.filter(function (look) { return look.gender === draft.gender; }).map(function (look) {
      var used = taken[look.id];
      return '<button type="button" class="choice' + (draft.look === look.id ? " picked" : "") + '" data-act="select-look" data-look="' + look.id + '"' + (used ? " disabled" : "") + ">" +
        avatarSvg(look.id, 96) + "<span>" + look.color + (used ? " · " + escapeHtml(used) : "") + "</span></button>";
    }).join("");
    var lineup = state.kids.map(function (k, i) {
      return '<div class="avatar-card"><div>' + avatarSvg(k.look, 78) + '</div><div class="avatar-name">' + escapeHtml(k.name) + '</div><div class="age-tag">' + ageLabel(i) + "</div></div>";
    }).join("");
    return '<section class="screen"><p class="kicker">Avatar select · ' + (index + 1) + " of 6</p><h1>" + ageLabel(index) + "</h1>" +
      '<p class="lede">Three boy colors and three girl colors. Each look is used once.</p><div class="lineup">' + lineup + "</div>" +
      '<div class="select-layout"><input id="kid-name" class="name-input" maxlength="14" placeholder="Name" value="' + escapeHtml(draft.name || "") + '" autocomplete="off">' +
      '<div class="choice-grid"><button type="button" class="choice' + (draft.gender === "boy" ? " picked" : "") + '" data-act="select-gender" data-gender="boy">Boy</button>' +
      '<button type="button" class="choice' + (draft.gender === "girl" ? " picked" : "") + '" data-act="select-gender" data-gender="girl">Girl</button></div>' +
      (draft.gender ? '<div class="choice-grid">' + looks + "</div>" : "") +
      '<p class="error">' + escapeHtml(draft.error || "") + "</p>" +
      '<div class="row"><button type="button" class="btn" data-act="select-back">Back</button><button type="button" class="btn btn-primary" data-act="select-confirm">This is ' + ageLabel(index).toLowerCase() + "</button></div></div></section>";
  }

  function renderStory() {
    var lineup = state.kids.map(function (k, i) {
      return '<div class="avatar-card"><div>' + avatarSvg(k.look, 90) + '</div><div class="avatar-name">' + escapeHtml(k.name) + '</div><div class="age-tag">' + ageLabel(i) + "</div></div>";
    }).join("");
    return '<section class="screen"><p class="kicker">The notice was a trick</p><h1>The school is empty</h1>' +
      '<p class="lede">JMa read a message from Principal.exe and dropped you off. The halls are quiet. The doors locked behind you. Thanksgiving dinner is at home, if you can show JMa there is no school today.</p>' +
      '<div class="lineup">' + lineup + '</div><button type="button" class="btn btn-primary" data-act="begin-play">Enter the lobby</button></section>';
  }

  function hud() {
    var who = kid();
    return '<header class="hud"><div class="brand">Thanksgiving Escape<small>' + escapeHtml(roomName(state.room)) + "</small></div>" +
      '<div class="turn-chip">' + avatarSvg(who.look, 48) + "<div><strong>" + escapeHtml(who.name) + "</strong><span>" + ageLabel(state.turn) + " investigates</span></div></div>" +
      '<div class="hud-actions"><button type="button" class="btn btn-primary" data-act="pass-turn">Next kid</button>' +
      '<button type="button" class="btn btn-ghost" data-act="toggle-clues">Clues</button>' +
      '<button type="button" class="btn btn-ghost" data-act="help">Help</button>' +
      '<button type="button" class="btn btn-ghost" data-act="fullscreen">Full screen</button></div></header>';
  }

  function roomName(room) {
    return { lobby: "Lobby", hallway: "Hallway", art: "Art room", math: "Math room", cafeteria: "Cafeteria", gym: "Gym", office: "Principal's office" }[room] || room;
  }

  function renderPlay() {
    return '<div class="shell">' + hud() + '<div class="stage"><div class="room"><div class="room-art photo" style="background-image:url(\'assets/rooms/' + state.room + '.jpg\')">' +
      '<div class="room-caption"><h1>' + escapeHtml(roomName(state.room)) + "</h1><p>" + escapeHtml(roomBlurb()) + "</p></div>" +
      hotspots().map(spotButton).join("") + kidTokens() + "</div></div></div></div>";
  }

  function roomBlurb() {
    if (state.notice) return state.notice;
    var blurbs = {
      lobby: "The front desk is quiet. The hallway screen is on.",
      hallway: "Art is for the younger three. Math is open to everyone.",
      art: "A Thanksgiving picture, a paint palette, and a supply computer.",
      math: "Clocks with no numbers, a chalkboard, and a food graph.",
      cafeteria: "The menu, the register, the trays, and a vending machine.",
      gym: "A dark scoreboard, one hoop, and the principal's bleacher seat.",
      office: "The only thing still awake is the principal's computer."
    };
    return blurbs[state.room] || "";
  }

  function spotButton(spot) {
    var foot = spot.y + spot.h;
    var kind = spot.act === "decoy" ? " decoy" : " real";
    return '<button type="button" class="spot' + kind + (spot.glow ? " glow" : "") + '" style="left:' + spot.x + "%;top:" + spot.y + "%;width:" + spot.w + "%;height:" + spot.h + '%" data-x="' +
      (spot.x + spot.w / 2).toFixed(1) + '" data-y="' + Math.min(foot, 94).toFixed(1) + '" data-act="' + spot.act + '" ' + (spot.attrs || "") + "><span>" + spot.title + "</span></button>";
  }

  function homeFeet(n, count) {
    var span = Math.min(62, Math.max(18, (count - 1) * 11));
    var start = 50 - span / 2;
    var x = count <= 1 ? 50 : start + span * n / (count - 1);
    return { x: x, y: 90 };
  }

  function kidTokens() {
    var present = [];
    state.kids.forEach(function (k, i) {
      if (state.room !== "art" || i < 3) present.push(i);
    });
    return present.map(function (i, n) {
      var k = state.kids[i];
      var saved = state.feet && state.feet[state.room] && state.feet[state.room][i];
      var pos = saved || homeFeet(n, present.length);
      return '<div class="kid-token' + (i === state.turn ? " turn" : "") + '" data-kid="' + i + '" style="left:' + pos.x + "%;top:" + pos.y + '%">' +
        avatarSvg(k.look, 86) + '<div class="avatar-name">' + escapeHtml(k.name) + "</div></div>";
    }).join("");
  }

  function cafeteriaKnown() {
    return !!(state.flags.orange || state.flags.word || state.flags.graph || state.flags.clocks);
  }

  function printerAttention() {
    if (!hasPass("hallway")) return true;
    if (state.flags.orange && state.flags.readClock && state.flags.word && state.flags.graph && !hasPass("cafeteria")) return true;
    if (state.flags.trays && state.flags.menu && state.flags.register && state.flags.vending && !hasPass("gym")) return true;
    if (state.flags.seat && state.flags.hoop && state.flags.score && !hasPass("office")) return true;
    return false;
  }

  function joke(text) {
    return 'data-joke="' + escapeHtml(text) + '"';
  }

  function hotspots() {
    if (state.room === "lobby") {
      return [
        { act: "open-puzzle", attrs: 'data-puzzle="printer"', title: "Printer", x: 10, y: 26, w: 20, h: 16, glow: printerAttention() },
        { act: "try-hallway", title: hasPass("hallway") ? "Hallway" : "PASS NEEDED", x: 72, y: 8, w: 24, h: 52, glow: hasPass("hallway") },
        { act: "decoy", attrs: joke("The plant is thirsty. It does not know any door codes."), title: "Plant", x: 33, y: 20, w: 10, h: 30 },
        { act: "decoy", attrs: joke("Last month's pizza sale. Nothing about Thanksgiving."), title: "Bulletin board", x: 47, y: 12, w: 14, h: 18 },
        { act: "decoy", attrs: joke("Cinnamon leaves. Pretty, and not a password."), title: "Flowers", x: 54, y: 34, w: 9, h: 22 }
      ];
    }
    if (state.room === "hallway") {
      var doors = [
        { act: "try-art", title: "Art room", x: 1, y: 8, w: 15, h: 64, glow: state.turn < 3 && !state.flags.orange },
        { act: "goto", attrs: 'data-room="math"', title: "Math room", x: 16, y: 16, w: 12, h: 50, glow: !state.flags.word || !state.flags.graph || !state.flags.clocks },
        { act: "goto", attrs: 'data-room="lobby"', title: "Lobby", x: 80, y: 3, w: 16, h: 12, glow: printerAttention() },
        { act: "decoy", attrs: joke("Every locker is empty. Somebody already left for dinner."), title: "Lockers", x: 68, y: 28, w: 24, h: 36 },
        { act: "decoy", attrs: joke("Cold water. The fountain does not print passes."), title: "Fountain", x: 74, y: 58, w: 12, h: 16 }
      ];
      if (cafeteriaKnown()) doors.push({ act: "try-door", attrs: 'data-room="cafeteria" data-pass="cafeteria"', title: "Cafeteria", x: 28, y: 22, w: 11, h: 42, glow: hasPass("cafeteria") });
      if (state.flags.trays) doors.push({ act: "try-door", attrs: 'data-room="gym" data-pass="gym"', title: "Gym", x: 38, y: 30, w: 10, h: 32, glow: hasPass("gym") });
      if (state.flags.seat) doors.push({ act: "try-door", attrs: 'data-room="office" data-pass="office"', title: "Office", x: 47, y: 36, w: 10, h: 26, glow: hasPass("office") });
      return doors;
    }
    if (state.room === "art") {
      var spots = [
        { act: "open-puzzle", attrs: 'data-puzzle="sketch"', title: "Sketch", x: 1, y: 8, w: 18, h: 58 },
        { act: "open-puzzle", attrs: 'data-puzzle="simon"', title: "Palette", x: 60, y: 54, w: 22, h: 32 },
        { act: "open-puzzle", attrs: 'data-puzzle="computer"', title: "Art computer", x: 40, y: 36, w: 18, h: 22, glow: hasItem("crayon") && hasItem("brush") && !state.flags.orange },
        { act: "goto", attrs: 'data-room="hallway"', title: "Hallway", x: 80, y: 3, w: 16, h: 12 },
        { act: "decoy", attrs: joke("So many crayons. The missing red one is not in this cubby."), title: "Cubbies", x: 30, y: 42, w: 10, h: 16 },
        { act: "decoy", attrs: joke("The blue chair squeaks a tiny song. It is not a clue."), title: "Chair", x: 46, y: 52, w: 8, h: 16 }
      ];
      if (state.flags.colorNumber && !state.flags.crayon) spots.push({ act: "pickup", attrs: 'data-item="crayon"', title: "Drying rack", x: 22, y: 16, w: 10, h: 40, glow: true });
      if (state.flags.simon && !state.flags.brush) spots.push({ act: "pickup", attrs: 'data-item="brush"', title: "Window sill", x: 74, y: 28, w: 22, h: 16, glow: true });
      return spots;
    }
    if (state.room === "math") {
      return [
        { act: "open-puzzle", attrs: 'data-puzzle="clocks"', title: "Three clocks", x: 22, y: 1, w: 36, h: 12 },
        { act: "examine-clock", title: "Classroom clock", x: 32, y: 40, w: 14, h: 16, glow: state.flags.clocks && !state.flags.readClock },
        { act: "open-puzzle", attrs: 'data-puzzle="word"', title: "Chalkboard", x: 6, y: 16, w: 58, h: 24 },
        { act: "open-puzzle", attrs: 'data-puzzle="graph"', title: "Food graph", x: 70, y: 16, w: 24, h: 30 },
        { act: "goto", attrs: 'data-room="hallway"', title: "Hallway", x: 80, y: 3, w: 16, h: 12 },
        { act: "decoy", attrs: joke("A desk has a doodle of a turkey. The turkey is not the answer."), title: "Desks", x: 8, y: 62, w: 22, h: 18 },
        { act: "decoy", attrs: joke("Math books. Heavy, and not today's clock."), title: "Bookshelf", x: 66, y: 46, w: 12, h: 18 }
      ];
    }
    if (state.room === "cafeteria") {
      return [
        { act: "open-puzzle", attrs: 'data-puzzle="menu"', title: "Menu board", x: 1, y: 1, w: 26, h: 13 },
        { act: "open-puzzle", attrs: 'data-puzzle="register"', title: "Register", x: 16, y: 30, w: 14, h: 16 },
        { act: "open-puzzle", attrs: 'data-puzzle="trays"', title: "Tray stacks", x: 32, y: 26, w: 14, h: 28 },
        { act: "open-puzzle", attrs: 'data-puzzle="vending"', title: "Vending machine", x: 82, y: 14, w: 16, h: 44 },
        { act: "goto", attrs: 'data-room="hallway"', title: "Hallway", x: 58, y: 3, w: 16, h: 12 },
        { act: "decoy", attrs: joke("The potatoes look real. The price on the register does not."), title: "Serving line", x: 2, y: 36, w: 16, h: 18 },
        { act: "decoy", attrs: joke("A napkin is folded into a turkey. It will not open a door."), title: "Lunch tables", x: 52, y: 38, w: 22, h: 16 }
      ];
    }
    if (state.room === "gym") {
      return [
        { act: "open-puzzle", attrs: 'data-puzzle="score"', title: "Scoreboard", x: 3, y: 16, w: 16, h: 18 },
        { act: "open-puzzle", attrs: 'data-puzzle="hoop"', title: "Hoop", x: 74, y: 1, w: 24, h: 34 },
        { act: "open-puzzle", attrs: 'data-puzzle="seat"', title: "Bleachers", x: 26, y: 40, w: 44, h: 24 },
        { act: "goto", attrs: 'data-room="hallway"', title: "Hallway", x: 5, y: 50, w: 14, h: 22 },
        { act: "decoy", attrs: joke("Bright Thanksgiving sky. The scoreboard is still dark."), title: "Windows", x: 36, y: 4, w: 28, h: 12 },
        { act: "decoy", attrs: joke("The center circle is shiny. It does not know the final score."), title: "Court", x: 18, y: 68, w: 22, h: 14 }
      ];
    }
    return [
      { act: "open-puzzle", attrs: 'data-puzzle="login"', title: "Computer", x: 40, y: 20, w: 22, h: 26, glow: true },
      { act: "goto", attrs: 'data-room="hallway"', title: "Hallway", x: 1, y: 62, w: 14, h: 14 },
      { act: "decoy", attrs: joke("The lamp is on. The principal is not in the chair."), title: "Lamp", x: 26, y: 24, w: 10, h: 24 },
      { act: "decoy", attrs: joke("Nice frames. None of them is the login."), title: "Certificates", x: 30, y: 2, w: 32, h: 14 },
      { act: "decoy", attrs: joke("Orange trees outside. The answer is on the computer, not in the yard."), title: "Window", x: 74, y: 6, w: 24, h: 30 }
    ];
  }

  function puzzleShell(title, body, allowLeave, foot) {
    var who = kid();
    return '<section class="puzzle"><div class="puzzle-top"><div class="kid-pill">' + avatarSvg(who.look, 42) + "<span>" + escapeHtml(who.name) + " submits</span></div><h2>" + title + "</h2>" +
      '<div class="puzzle-actions"><button type="button" class="btn" data-act="toggle-clues">Clues</button>' +
      (allowLeave === false ? "" : '<button type="button" class="btn" data-act="leave-puzzle">Leave</button>') + '</div></div><div class="puzzle-body">' + body + "</div>" +
      (foot ? '<div class="puzzle-foot">' + foot + "</div>" : "") + "</section>";
  }

  function hintBox(text) {
    if (!text) return "";
    return '<p class="hint" role="status">' + escapeHtml(text) + "</p>";
  }

  function hourSelect(selected, keep) {
    var html = '<option value="">Hour</option>';
    for (var h = 1; h <= 12; h++) html += '<option value="' + h + '"' + (String(selected) === String(h) ? " selected" : "") + ">" + h + "</option>";
    return '<select class="big-select" data-keep="' + keep + '">' + html + "</select>";
  }

  function minuteSelect(selected, keep) {
    var html = '<option value="">Min</option>';
    for (var m = 0; m < 60; m += 5) html += '<option value="' + m + '"' + (String(selected) === String(m) ? " selected" : "") + ">" + String(m).padStart(2, "0") + "</option>";
    return '<select class="big-select" data-keep="' + keep + '">' + html + "</select>";
  }

  function renderPuzzle() {
    var id = state.puzzle;
    var map = {
      printer: puzzlePrinter,
      sketch: puzzleSketch,
      simon: puzzleSimon,
      computer: puzzleComputer,
      clocks: puzzleClocks,
      word: puzzleWord,
      graph: puzzleGraph,
      menu: puzzleMenu,
      register: puzzleRegister,
      trays: puzzleTrays,
      vending: puzzleVending,
      score: puzzleScore,
      hoop: puzzleHoop,
      seat: puzzleSeat,
      login: puzzleLogin,
      boss: puzzleBoss
    };
    return map[id] ? map[id]() : "";
  }

  function puzzlePrinter() {
    var ps = state.puzzleState;
    if (!hasPass("hallway")) {
      return puzzleShell("Visitor sign-in",
        "<p>Sign the date of Thanksgiving, stamp a holiday picture, and the printer will use <strong>WHITE</strong> ink.</p>" + hintBox(ps.hint) +
        '<div class="signin-split"><div>' + calendarHtml(ps.day) +
        '<div class="swatch-row"><div class="swatch"><i style="background:#f8fafc"></i><span>WHITE</span></div></div></div><div>' +
        iconGrid(ps.icon) + "</div></div>",
        true,
        '<button type="button" class="btn btn-primary" data-act="submit-signin">Print the white pass</button>');
    }
    var ready = "";
    if (state.flags.orange && state.flags.readClock && state.flags.word && state.flags.graph && !hasPass("cafeteria")) {
      ready += "<p>Cafeteria pass: pick its color, then type the clock digits, the chalkboard number, and the sweet-sides number.</p>";
    }
    if (state.flags.trays && state.flags.menu && state.flags.register && state.flags.vending && !hasPass("gym")) {
      ready += "<p>Gym pass: pick its color, then type the three cafeteria scraps in the order you found them.</p>";
    }
    if (state.flags.seat && state.flags.hoop && state.flags.score && !hasPass("office")) {
      ready += "<p>Office pass: pick its color, then type the hoop scrap, the home score, and the guest score.</p>";
    }
    if (!ready) ready = "<p>Colored passes need a color clue and a code. The swatches are blank on purpose. White is the only label.</p>";
    return puzzleShell("Pass printer", ready + hintBox(ps.hint) + '<div class="swatch-row">' + PRINTER_SWATCHES.map(function (sw) {
      var label = sw.labeled ? sw.label : "";
      return '<button type="button" class="swatch' + (ps.color === sw.id ? " picked" : "") + '" data-act="pick-swatch" data-color="' + sw.id + '" aria-label="' + (sw.labeled ? "White" : "Unlabeled ink") + '"><i style="background:' + sw.fill + '"></i><span>' + label + "</span></button>";
    }).join("") + "</div>" +
      '<p><input id="pass-code" class="text-input" inputmode="numeric" data-keep="code" placeholder="Pass code" value="' + escapeHtml(ps.code || "") + '"></p>',
      true,
      '<button type="button" class="btn btn-primary" data-act="submit-color-pass">Print pass</button>');
  }

  function calendarHtml(selected) {
    var year = state.year;
    var first = new Date(year, 10, 1).getDay();
    var cells = "";
    for (var i = 0; i < first; i++) cells += "<span></span>";
    for (var day = 1; day <= 30; day++) {
      var dow = new Date(year, 10, day).getDay();
      cells += '<button type="button" class="cal-day' + (dow === 4 ? " thursday" : "") + (selected === day ? " picked" : "") + '" data-act="pick-day" data-day="' + day + '">' + day + "</button>";
    }
    return '<div class="calendar"><h3>November ' + year + '</h3><p>Thursdays are shaded. Tap the day of Thanksgiving.</p><div class="cal-dow"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="cal-grid">' + cells + "</div></div>";
  }

  function iconGrid(selected) {
    return '<div class="icon-grid">' + ICONS.map(function (icon) {
      return '<button type="button" class="icon-btn' + (selected === icon.id ? " picked" : "") + '" data-act="pick-icon" data-icon="' + icon.id + '" aria-label="' + icon.label + '">' + holidayIcon(icon.id) + "<span>" + icon.label + "</span></button>";
    }).join("") + "</div>";
  }

  function puzzleSketch() {
    var ps = state.puzzleState;
    var region = L.SKETCH_REGIONS[ps.region];
    var crayons = L.CRAYONS.map(function (c) {
      return '<button type="button" class="btn crayon" data-act="crayon" data-id="' + c.id + '"><b>' + c.n + '</b><i class="wax" style="background:' + c.fill + '"></i><span>Crayon ' + c.n + "</span></button>";
    }).join("");
    return puzzleShell("Color by number", '<div class="sketch-layout"><div><p>The crayons are out of order. Color the highlighted shape with the matching number. The next shape waits.</p>' + crayons + "</div><div>" +
      sketchSvg() + '<p class="region-num">#' + (region ? region.n : "") + "</p><p>Shape " + (ps.region + 1) + " of " + L.SKETCH_REGIONS.length + "</p>" + hintBox(ps.hint) + "</div></div>");
  }

  function sketchSvg() {
    var ps = state.puzzleState;
    function fill(i) {
      if (i < ps.region) {
        var n = L.SKETCH_REGIONS[i].n;
        var crayon = L.CRAYONS.filter(function (c) { return c.n === n; })[0];
        return crayon.fill;
      }
      return i === ps.region ? "#fff4cc" : "#e7e0d6";
    }
    function stroke(i) { return i === ps.region ? "#c44912" : "#24160f"; }
    return '<svg viewBox="0 0 360 240" width="100%" height="240" aria-hidden="true">' +
      '<rect x="20" y="150" width="320" height="70" rx="8" fill="' + fill(0) + '" stroke="' + stroke(0) + '" stroke-width="5"/>' +
      '<ellipse cx="70" cy="70" rx="36" ry="22" fill="' + fill(1) + '" stroke="' + stroke(1) + '" stroke-width="5"/>' +
      '<rect x="120" y="40" width="36" height="70" rx="12" fill="' + fill(2) + '" stroke="' + stroke(2) + '" stroke-width="5"/>' +
      '<rect x="180" y="78" width="70" height="36" rx="16" fill="' + fill(3) + '" stroke="' + stroke(3) + '" stroke-width="5"/>' +
      '<circle cx="280" cy="60" r="14" fill="' + fill(4) + '" stroke="' + stroke(4) + '" stroke-width="5"/><circle cx="300" cy="78" r="14" fill="' + fill(4) + '" stroke="' + stroke(4) + '" stroke-width="5"/>' +
      '<circle cx="250" cy="150" r="34" fill="' + fill(5) + '" stroke="' + stroke(5) + '" stroke-width="5"/>' +
      "</svg>";
  }

  function puzzleSimon() {
    var ps = state.puzzleState;
    var buttons = L.SIMON_COLORS.map(function (c) {
      return '<button type="button" class="simon-btn" style="background:' + c.fill + '" data-act="simon" data-simon="' + c.id + '"><span>' + c.id + "</span></button>";
    }).join("");
    return puzzleShell("Palette memory", "<p>Watch the colors, then tap them in the same order. Pattern " + (ps.round + 1) + " of " + L.SIMON_ROUNDS.length + '.</p><p id="simon-status">Watch the colors</p><div class="simon-grid">' + buttons + "</div>" + hintBox(ps.hint) +
      '<button type="button" class="btn" data-act="simon-replay">Show the pattern again</button>');
  }

  function puzzleComputer() {
    var haveCrayon = hasItem("crayon");
    var haveBrush = hasItem("brush");
    return puzzleShell("Art computer", '<div class="terminal"><p class="kicker">ART SUPPLY CHECK</p><p>Red crayon: ' + (haveCrayon ? "in the basket" : "MISSING") + "</p><p>Yellow paintbrush: " + (haveBrush ? "in the basket" : "MISSING") + "</p><p>Return both. The screen will name the cafeteria ink.</p></div>" +
      hintBox(state.puzzleState.hint) +
      '<button type="button" class="btn btn-primary" data-act="return-supplies"' + (haveCrayon && haveBrush ? "" : " disabled") + ">Return red crayon and yellow brush</button>");
  }

  function puzzleClocks() {
    var ps = state.puzzleState;
    var cards = L.CLOCK_ANSWERS.map(function (ans, i) {
      var got = ps.clocks[i] || { h: "", m: "" };
      return '<article class="clock-card"><h3>Clock ' + (i + 1) + "</h3>" + clockSvg(ans.h, ans.m, false, 160) +
        '<div class="pair"><label>Hour ' + hourSelect(got.h, "c" + i + "h") + "</label><label>Minute " + minuteSelect(got.m, "c" + i + "m") + "</label></div></article>";
    }).join("");
    return puzzleShell("Clock angles", "<p>These clocks have no numbers. The short black hand is the hour. The long orange hand is the minutes. Straight up is :00. Straight down is :30.</p><div class=\"clock-row\">" + cards + "</div>" + hintBox(ps.hint) +
      '<div class="row"><button type="button" class="btn btn-primary" data-act="submit-clocks">Set the clocks</button></div>');
  }

  function puzzleWord() {
    var ps = state.puzzleState;
    return puzzleShell("Chalkboard", '<article class="panel" style="background:#1c3a34;color:#f3ffe8"><h3>Canned-food drive</h3><p>6 kids each brought 7 cans. They gave 9 cans to the office. How many cans are left for the cafeteria?</p></article>' +
      '<p><input id="word-answer" class="text-input" inputmode="numeric" data-keep="word" placeholder="One number" value="' + escapeHtml(ps.word || "") + '"></p>' + hintBox(ps.hint) +
      '<button type="button" class="btn btn-primary" data-act="submit-word">Check the board</button>');
  }

  function puzzleGraph() {
    var ps = state.puzzleState;
    var bars = L.GRAPH_BARS.map(function (bar) {
      var height = Math.round((bar.value / 20) * 100);
      return '<div class="bar-col"><div class="bar' + (bar.sweet ? " sweet" : "") + '" style="height:' + height + '%"><b>' + bar.value + '</b></div><span>' + bar.label + "</span></div>";
    }).join("");
    return puzzleShell("Food graph", '<p><strong>How many kids like sweet sides the most?</strong></p><p>Sweet sides are sweet potatoes, cranberry, and pumpkin pie. Add those bars. Orange bars are the sweet sides.</p><div class="graph">' + bars + "</div>" +
      '<p><input id="graph-answer" class="text-input" inputmode="numeric" data-keep="graph" placeholder="Two-digit answer" value="' + escapeHtml(ps.graph || "") + '"></p>' + hintBox(ps.hint) +
      '<button type="button" class="btn btn-primary" data-act="submit-graph">Read the graph</button>');
  }

  function puzzleMenu() {
    var ps = state.puzzleState;
    var steps = [
      "Step 1 of 3. Tap every SOLD OUT food.",
      "Step 2 of 3. Tap every food with dairy, nuts, or gluten.",
      "Step 3 of 3. Tap every main and every drink still showing. The side that remains is the scrap."
    ];
    var cards = L.MENU_ITEMS.map(function (item) {
      var tags = item.tags.map(function (tag) { return '<span class="tag">' + tag + "</span>"; }).join("");
      if (item.soldOut) tags += '<span class="sold">SOLD OUT</span>';
      var crossed = ps.crossed.indexOf(item.id) !== -1;
      var plates = { turkey: "#c44912", pizza: "#f0b429", noodles: "#d97706", sweetpotato: "#ea580c", milk: "#f8fafc", juice: "#fb923c", muffin: "#a16207", mix: "#65a30d" };
      return '<button type="button" class="food-card' + (crossed ? " crossed" : "") + '" data-act="menu-tap" data-food="' + item.id + '"><i class="plate" style="background:' + plates[item.id] + '"></i><div class="num">#' + item.n + " " + item.name + "</div><div>" + item.kind + "</div><div>" + tags + "</div></button>";
    }).join("");
    return puzzleShell("Menu board", "<p>Kids in line cannot eat dairy, nuts, or gluten. One dish is safe, for sale, and a side. Its menu number is a code scrap.</p><p><strong>" + steps[ps.phase - 1] + '</strong></p><div class="menu-grid">' + cards + "</div>" + hintBox(ps.hint) +
      '<button type="button" class="btn btn-primary" data-act="menu-check">Check this step</button>');
  }

  function puzzleRegister() {
    var ps = state.puzzleState;
    var coins = ps.coins;
    var total = L.coinTotal(coins);
    var controls = [
      ["quarter", "Quarter 25¢", 4],
      ["dime", "Dime 10¢", 5],
      ["nickel", "Nickel 5¢", 5],
      ["penny", "Penny 1¢", 10]
    ].map(function (row) {
      return '<div class="coin-ctrl"><button type="button" class="btn" data-act="coin" data-coin="' + row[0] + '" data-dir="-1">−</button><strong>' + coins[row[0]] + " / " + row[2] + "</strong><button type=\"button\" class=\"btn\" data-act=\"coin\" data-coin=\"" + row[0] + '" data-dir="1">+</button><span>' + row[1] + "</span></div>";
    }).join("");
    var prices = L.PRICES.map(function (item) { return "<li>" + item.name + ": " + money(item.cents) + "</li>"; }).join("");
    return puzzleShell("Cash register", '<div class="register-layout"><div class="receipt"><p>Planted total</p><p class="total-due fake">' + money(L.PLANTED_TOTAL) + '</p><p>Sticky-note prices</p><ul class="help-list">' + prices + "</ul><p>They pay with " + money(L.PAYMENT) + '.</p></div><div><p class="total-due">' + money(total) + "</p>" + controls + "</div></div>" + hintBox(ps.hint) +
      '<button type="button" class="btn btn-primary" data-act="submit-change">Give this change</button>');
  }

  function puzzleTrays() {
    var ps = state.puzzleState;
    var shown = L.TRAYS.map(function (tray, index) {
      var plates = "";
      var count = { small: 2, medium: 3, large: 4 }[tray.size];
      for (var i = 0; i < count; i++) plates += '<i class="tray ' + tray.size + '"></i>';
      return '<div class="stack">' + plates + "<strong>" + tray.weight + " lb</strong><span>Stack " + (index + 1) + "</span></div>";
    }).join("");
    function pick(list, current, act, key) {
      return list.map(function (value) {
        var id = key === "size" ? value : String(value);
        var label = key === "size" ? value : value + " lb";
        return '<button type="button" class="btn' + (String(current) === id ? " btn-primary" : "") + '" data-act="' + act + '" data-' + key + '="' + id + '">' + label + "</button>";
      }).join("");
    }
    return puzzleShell("Tray stack", "<p>Finish the pattern of size and weight. The next stack drops a card.</p><div class=\"tray-row\">" + shown + '<div class="stack"><strong>?</strong><span>Stack 6</span></div></div>' +
      "<h3>Next size</h3><div class=\"row\">" + pick(["small", "medium", "large"], ps.size, "pick-size", "size") + "</div>" +
      "<h3>Next weight</h3><div class=\"row\">" + pick([10, 11, 12, 14], ps.weight, "pick-weight", "weight") + "</div>" +
      hintBox(ps.hint) + '<button type="button" class="btn btn-primary" data-act="submit-trays">Set the stack</button>');
  }

  function puzzleVending() {
    var ps = state.puzzleState;
    return puzzleShell("Vending machine", '<div class="vending-face"><p>Keypad: menu scrap, then the change scrap, stuck together.</p><p>A good code drops a wrapper. Wrapper number = menu scrap × 3.</p>' +
      '<p><input id="vending-code" class="text-input" inputmode="numeric" data-keep="code" placeholder="Code" value="' + escapeHtml(ps.code || "") + '"></p></div>' + hintBox(ps.hint) +
      '<button type="button" class="btn btn-primary" data-act="submit-vending">Enter code</button>');
  }

  function puzzleScore() {
    var ps = state.puzzleState;
    function stepper(side, label) {
      return '<article class="panel"><h3>' + label + '</h3><div class="coin-ctrl"><button type="button" class="btn" data-act="score-step" data-side="' + side + '" data-dir="-1">−</button>' +
        '<input class="text-input" style="max-width:6rem" inputmode="numeric" data-keep="' + side + '" value="' + escapeHtml(ps[side] || "") + '">' +
        '<button type="button" class="btn" data-act="score-step" data-side="' + side + '" data-dir="1">+</button></div></article>';
    }
    return puzzleShell("Scoreboard", '<div class="led-board"><p>HOME and GUESTS</p><div class="score-row">' + stepper("home", "Home") + stepper("guest", "Guests") + "</div></div><ol class=\"help-list\"><li>Both scores are two-digit numbers.</li><li>Home minus guest is 6.</li><li>Home is divisible by 9.</li><li>Guest is divisible by 7.</li><li>Neither score contains a 0 or a 5.</li></ol>" +
      hintBox(ps.hint) + '<button type="button" class="btn btn-primary" data-act="submit-score">Lock the score</button>');
  }

  function puzzleHoop() {
    var arcs = [
      { angle: 25, note: "Hits the front of the rim" },
      { angle: 50, note: "Falls through the net" },
      { angle: 70, note: "Bounces off the backboard" }
    ];
    var cards = arcs.map(function (arc) {
      return '<button type="button" class="arc-card" data-act="pick-arc" data-angle="' + arc.angle + '"><strong>' + arc.angle + "°</strong><p>" + arc.note + "</p>" + hoopDrawing(arc.angle) + "</button>";
    }).join("");
    return puzzleShell("Basketball hoop", '<p class="formula">A make is steeper than 40° and lower than 60°, and it misses the backboard.</p><div class="choice-grid">' + cards + "</div>" + hintBox(state.puzzleState.hint));
  }

  function hoopDrawing(angle) {
    var rad = angle * Math.PI / 180;
    var x = 20 + Math.cos(rad) * 70;
    var y = 90 - Math.sin(rad) * 70;
    return '<svg viewBox="0 0 120 100" width="120" height="100" aria-hidden="true"><rect x="78" y="20" width="8" height="40" fill="#24527a"/><line x1="70" y1="48" x2="86" y2="48" stroke="#ef6c2a" stroke-width="3"/><path d="M16 88 Q ' + x.toFixed(0) + " " + y.toFixed(0) + ' 78 48" fill="none" stroke="#24160f" stroke-width="3"/></svg>';
  }

  function puzzleSeat() {
    var seats = "";
    for (var n = 1; n <= 30; n++) seats += '<button type="button" class="seat" data-act="pick-seat" data-seat="' + n + '">' + n + "</button>";
    return puzzleShell("Principal's bleacher seat", '<p class="formula">SEAT = (HOME − GUEST) + 10</p><p>Tap the principal\'s seat. The score on the scoreboard is the key.</p><div class="seat-grid">' + seats + "</div>" + hintBox(state.puzzleState.hint));
  }

  function puzzleLogin() {
    var ps = state.puzzleState;
    var known = [{ id: "white", name: "White", fill: "#f8fafc" }];
    if (state.flags.orange) known.push({ id: "orange", name: "Orange", fill: "#f97316" });
    if (state.flags.trays) known.push({ id: "green", name: "Green", fill: "#16a34a" });
    if (state.flags.seat) known.push({ id: "purple", name: "Purple", fill: "#7c3aed" });
    var slots = "";
    for (var i = 0; i < 4; i++) {
      var id = ps.colors[i];
      var knownColor = known.filter(function (c) { return c.id === id; })[0];
      slots += '<div class="slot">' + (knownColor ? '<i class="wax" style="background:' + knownColor.fill + '"></i>' : i + 1) + "</div>";
    }
    var lines = [
      ["drop", "Please drop the children at the school on Thanksgiving."],
      ["classes", "School is open for a full day of classes."],
      ["lock", "The front door will lock after they come in."],
      ["cameras", "I will watch them on the school cameras."]
    ].map(function (line) {
      return '<button type="button" class="email-line' + (ps.lie === line[0] ? " picked" : "") + '" data-act="login-lie" data-lie="' + line[0] + '">' + line[1] + "</button>";
    }).join("");
    return puzzleShell("Principal.exe login", hintBox(ps.hint) + '<div class="login-grid"><div><p>Pass colors in the order you printed them.</p><div class="slots">' + slots + '</div><div class="swatch-row">' +
      known.map(function (c) {
        return '<button type="button" class="swatch" data-act="login-color" data-color="' + c.id + '"><i style="background:' + c.fill + '"></i><span>' + c.name + "</span></button>";
      }).join("") + '</div><button type="button" class="btn btn-small" data-act="login-undo">Undo color</button>' +
      '<p>Cafeteria code</p><input class="text-input" data-keep="cafe" value="' + escapeHtml(ps.cafe || "") + '">' +
      '<p>Gym code</p><input class="text-input" data-keep="gym" value="' + escapeHtml(ps.gym || "") + '">' +
      '<p>Office code</p><input class="text-input" data-keep="office" value="' + escapeHtml(ps.office || "") + '">' +
      '<p>Gym score, home then guest</p><div class="pair"><input class="text-input" data-keep="home" value="' + escapeHtml(ps.home || "") + '" placeholder="Home"><input class="text-input" data-keep="guest" value="' + escapeHtml(ps.guest || "") + '" placeholder="Guest"></div></div>' +
      '<div class="email"><p><strong>From:</strong> Principal.exe<br><strong>To:</strong> JMa</p>' + lines + "<p>Tap the lie.</p></div></div>",
      true,
      '<button type="button" class="btn btn-primary" data-act="submit-login">Log in</button>');
  }

  function puzzleBoss() {
    var ps = state.puzzleState;
    var plugs = '<div class="plug-list"><span class="plug' + (state.flags.bossDoors ? " done" : "") + '">Doors</span><span class="plug' + (state.flags.bossIntercom ? " done" : "") + '">Intercom</span><span class="plug' + (state.flags.bossCameras ? " done" : "") + '">Cameras</span></div>';
    var alert = '<div id="boss-alert" class="alert-banner"' + (state.boss.alert ? "" : " hidden") + "><p>" + escapeHtml(state.boss.alert || "") + '</p><button type="button" class="btn btn-small" data-act="dismiss-alert">It is fake</button></div>';
    var stage = "";
    var foot = "";
    if (ps.stage === "doors") {
      var doors = [["hallway", "Hallway"], ["cafeteria", "Cafeteria"], ["gym", "Gym"], ["office", "Office"]];
      stage = "<p>Unplug the doors. Tap a door, then tap the color of the pass that opened it.</p>" + doors.map(function (d) {
        var color = ps.doors[d[0]];
        return '<button type="button" class="btn' + (ps.pickedDoor === d[0] ? " btn-primary" : "") + '" data-act="boss-door" data-door="' + d[0] + '">' + d[1] + (color ? " · " + color : "") + "</button>";
      }).join(" ") + '<div class="swatch-row">' + [["white", "#f8fafc"], ["orange", "#f97316"], ["green", "#16a34a"], ["purple", "#7c3aed"]].map(function (c) {
        return '<button type="button" class="swatch" data-act="boss-color" data-color="' + c[0] + '"><i style="background:' + c[1] + '"></i></button>';
      }).join("") + "</div>";
      foot = '<button type="button" class="btn btn-primary" data-act="submit-doors">Unplug doors</button>';
    } else if (ps.stage === "intercom") {
      stage = "<p>The intercom is squealing the wrong lunch time. Set it to the classroom clock in the math room.</p><div class=\"pair\"><label>Hour " + hourSelect(ps.ih, "ih") + "</label><label>Minute " + minuteSelect(ps.im, "im") + "</label></div>";
      foot = '<button type="button" class="btn btn-primary" data-act="submit-intercom">Unplug intercom</button>';
    } else if (ps.stage === "cameras") {
      stage = '<p>The cameras play the gym score backwards. Type the real home score and guest score.</p><div class="pair"><input class="text-input" data-keep="home" value="' + escapeHtml(ps.home || "") + '" placeholder="Home"><input class="text-input" data-keep="guest" value="' + escapeHtml(ps.guest || "") + '" placeholder="Guest"></div>';
      foot = '<button type="button" class="btn btn-primary" data-act="submit-cameras">Unplug cameras</button>';
    } else {
      stage = "<p>Shut Principal.exe down. Use the word THANKSGIVING, or invent a family word and type it twice.</p>" +
        '<p><input id="family-word" class="text-input" data-keep="word" placeholder="Family word" value="' + escapeHtml(ps.word || "") + '" autocomplete="off"></p>' +
        '<p><input id="family-word-2" class="text-input" data-keep="confirm" placeholder="Type it again" value="' + escapeHtml(ps.confirm || "") + '" autocomplete="off"></p>';
      foot = '<button type="button" class="btn btn-danger" data-act="shutdown-thanks">SHUT DOWN with THANKSGIVING</button><button type="button" class="btn btn-primary" data-act="submit-shutdown">SHUT DOWN with our word</button>';
    }
    return puzzleShell("Principal.exe", '<div class="boss-top">' + principalFace(false) + '<div><p class="kicker">Fake lockdown</p><div id="boss-timer" class="timer">2:00</div><p>The timer cannot stop you.</p></div></div>' + alert + "<p>" + escapeHtml(ps.banner || "") + "</p>" + plugs + hintBox(ps.hint) + stage, false, foot);
  }

  function renderWin() {
    var step = state.winStep || 0;
    var body = "";
    if (step === 0) {
      body = principalFace(true) + "<h1>Principal.exe is cured</h1><p class=\"lede\">The school AI remembers. There is no school on Thanksgiving.</p>" +
        '<button type="button" class="btn btn-primary" data-act="win-next">Email JMa</button>';
    } else if (step === 1) {
      body = '<article class="email" style="text-align:left"><p><strong>To:</strong> JMa<br><strong>From:</strong> The kids</p><p>There is no school on Thanksgiving. Why did you drop us off?</p><p>Please come pick us up. We want to come home for dinner.</p></article>' +
        '<button type="button" class="btn btn-primary" data-act="win-next">Call JMa</button>';
    } else if (step === 2) {
      body = "<h1>Calling JMa…</h1><div class=\"call-log\"><p><strong>JMa:</strong> Hello? Kids? Why are you at school?</p><p><strong>JMa:</strong> There is no school on Thanksgiving. Why did I drop you off?</p><p><strong>JMa:</strong> That notice was a trick. I am on my way.</p><p><strong>JMa:</strong> Dinner is almost ready. Let's go home.</p></div>" +
        '<button type="button" class="btn btn-primary" data-act="win-next">Go home for dinner</button>';
    } else {
      var kids = state.kids.map(function (k) { return avatarSvg(k.look, 100); }).join("");
      body = "<p class=\"kicker\">You did it together</p><h1>Happy Thanksgiving</h1><div class=\"dinner-table\">" + jmaSvg(130) + kids + "</div>" +
        "<p class=\"lede\">JMa is here. You are home for Thanksgiving dinner.</p>" +
        '<button type="button" class="btn btn-primary" data-act="play-again">Play again</button>';
    }
    return '<section class="screen">' + body + '<button type="button" class="btn" data-act="fullscreen">Full screen</button></section>';
  }

  function guardArt() {
    if (state.room === "art" && state.turn > 2) {
      state.modal = { title: "Younger kids only", html: "<p>This room is for the younger three. Pass the turn, or step back to the hallway.</p>" };
      save();
      render();
      return false;
    }
    return true;
  }

  function go(room) {
    state.room = room;
    state.notice = "";
    save();
    render();
  }

  function freshPuzzle(id) {
    if (id === "printer") return { day: null, icon: null, color: null, code: "", hint: "" };
    if (id === "sketch") return { region: 0, hint: "" };
    if (id === "simon") return { round: 0, step: 0, hint: "", locked: true, pendingPlay: true };
    if (id === "computer") return { hint: "" };
    if (id === "clocks") return { clocks: [{ h: "", m: "" }, { h: "", m: "" }, { h: "", m: "" }], hint: "", c0h: "", c0m: "", c1h: "", c1m: "", c2h: "", c2m: "" };
    if (id === "word") return { word: "", hint: "" };
    if (id === "graph") return { graph: "", hint: "" };
    if (id === "menu") return { phase: 1, crossed: [], hint: "" };
    if (id === "register") return { coins: { quarter: 0, dime: 0, nickel: 0, penny: 0 }, hint: "" };
    if (id === "trays") return { size: null, weight: null, hint: "" };
    if (id === "vending") return { code: "", hint: "" };
    if (id === "score") return { home: "", guest: "", hint: "" };
    if (id === "hoop" || id === "seat") return { hint: "" };
    if (id === "login") return { colors: [], cafe: "", gym: "", office: "", home: "", guest: "", lie: null, hint: "" };
    return { hint: "" };
  }

  function recap(id) {
    var text = {
      sketch: "The picture is done. The red crayon rolled under the drying rack.",
      simon: "The palette is quiet. The yellow paintbrush is on the window sill.",
      clocks: "The three clocks are set. The classroom clock shows 4:15.",
      word: "33 cans are left for the cafeteria.",
      graph: "41 kids like the sweet sides.",
      menu: "Menu scrap: 4. Sweet potato cubes.",
      register: "Register scrap: 50. That was the change in cents.",
      trays: "The card says GYM. The gym pass color is green.",
      vending: "Vending scrap: 12.",
      score: "Final score: home 27, guests 21.",
      hoop: "Hoop scrap: 50.",
      seat: "Seat 16 hid an expired office pass. The new pass color is purple.",
      computer: "Cafeteria pass color: ORANGE."
    }[id];
    return text || "Already solved.";
  }

  function openPuzzle(id) {
    if ((state.room === "art") && !guardArt()) return;
    var solvedFlag = {
      sketch: "colorNumber", simon: "simon", clocks: "clocks", word: "word", graph: "graph",
      menu: "menu", register: "register", trays: "trays", vending: "vending", score: "score",
      hoop: "hoop", seat: "seat", computer: "orange"
    }[id];
    if (solvedFlag && state.flags[solvedFlag]) {
      state.modal = { title: "Already solved", html: "<p>" + recap(id) + "</p>" };
      save();
      render();
      return;
    }
    if (id === "login" && state.flags.login) {
      state.puzzle = "boss";
      state.puzzleState = state.puzzleState && state.puzzleState.stage ? state.puzzleState : freshBossState(resumeStage());
      save();
      render();
      return;
    }
    state.puzzle = id;
    state.puzzleState = id === "boss" ? freshBossState("doors") : freshPuzzle(id);
    if (id === "boss") state.boss.endsAt = Date.now() + 120000;
    save();
    render();
  }

  function finishPuzzle(modal) {
    state.puzzle = null;
    state.puzzleState = null;
    state.pendingAdvance = true;
    state.modal = modal;
    save();
    render();
  }

  function captureDraft() {
    var input = document.getElementById("kid-name");
    if (input && state.draft) state.draft.name = input.value;
  }

  function syncKeep() {
    if (!state.puzzleState) return;
    document.querySelectorAll("[data-keep]").forEach(function (el) {
      state.puzzleState[el.dataset.keep] = el.value;
    });
    if (state.puzzle === "clocks") {
      state.puzzleState.clocks = [
        { h: state.puzzleState.c0h, m: state.puzzleState.c0m },
        { h: state.puzzleState.c1h, m: state.puzzleState.c1m },
        { h: state.puzzleState.c2h, m: state.puzzleState.c2m }
      ];
    }
  }

  var actions = {
    start: function () {
      state = blankState();
      state.phase = "select";
      save();
      render();
    },
    fullscreen: function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
      } else {
        document.exitFullscreen();
      }
    },
    help: function () {
      state.modal = {
        title: "How to play",
        html: "<ul class=\"help-list\"><li>Youngest investigates first, then the next oldest.</li><li>That kid walks to the gold outline and submits.</li><li>Some outlines are jokes. They do not start a puzzle.</li><li>The art room is only for the younger three.</li><li>Wrong answers give a hint. Print passes at the lobby desk.</li></ul>"
      };
      render();
    },
    "select-gender": function (btn) {
      captureDraft();
      state.draft.gender = btn.dataset.gender;
      state.draft.look = null;
      state.draft.error = "";
      render();
    },
    "select-look": function (btn) {
      captureDraft();
      state.draft.look = btn.dataset.look;
      state.draft.error = "";
      render();
    },
    "select-back": function () {
      if (!state.kids.length) {
        state.phase = "title";
        save();
        render();
        return;
      }
      var prev = state.kids.pop();
      state.draft = { name: prev.name, gender: prev.gender, look: prev.look, error: "" };
      save();
      render();
    },
    "select-confirm": function () {
      captureDraft();
      var name = (state.draft.name || "").trim();
      if (!name) state.draft.error = "Type this kid's name.";
      else if (name.length > 14) state.draft.error = "Use 14 letters or fewer.";
      else if (!state.draft.gender || !state.draft.look) state.draft.error = "Pick boy or girl, then a color.";
      else state.draft.error = "";
      if (state.draft.error) { render(); return; }
      state.kids.push({ name: name, gender: state.draft.gender, look: state.draft.look });
      if (state.kids.length === 6) {
        state.phase = "story";
        state.draft = { name: "", gender: null, look: null, error: "" };
      } else {
        state.draft = { name: "", gender: null, look: null, error: "" };
      }
      save();
      render();
    },
    "begin-play": function () {
      state.phase = "play";
      state.room = "lobby";
      state.turn = 0;
      save();
      render();
    },
    "pass-turn": function () {
      if (state.puzzle) return;
      state.turn = (state.turn + 1) % state.kids.length;
      if (state.room === "art" && state.turn > 2) {
        state.room = "hallway";
        state.notice = "The art room is for the younger three. Pass the turn to go back in.";
      }
      save();
      render();
    },
    "toggle-clues": function () {
      state.cluesOpen = !state.cluesOpen;
      var panel = document.getElementById("clue-panel");
      var scrim = document.getElementById("clue-scrim");
      if (panel && scrim) {
        panel.classList.toggle("open", state.cluesOpen);
        scrim.hidden = !state.cluesOpen;
        if (state.cluesOpen) panel.removeAttribute("inert");
        else panel.setAttribute("inert", "");
        save();
        return;
      }
      save();
      render();
    },
    "close-modal": function () {
      state.modal = null;
      if (state.pendingAdvance) {
        state.pendingAdvance = false;
        state.turn = (state.turn + 1) % state.kids.length;
        if (state.room === "art" && state.turn > 2) {
          state.room = "hallway";
          state.notice = ageLabel(state.turn) + " is in the hallway. The art room stays with the younger three.";
        }
      }
      save();
      render();
    },
    "ask-reset": function () {
      state.modal = {
        title: "Start over?",
        html: "<p>This clears the kids, the passes, and every clue.</p>",
        buttons: [{ act: "confirm-reset", label: "Start over" }, { act: "close-modal", label: "Keep playing" }]
      };
      state.pendingAdvance = false;
      render();
    },
    "confirm-reset": function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
      state = blankState();
      render();
    },
    goto: function (btn) { go(btn.dataset.room); },
    decoy: function (btn) {
      state.modal = { title: btn.querySelector("span") ? btn.querySelector("span").textContent : "Look", html: "<p>" + escapeHtml(btn.dataset.joke || "Nothing useful here.") + "</p>" };
      save();
      render();
    },
    "try-hallway": function () {
      if (!hasPass("hallway")) {
        state.modal = { title: "Hallway door", html: '<p class="led">PASS NEEDED</p><p>The screen on the door is awake. Print a white pass at the desk.</p>' };
        save();
        render();
        return;
      }
      go("hallway");
    },
    "try-art": function () {
      if (state.turn > 2) {
        state.modal = { title: "Younger kids only", html: "<p>" + escapeHtml(kid().name) + " is one of the older kids. Pass the turn until a younger kid is investigating.</p>" };
        save();
        render();
        return;
      }
      go("art");
    },
    "try-door": function (btn) {
      if (!hasPass(btn.dataset.pass)) {
        var extra = btn.dataset.room === "office" && state.flags.seat ? "<p>The bleacher pass is expired. Print a new one in the lobby.</p>" : "<p>This door needs the matching pass from the lobby printer.</p>";
        state.modal = { title: roomName(btn.dataset.room), html: '<p class="led">PASS NEEDED</p>' + extra };
        save();
        render();
        return;
      }
      go(btn.dataset.room);
    },
    "open-puzzle": function (btn) { openPuzzle(btn.dataset.puzzle); },
    "leave-puzzle": function () {
      state.puzzle = null;
      state.puzzleState = null;
      save();
      render();
    },
    pickup: function (btn) {
      if (!guardArt()) return;
      var item = btn.dataset.item;
      if (item === "crayon" && !state.flags.crayon) {
        state.flags.crayon = true;
        state.items.push("crayon");
        addClue("crayon", "Holding the red crayon from under the drying rack.");
        state.modal = { title: "Red crayon", html: "<p>It was under the drying rack. Take it to the art computer.</p>" };
      }
      if (item === "brush" && !state.flags.brush) {
        state.flags.brush = true;
        state.items.push("brush");
        addClue("brush", "Holding the yellow paintbrush from the window sill.");
        state.modal = { title: "Yellow paintbrush", html: "<p>Yellow paint led to the window sill. Take the brush to the art computer.</p>" };
      }
      state.pendingAdvance = true;
      save();
      render();
    },
    "pick-day": function (btn) { state.puzzleState.day = Number(btn.dataset.day); render(); },
    "pick-icon": function (btn) { state.puzzleState.icon = btn.dataset.icon; render(); },
    "pick-swatch": function (btn) { state.puzzleState.color = btn.dataset.color; render(); },
    "submit-signin": function () {
      var ps = state.puzzleState;
      if (!L.isThanksgivingDate(state.year, ps.day) || !L.isThanksgivingIcon(ps.icon)) {
        ps.hint = L.signInHint(state.year, ps.day, ps.icon);
        render();
        return;
      }
      state.passes.push("hallway");
      addClue("pass-hallway", "White hallway pass. The printer labeled this ink WHITE.");
      finishPuzzle({ title: "White pass printed", html: passCard("hallway") + "<p>The hallway door can open.</p>" });
    },
    "submit-color-pass": function () {
      syncKeep();
      var ps = state.puzzleState;
      if (!ps.color) { ps.hint = "Pick an ink color. Only white is labeled."; render(); return; }
      if (!L.digitsOnly(ps.code)) { ps.hint = "Type the code from your clues."; render(); return; }
      var which = L.coloredPass(ps.color, ps.code);
      if (!which) { ps.hint = L.printerHint(ps.color, ps.code); render(); return; }
      if (hasPass(which)) { ps.hint = "That pass is already in the clue pocket."; render(); return; }
      state.passes.push(which);
      addClue("pass-" + which, passMeta(which).name + ". " + passMeta(which).blurb);
      finishPuzzle({ title: "Pass printed", html: passCard(which) + "<p>Match this picture to a door in the hallway.</p>" });
    },
    crayon: function (btn) {
      var region = L.SKETCH_REGIONS[state.puzzleState.region];
      var crayon = L.CRAYONS.filter(function (c) { return c.id === btn.dataset.id; })[0];
      if (!region || crayon.n !== region.n) {
        state.puzzleState.hint = "Match the number on the shape to the number on a crayon.";
        render();
        return;
      }
      state.puzzleState.region += 1;
      state.puzzleState.hint = "";
      if (state.puzzleState.region >= L.SKETCH_REGIONS.length) {
        state.flags.colorNumber = true;
        addClue("crayon-where", "The red crayon rolled under the drying rack.");
        finishPuzzle({ title: "Picture finished", html: "<p>The turkey still needs a red wattle, and the red crayon is missing.</p><p>It rolled under the drying rack.</p>" });
        return;
      }
      render();
    },
    simon: function (btn) { simonClick(btn.dataset.simon); },
    "simon-replay": function () {
      state.puzzleState.step = 0;
      state.puzzleState.pendingPlay = true;
      state.puzzleState.hint = "";
      render();
    },
    "return-supplies": function () {
      if (!hasItem("crayon") || !hasItem("brush")) {
        state.puzzleState.hint = "The basket still needs both missing supplies.";
        render();
        return;
      }
      state.items = state.items.filter(function (item) { return item !== "crayon" && item !== "brush"; });
      state.flags.orange = true;
      addClue("orange", "Cafeteria pass color: ORANGE. Red and yellow make orange.");
      finishPuzzle({ title: "Supplies returned", html: "<p>The computer mixes the returned colors.</p><p><strong>Cafeteria pass color: ORANGE.</strong></p>" });
    },
    "submit-clocks": function () {
      syncKeep();
      var result = L.checkClocks(state.puzzleState.clocks);
      if (!result.ok) {
        state.puzzleState.hint = L.clockHint(result.index);
        render();
        return;
      }
      state.flags.clocks = true;
      addClue("clocks-set", "The three clocks are set. Read the classroom clock for the first three digits.");
      finishPuzzle({ title: "Clocks set", html: "<p>The three clocks lock. Look at the classroom clock in the math room. Its time is the first three digits of the cafeteria pass.</p>" });
    },
    "examine-clock": function () {
      if (!state.flags.clocks) {
        state.modal = { title: "Classroom clock", html: "<p>The hands are spinning. Set the three puzzle clocks first.</p>" };
        save();
        render();
        return;
      }
      if (!state.flags.readClock) {
        state.flags.readClock = true;
        state.pendingAdvance = true;
        addClue("clock-digits", "Classroom clock 4:15. First three cafeteria digits: 4, 1, 5.");
      }
      state.modal = { title: "Classroom clock", html: clockSvg(4, 15, true, 180) + '<p class="big-time">4:15</p><p>The first three digits of the cafeteria pass are 4, 1, and 5.</p>' };
      save();
      render();
    },
    "submit-word": function () {
      syncKeep();
      if (Number(state.puzzleState.word) !== L.WORD_ANSWER) {
        state.puzzleState.hint = L.wordHint(state.puzzleState.word);
        render();
        return;
      }
      state.flags.word = true;
      addClue("word", "Chalkboard answer: 33. The cans are for the cafeteria.");
      finishPuzzle({ title: "33 cans left", html: "<p>Write down <strong>33</strong>. It is part of the cafeteria pass. The board says the cans are for the cafeteria.</p>" });
    },
    "submit-graph": function () {
      syncKeep();
      if (Number(state.puzzleState.graph) !== L.GRAPH_ANSWER) {
        state.puzzleState.hint = L.graphHint(state.puzzleState.graph);
        render();
        return;
      }
      state.flags.graph = true;
      addClue("graph", "Sweet sides: 41 kids. The survey is for the cafeteria.");
      finishPuzzle({ title: "41 kids", html: "<p><strong>41</strong> kids like the sweet sides the most. That two-digit number finishes the cafeteria code. This chart belongs to the cafeteria.</p>" });
    },
    "menu-tap": function (btn) {
      var list = state.puzzleState.crossed;
      var id = btn.dataset.food;
      var index = list.indexOf(id);
      if (index === -1) list.push(id);
      else list.splice(index, 1);
      render();
    },
    "menu-check": function () {
      var ps = state.puzzleState;
      if (!L.checkMenuStep(ps.phase, ps.crossed)) {
        ps.hint = L.menuHint(ps.phase, ps.crossed);
        render();
        return;
      }
      if (ps.phase < 3) {
        ps.phase += 1;
        ps.hint = "";
        render();
        return;
      }
      state.flags.menu = true;
      addClue("menu", "Menu scrap: 4.");
      finishPuzzle({ title: "Menu scrap 4", html: "<p>Sweet potato cubes are still for sale, safe for every allergy in line, and they are a side. Menu number <strong>4</strong> is a code scrap.</p>" });
    },
    coin: function (btn) {
      var key = btn.dataset.coin;
      var max = { quarter: 4, dime: 5, nickel: 5, penny: 10 };
      var next = (state.puzzleState.coins[key] || 0) + Number(btn.dataset.dir);
      state.puzzleState.coins[key] = Math.max(0, Math.min(max[key], next));
      render();
    },
    "submit-change": function () {
      var total = L.coinTotal(state.puzzleState.coins);
      if (total !== L.changeDueCents()) {
        state.puzzleState.hint = "That pile is " + money(total) + ". Add the sticky-note prices, subtract them from " + money(L.PAYMENT) + ", and make that change.";
        render();
        return;
      }
      state.flags.register = true;
      addClue("register", "Register scrap: 50. Change was 50 cents.");
      finishPuzzle({ title: "Exact change", html: "<p>The real meal costs " + money(L.PRICES[0].cents + L.PRICES[1].cents + L.PRICES[2].cents) + ". Change from " + money(L.PAYMENT) + " is 50 cents.</p><p><strong>Register scrap: 50.</strong></p>" });
    },
    "pick-size": function (btn) { state.puzzleState.size = btn.dataset.size; render(); },
    "pick-weight": function (btn) { state.puzzleState.weight = Number(btn.dataset.weight); render(); },
    "submit-trays": function () {
      var ps = state.puzzleState;
      if (!L.checkTrays(ps.size, ps.weight)) {
        ps.hint = L.trayHint(ps.size, ps.weight);
        render();
        return;
      }
      state.flags.trays = true;
      addClue("gym-color", "Next door: GYM. Gym pass color: GREEN.");
      finishPuzzle({ title: "A card drops", html: '<p class="led">GYM</p><p>The gym pass color is <strong>green</strong>.</p><p style="width:4rem;height:2rem;background:#16a34a;border:3px solid #24160f"></p>' });
    },
    "submit-vending": function () {
      syncKeep();
      if (L.digitsOnly(state.puzzleState.code) !== L.vendingAnswer()) {
        state.puzzleState.hint = "Put the menu-board scrap in front of the register change scrap.";
        render();
        return;
      }
      state.flags.vending = true;
      addClue("vending", "Vending scrap: 12. Menu scrap times 3.");
      finishPuzzle({ title: "Wrapper scrap " + L.VENDING_SCRAP, html: "<p>The code is accepted. Menu scrap " + L.menuScrap() + " × 3 = <strong>" + L.VENDING_SCRAP + "</strong>. The wrapper is the third cafeteria scrap.</p>" });
    },
    "score-step": function (btn) {
      syncKeep();
      var side = btn.dataset.side;
      var next = Math.max(0, Math.min(99, Number(state.puzzleState[side] || 0) + Number(btn.dataset.dir)));
      state.puzzleState[side] = String(next);
      render();
    },
    "submit-score": function () {
      syncKeep();
      var home = Number(state.puzzleState.home);
      var guest = Number(state.puzzleState.guest);
      if (home !== L.SCORE.home || guest !== L.SCORE.guest) {
        state.puzzleState.hint = L.scoreHint(home, guest);
        render();
        return;
      }
      state.flags.score = true;
      addClue("score", "Final score: home 27, guests 21.");
      finishPuzzle({ title: "Score fixed", html: "<p>Home <strong>27</strong>, guests <strong>21</strong>. The hoop clock lights up.</p>" });
    },
    "pick-arc": function (btn) {
      if (Number(btn.dataset.angle) !== L.HOOP_ANSWER) {
        state.puzzleState.hint = L.hoopHint();
        render();
        return;
      }
      state.flags.hoop = true;
      addClue("hoop", "Hoop scrap: 50.");
      finishPuzzle({ title: "The net drops a scrap", html: "<p>The 50° arc swishes. A scrap flutters out: <strong>50</strong>.</p>" });
    },
    "pick-seat": function (btn) {
      var seat = Number(btn.dataset.seat);
      if (seat !== L.SEAT_ANSWER) {
        state.puzzleState.hint = L.seatHint(seat, state.flags.score);
        render();
        return;
      }
      state.flags.seat = true;
      addClue("office-color", "Expired office pass from seat 16. Office pass color: PURPLE. Print a new one.");
      finishPuzzle({ title: "Under seat 16", html: passCard("office", true) + "<p>Office pass color: <strong>PURPLE</strong>. This old pass will not open the door.</p>" });
    },
    "login-color": function (btn) {
      if (state.puzzleState.colors.length >= 4) return;
      state.puzzleState.colors.push(btn.dataset.color);
      render();
    },
    "login-undo": function () { state.puzzleState.colors.pop(); render(); },
    "login-lie": function (btn) { state.puzzleState.lie = btn.dataset.lie; render(); },
    "submit-login": function () {
      syncKeep();
      var result = L.checkLogin(state.puzzleState);
      if (!result.ok) {
        state.puzzleState.hint = result.hint;
        render();
        return;
      }
      state.flags.login = true;
      state.puzzle = "boss";
      state.puzzleState = freshBossState("doors");
      state.boss = { endsAt: Date.now() + 120000, alert: "LOCKDOWN ALERT. This one is fake." };
      save();
      render();
    },
    "boss-door": function (btn) { state.puzzleState.pickedDoor = btn.dataset.door; render(); },
    "boss-color": function (btn) {
      if (!state.puzzleState.pickedDoor) {
        state.puzzleState.hint = "Tap a door first, then tap its pass color.";
        render();
        return;
      }
      state.puzzleState.doors[state.puzzleState.pickedDoor] = btn.dataset.color;
      state.puzzleState.pickedDoor = null;
      state.puzzleState.hint = "";
      render();
    },
    "submit-doors": function () {
      var expected = { hallway: "white", cafeteria: "orange", gym: "green", office: "purple" };
      var doors = state.puzzleState.doors;
      var ok = Object.keys(expected).every(function (key) { return doors[key] === expected[key]; });
      if (!ok) {
        state.puzzleState.hint = "Match each door to the color of the pass that opened it.";
        render();
        return;
      }
      state.flags.bossDoors = true;
      advanceBoss("intercom", "The doors are unplugged.");
    },
    "submit-intercom": function () {
      syncKeep();
      if (!L.timeMatches(state.puzzleState.ih, state.puzzleState.im, L.WALL_CLOCK)) {
        state.puzzleState.hint = "Set the time you read on the math room's classroom clock.";
        render();
        return;
      }
      state.flags.bossIntercom = true;
      advanceBoss("cameras", "The intercom is unplugged.");
    },
    "submit-cameras": function () {
      syncKeep();
      if (Number(state.puzzleState.home) !== L.SCORE.home || Number(state.puzzleState.guest) !== L.SCORE.guest) {
        state.puzzleState.hint = "Use the final score from the gym scoreboard.";
        render();
        return;
      }
      state.flags.bossCameras = true;
      advanceBoss("shutdown", "The cameras are unplugged. Shut Principal.exe down.");
    },
    "dismiss-alert": function () {
      state.boss.alert = null;
      var banner = document.getElementById("boss-alert");
      if (banner) banner.hidden = true;
    },
    "shutdown-thanks": function () { cure(); },
    "submit-shutdown": function () {
      syncKeep();
      var result = L.acceptPassword(state.puzzleState.word, state.puzzleState.confirm, false);
      if (!result.ok) {
        state.puzzleState.hint = result.hint;
        render();
        return;
      }
      cure();
    },
    "win-next": function () {
      state.winStep = (state.winStep || 0) + 1;
      save();
      render();
    },
    "play-again": function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
      state = blankState();
      render();
    }
  };

  function advanceBoss(stage, banner) {
    var name = kid().name;
    state.turn = (state.turn + 1) % state.kids.length;
    state.puzzleState.stage = stage;
    state.puzzleState.hint = "";
    state.puzzleState.banner = name + " finished that plug. " + banner;
    save();
    render();
  }

  function cure() {
    stopBossTimers();
    state.flags.cured = true;
    state.puzzle = null;
    state.puzzleState = null;
    state.phase = "win";
    state.winStep = 0;
    state.pendingAdvance = false;
    save();
    render();
  }

  function simonClick(color) {
    var ps = state.puzzleState;
    if (!ps || ps.locked) return;
    var len = L.SIMON_ROUNDS[ps.round];
    var seq = L.SIMON_SEQUENCE.slice(0, len);
    flash(color);
    if (color !== seq[ps.step]) {
      ps.step = 0;
      ps.locked = true;
      ps.pendingPlay = true;
      ps.hint = "That color is out of order. Watch the pattern again.";
      render();
      return;
    }
    ps.step += 1;
    var status = document.getElementById("simon-status");
    if (ps.step < seq.length) {
      if (status) status.textContent = "Yes. " + ps.step + " of " + seq.length;
      return;
    }
    if (ps.round < L.SIMON_ROUNDS.length - 1) {
      ps.round += 1;
      ps.step = 0;
      ps.hint = "";
      ps.pendingPlay = true;
      render();
      return;
    }
    state.flags.simon = true;
    addClue("brush-where", "The yellow paintbrush is on the window sill.");
    finishPuzzle({ title: "Palette cleared", html: "<p>The colors rest. Yellow paint smudges lead to the window sill, where the yellow paintbrush is waiting.</p>" });
  }

  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function flash(color) {
    return new Promise(function (resolve) {
      var el = document.querySelector('[data-simon="' + color + '"]');
      if (el) el.classList.add("lit");
      setTimeout(function () {
        if (el) el.classList.remove("lit");
        setTimeout(resolve, 90);
      }, 520);
    });
  }

  async function startSimonRound() {
    var token = ++simonToken;
    var ps = state.puzzleState;
    if (!ps) return;
    var len = L.SIMON_ROUNDS[ps.round];
    var seq = L.SIMON_SEQUENCE.slice(0, len);
    ps.locked = true;
    var status = document.getElementById("simon-status");
    if (status) status.textContent = "Watch the colors";
    await wait(350);
    for (var i = 0; i < seq.length; i++) {
      if (token !== simonToken) return;
      await flash(seq[i]);
      await wait(160);
    }
    if (token !== simonToken) return;
    ps.locked = false;
    ps.step = 0;
    if (status) status.textContent = "Your turn. Copy the colors.";
  }

  var bossTick = null;
  var bossAlertTimer = null;

  function stopBossTimers() {
    if (bossTick) clearInterval(bossTick);
    if (bossAlertTimer) clearInterval(bossAlertTimer);
    bossTick = null;
    bossAlertTimer = null;
  }

  function startBossTimers() {
    stopBossTimers();
    if (!state.boss.endsAt || state.boss.endsAt < Date.now()) state.boss.endsAt = Date.now() + 120000;
    bossTick = setInterval(function () {
      var label = document.getElementById("boss-timer");
      if (!label) return;
      var left = state.boss.endsAt - Date.now();
      if (left <= 0) {
        state.boss.endsAt = Date.now() + 120000;
        state.boss.alert = "FALSE ALARM. The timer is fake. You are safe. Keep going.";
        var banner = document.getElementById("boss-alert");
        if (banner) {
          banner.hidden = false;
          var p = banner.querySelector("p");
          if (p) p.textContent = state.boss.alert;
        }
        left = 120000;
      }
      var seconds = Math.ceil(left / 1000);
      label.textContent = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
    }, 250);
    bossAlertTimer = setInterval(function () {
      if (state.puzzle !== "boss" || state.boss.alert) return;
      var lines = [
        "LOCKDOWN ALERT. This one is fake.",
        "CAMERA PANIC. You are still safe.",
        "DOOR ALARM. Principal.exe is bluffing."
      ];
      state.boss.alert = lines[Math.floor(Math.random() * lines.length)];
      var banner = document.getElementById("boss-alert");
      if (!banner) return;
      banner.hidden = false;
      var p = banner.querySelector("p");
      if (p) p.textContent = state.boss.alert;
    }, 22000);
  }

  function afterRender() {
    if (state.puzzle === "simon" && state.puzzleState && state.puzzleState.pendingPlay) {
      state.puzzleState.pendingPlay = false;
      startSimonRound();
    }
    if (state.puzzle === "boss") startBossTimers();
  }

  var walking = false;
  function walkTo(btn, done) {
    if (walking) return;
    var token = document.querySelector('.kid-token[data-kid="' + state.turn + '"]');
    var x = parseFloat(btn.dataset.x);
    var y = parseFloat(btn.dataset.y);
    if (!token || isNaN(x)) { done(); return; }
    walking = true;
    token.classList.add("walking");
    token.style.left = x + "%";
    token.style.top = y + "%";
    if (!state.feet) state.feet = {};
    if (!state.feet[state.room]) state.feet[state.room] = {};
    state.feet[state.room][state.turn] = { x: x, y: y };
    setTimeout(function () {
      walking = false;
      done();
    }, 700);
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-act]");
    if (!btn || !actions[btn.dataset.act]) return;
    event.preventDefault();
    if (btn.dataset.x && state.phase === "play" && !state.puzzle && !state.modal) {
      walkTo(btn, function () { actions[btn.dataset.act](btn); });
      return;
    }
    actions[btn.dataset.act](btn);
  });

  document.addEventListener("input", function (event) {
    if (!state.puzzleState || !event.target.dataset || !event.target.dataset.keep) return;
    state.puzzleState[event.target.dataset.keep] = event.target.value;
  });

  document.addEventListener("change", function (event) {
    if (!state.puzzleState || !event.target.dataset || !event.target.dataset.keep) return;
    state.puzzleState[event.target.dataset.keep] = event.target.value;
    if (state.puzzle === "clocks") syncKeep();
  });

  document.addEventListener("keydown", function (event) {
    var tag = event.target && event.target.tagName;
    var typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
    if (!typing && (event.key === "f" || event.key === "F")) {
      event.preventDefault();
      actions.fullscreen();
    }
    if (event.key === "Enter" && tag === "INPUT" && state.puzzle) {
      var submit = document.querySelector('.puzzle [data-act^="submit-"]');
      if (submit) {
        event.preventDefault();
        submit.click();
      }
    }
  });

  load();
  render();
})();
