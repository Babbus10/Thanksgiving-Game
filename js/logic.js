/* Pure rules for Thanksgiving Escape. No DOM. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TELogic = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  var THANKSGIVING_ICONS = ["turkey", "pumpkin", "corn", "pie", "leaf", "cornucopia"];

  var LOOKS = [
    { id: "boy-blue", gender: "boy", color: "Blue", swatch: "#2563eb" },
    { id: "boy-green", gender: "boy", color: "Green", swatch: "#15803d" },
    { id: "boy-purple", gender: "boy", color: "Purple", swatch: "#7c3aed" },
    { id: "girl-pink", gender: "girl", color: "Pink", swatch: "#db2777" },
    { id: "girl-amber", gender: "girl", color: "Amber", swatch: "#d97706" },
    { id: "girl-teal", gender: "girl", color: "Teal", swatch: "#0f766e" }
  ];

  var CRAYONS = [
    { id: "purple", n: 3, label: "Purple", fill: "#7c3aed" },
    { id: "yellow", n: 5, label: "Yellow", fill: "#eab308" },
    { id: "brown", n: 8, label: "Brown", fill: "#8b5a2b" },
    { id: "blue", n: 7, label: "Blue", fill: "#3b82f6" },
    { id: "green", n: 2, label: "Green", fill: "#16a34a" },
    { id: "orange", n: 9, label: "Orange", fill: "#f97316" }
  ];

  var SKETCH_REGIONS = [
    { n: 7, name: "tablecloth" },
    { n: 2, name: "leaf" },
    { n: 5, name: "corn" },
    { n: 8, name: "gravy boat" },
    { n: 3, name: "grapes" },
    { n: 9, name: "pumpkin" }
  ];

  var SIMON_SEQUENCE = ["blue", "orange", "green", "red", "yellow"];
  var SIMON_ROUNDS = [3, 4, 5];
  var SIMON_COLORS = [
    { id: "red", fill: "#dc2626" },
    { id: "orange", fill: "#f97316" },
    { id: "yellow", fill: "#eab308" },
    { id: "green", fill: "#16a34a" },
    { id: "blue", fill: "#2563eb" },
    { id: "purple", fill: "#7c3aed" }
  ];

  var CLOCK_ANSWERS = [
    { h: 1, m: 0 },
    { h: 8, m: 30 },
    { h: 5, m: 45 }
  ];
  var WALL_CLOCK = { h: 4, m: 15, digits: "415" };
  var WORD_ANSWER = 33;
  var GRAPH_ANSWER = 41;

  var GRAPH_BARS = [
    { id: "turkey", label: "Turkey", value: 20, sweet: false },
    { id: "stuffing", label: "Stuffing", value: 11, sweet: false },
    { id: "sweet-potatoes", label: "Sweet potatoes", value: 17, sweet: true },
    { id: "mashed", label: "Mashed potatoes", value: 13, sweet: false },
    { id: "cranberry", label: "Cranberry", value: 8, sweet: true },
    { id: "pie", label: "Pumpkin pie", value: 16, sweet: true }
  ];

  var MENU_ITEMS = [
    { id: "turkey", n: 1, name: "Roast Turkey", kind: "Main", tags: [], soldOut: false },
    { id: "pizza", n: 2, name: "Cheese Pizza", kind: "Main", tags: ["Dairy"], soldOut: true },
    { id: "noodles", n: 3, name: "Peanut Noodles", kind: "Main", tags: ["Nuts"], soldOut: false },
    { id: "sweetpotato", n: 4, name: "Sweet Potato Cubes", kind: "Side", tags: [], soldOut: false },
    { id: "milk", n: 5, name: "Milk", kind: "Drink", tags: ["Dairy"], soldOut: false },
    { id: "juice", n: 6, name: "Apple Juice", kind: "Drink", tags: [], soldOut: false },
    { id: "muffin", n: 7, name: "Stuffing Muffin", kind: "Side", tags: ["Gluten"], soldOut: false },
    { id: "mix", n: 8, name: "Trail Mix", kind: "Side", tags: ["Nuts"], soldOut: true }
  ];

  var PRICES = [
    { name: "Turkey plate", cents: 250 },
    { name: "Sweet potatoes", cents: 125 },
    { name: "Milk", cents: 75 }
  ];
  var PLANTED_TOTAL = 740;
  var PAYMENT = 500;
  var COIN_VALUES = { quarter: 25, dime: 10, nickel: 5, penny: 1 };

  var TRAYS = [
    { size: "small", weight: 2 },
    { size: "medium", weight: 4 },
    { size: "large", weight: 6 },
    { size: "small", weight: 8 },
    { size: "medium", weight: 10 }
  ];

  var SCORE = { home: 27, guest: 21 };
  var HOOP_ANSWER = 50;
  var SEAT_ANSWER = 16;
  var VENDING_SCRAP = 12;
  var PASS_COLORS = ["white", "orange", "green", "purple"];
  var LIE_ID = "classes";

  var AGE_LABELS = [
    "Youngest",
    "2nd youngest",
    "3rd youngest",
    "4th youngest",
    "5th youngest",
    "Oldest"
  ];

  function thanksgivingDay(year) {
    var nov1 = new Date(year, 10, 1);
    var firstThursday = ((4 - nov1.getDay() + 7) % 7) + 1;
    return firstThursday + 21;
  }

  function isThanksgivingDate(year, day) {
    return Number(day) === thanksgivingDay(Number(year));
  }

  function isThanksgivingIcon(id) {
    return THANKSGIVING_ICONS.indexOf(id) !== -1;
  }

  function signInHint(year, day, icon) {
    var dateOk = isThanksgivingDate(year, day);
    var iconOk = isThanksgivingIcon(icon);
    if (!day && !icon) return "Choose the Thanksgiving date and a holiday picture.";
    if (!dateOk && !iconOk) {
      return "Thanksgiving is the fourth Thursday in November. The picture should be food or a fall decoration from that day.";
    }
    if (!dateOk) return "Count the Thursdays. Thanksgiving is the fourth Thursday in November.";
    if (!icon) return "Stamp a picture that belongs to Thanksgiving.";
    return "That picture is from a different day. Try a Thanksgiving food or decoration.";
  }

  function digitsOnly(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  function cafeteriaCode() {
    return WALL_CLOCK.digits + String(WORD_ANSWER) + String(GRAPH_ANSWER);
  }

  function menuScrap() {
    return 4;
  }

  function registerScrap() {
    return changeDueCents();
  }

  function gymCode() {
    return String(menuScrap()) + String(registerScrap()) + String(VENDING_SCRAP);
  }

  function officeCode() {
    return String(HOOP_ANSWER) + String(SCORE.home) + String(SCORE.guest);
  }

  function changeDueCents() {
    var total = PRICES.reduce(function (sum, item) {
      return sum + item.cents;
    }, 0);
    return PAYMENT - total;
  }

  function coinTotal(counts) {
    return Object.keys(COIN_VALUES).reduce(function (sum, key) {
      return sum + (Number(counts[key]) || 0) * COIN_VALUES[key];
    }, 0);
  }

  function checkClocks(entries) {
    if (!entries || entries.length !== 3) return { ok: false, index: 0 };
    for (var i = 0; i < 3; i++) {
      var gotH = Number(entries[i].h);
      var gotM = Number(entries[i].m);
      if (gotH !== CLOCK_ANSWERS[i].h || gotM !== CLOCK_ANSWERS[i].m) {
        return { ok: false, index: i };
      }
    }
    return { ok: true };
  }

  function clockHint(index) {
    return "Clock " + (index + 1) + ": the short hand is the hour. The long hand is the minutes. Straight up means :00, straight down means :30.";
  }

  function wordHint(value) {
    if (Number(value) === 42) {
      return "That is how many cans arrived. Subtract the 9 cans given to the office.";
    }
    return "Multiply the kids by the cans each kid brought, then subtract the cans given to the office.";
  }

  function graphHint(value) {
    if (Number(value) === 20) {
      return "Turkey is the tallest bar. The question asks you to add the three sweet sides.";
    }
    return "Add sweet potatoes, cranberry, and pumpkin pie. Use the numbers written on those bars.";
  }

  function menuTarget(phase) {
    if (phase === 1) {
      return MENU_ITEMS.filter(function (item) { return item.soldOut; }).map(function (item) { return item.id; });
    }
    if (phase === 2) {
      return MENU_ITEMS.filter(function (item) { return item.tags.length > 0; }).map(function (item) { return item.id; });
    }
    return MENU_ITEMS.filter(function (item) { return item.id !== "sweetpotato"; }).map(function (item) { return item.id; });
  }

  function sameIds(a, b) {
    if (a.length !== b.length) return false;
    var sortedA = a.slice().sort();
    var sortedB = b.slice().sort();
    for (var i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
  }

  function checkMenuStep(phase, crossed) {
    return sameIds(crossed, menuTarget(phase));
  }

  function menuHint(phase, crossed) {
    var target = menuTarget(phase);
    var extra = crossed.filter(function (id) { return target.indexOf(id) === -1; });
    if (phase === 1) {
      return extra.length
        ? "Leave foods that are still for sale. Cross off only the sold-out foods."
        : "Look for the SOLD OUT stickers.";
    }
    if (phase === 2) {
      return extra.length
        ? "That food has no dairy, nuts, or gluten. Leave it for now."
        : "Cross off every food tagged dairy, nuts, or gluten.";
    }
    return extra.length
      ? "Sweet potato cubes can stay. They are the side with no allergy tags."
      : "Cross off the mains and drinks that are still showing. One side should remain.";
  }

  function checkTrays(size, weight) {
    return size === "large" && Number(weight) === 12;
  }

  function trayHint(size, weight) {
    var sizeOk = size === "large";
    var weightOk = Number(weight) === 12;
    if (!sizeOk && !weightOk) {
      return "Sizes go small, medium, large, and then repeat. Each stack is heavier by the same amount.";
    }
    if (!sizeOk) return "Read the sizes in order: small, medium, large, then they start over.";
    return "Each stack weighs 2 pounds more than the stack before it.";
  }

  function vendingAnswer() {
    return String(menuScrap()) + String(registerScrap());
  }

  function scoreHint(home, guest) {
    var h = Number(home);
    var g = Number(guest);
    if (!h || !g) return "Enter both scores, then check the clipboard one rule at a time.";
    if (h - g !== 6) return "Home minus guest should be 6.";
    if (h % 9 !== 0) return "The home score should be divisible by 9.";
    if (g % 7 !== 0) return "The guest score should be divisible by 7.";
    if (/[05]/.test(String(h) + String(g))) return "A score still has a 0 or a 5 in it.";
    return "Check every rule on the clipboard again.";
  }

  function seatFromScore(home, guest) {
    return (Number(home) - Number(guest)) + 10;
  }

  function seatHint(seat, scoreKnown) {
    var n = Number(seat);
    if (!scoreKnown) return "The formula uses the final score from the scoreboard.";
    if (n === SCORE.home) return "That is the home score. Use the formula on the rail.";
    if (n === SCORE.home - SCORE.guest) return "You found the difference. The rail says to add 10.";
    return "Subtract the guest score from the home score, then add 10.";
  }

  function hoopHint() {
    return "The coach wants an angle bigger than 40° and smaller than 60° that falls through the rim.";
  }

  function coloredPass(color, code) {
    var digits = digitsOnly(code);
    if (color === "orange" && digits === cafeteriaCode()) return "cafeteria";
    if (color === "green" && digits === gymCode()) return "gym";
    if (color === "purple" && digits === officeCode()) return "office";
    return null;
  }

  function printerHint(color, code) {
    var digits = digitsOnly(code);
    var colorMatch = (color === "orange" && digits === cafeteriaCode())
      || (color === "green" && digits === gymCode())
      || (color === "purple" && digits === officeCode());
    if (colorMatch) return "";
    var codeMatch = digits === cafeteriaCode() || digits === gymCode() || digits === officeCode();
    var knownColor = color === "orange" || color === "green" || color === "purple";
    if (codeMatch) return "Those numbers match a pass, and the ink color does not. Check the color clue for that door.";
    if (knownColor) return "That color is a real pass color. The code is the scraps for that door, typed in the order you found them.";
    return "The printer does not know that pass yet. Explore, then come back with a color clue and a code.";
  }

  function checkLogin(input) {
    var colors = input.colors || [];
    if (colors.join(",") !== PASS_COLORS.join(",")) {
      return {
        ok: false,
        hint: "Enter the pass colors in the order you printed them. The hallway pass came first."
      };
    }
    if (digitsOnly(input.cafe) !== cafeteriaCode()) {
      return {
        ok: false,
        hint: "The cafeteria code is the clock digits, then the chalkboard number, then the sweet-sides number."
      };
    }
    if (digitsOnly(input.gym) !== gymCode()) {
      return {
        ok: false,
        hint: "The gym code is the three cafeteria scraps in the order you found them."
      };
    }
    if (digitsOnly(input.office) !== officeCode()) {
      return {
        ok: false,
        hint: "The office code is the hoop scrap, then the home score, then the guest score."
      };
    }
    if (Number(input.home) !== SCORE.home || Number(input.guest) !== SCORE.guest) {
      return { ok: false, hint: "Type the final score you fixed on the gym scoreboard." };
    }
    if (input.lie !== LIE_ID) {
      return { ok: false, hint: "Which sentence could never be true on Thanksgiving?" };
    }
    return { ok: true };
  }

  function acceptPassword(text, confirmText, useThanksgiving) {
    if (useThanksgiving) return { ok: true };
    var word = String(text || "").trim();
    var again = String(confirmText || "").trim();
    if (word.length < 3) {
      return { ok: false, hint: "Type a family word of at least 3 letters, or tap THANKSGIVING." };
    }
    if (word.toLowerCase() !== again.toLowerCase()) {
      return { ok: false, hint: "Type the same family word in both boxes." };
    }
    return { ok: true };
  }

  function timeMatches(h, m, target) {
    return Number(h) === target.h && Number(m) === target.m;
  }

  function lookById(id) {
    for (var i = 0; i < LOOKS.length; i++) {
      if (LOOKS[i].id === id) return LOOKS[i];
    }
    return null;
  }

  return {
    THANKSGIVING_ICONS: THANKSGIVING_ICONS,
    LOOKS: LOOKS,
    CRAYONS: CRAYONS,
    SKETCH_REGIONS: SKETCH_REGIONS,
    SIMON_SEQUENCE: SIMON_SEQUENCE,
    SIMON_ROUNDS: SIMON_ROUNDS,
    SIMON_COLORS: SIMON_COLORS,
    CLOCK_ANSWERS: CLOCK_ANSWERS,
    WALL_CLOCK: WALL_CLOCK,
    WORD_ANSWER: WORD_ANSWER,
    GRAPH_ANSWER: GRAPH_ANSWER,
    GRAPH_BARS: GRAPH_BARS,
    MENU_ITEMS: MENU_ITEMS,
    PRICES: PRICES,
    PLANTED_TOTAL: PLANTED_TOTAL,
    PAYMENT: PAYMENT,
    COIN_VALUES: COIN_VALUES,
    TRAYS: TRAYS,
    SCORE: SCORE,
    HOOP_ANSWER: HOOP_ANSWER,
    SEAT_ANSWER: SEAT_ANSWER,
    VENDING_SCRAP: VENDING_SCRAP,
    PASS_COLORS: PASS_COLORS,
    LIE_ID: LIE_ID,
    AGE_LABELS: AGE_LABELS,
    thanksgivingDay: thanksgivingDay,
    isThanksgivingDate: isThanksgivingDate,
    isThanksgivingIcon: isThanksgivingIcon,
    signInHint: signInHint,
    digitsOnly: digitsOnly,
    cafeteriaCode: cafeteriaCode,
    menuScrap: menuScrap,
    registerScrap: registerScrap,
    gymCode: gymCode,
    officeCode: officeCode,
    changeDueCents: changeDueCents,
    coinTotal: coinTotal,
    checkClocks: checkClocks,
    clockHint: clockHint,
    wordHint: wordHint,
    graphHint: graphHint,
    menuTarget: menuTarget,
    checkMenuStep: checkMenuStep,
    menuHint: menuHint,
    checkTrays: checkTrays,
    trayHint: trayHint,
    vendingAnswer: vendingAnswer,
    scoreHint: scoreHint,
    seatFromScore: seatFromScore,
    seatHint: seatHint,
    hoopHint: hoopHint,
    coloredPass: coloredPass,
    printerHint: printerHint,
    checkLogin: checkLogin,
    acceptPassword: acceptPassword,
    timeMatches: timeMatches,
    lookById: lookById
  };
});
