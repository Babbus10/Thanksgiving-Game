import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const L = require("../js/logic.js");

test("Thanksgiving is the fourth Thursday of November", function () {
  assert.equal(L.thanksgivingDay(2024), 28);
  assert.equal(L.thanksgivingDay(2025), 27);
  assert.equal(L.thanksgivingDay(2026), 26);
  assert.equal(L.thanksgivingDay(2027), 25);
  assert.equal(L.isThanksgivingDate(2026, 26), true);
  assert.equal(L.isThanksgivingDate(2026, 19), false);
});

test("pass codes are assembled in spec order", function () {
  assert.equal(L.cafeteriaCode(), "4153341");
  assert.equal(L.WALL_CLOCK.digits, "415");
  assert.equal(L.WORD_ANSWER, 33);
  assert.equal(L.GRAPH_ANSWER, 41);
  assert.equal(L.GRAPH_BARS.filter(function (b) { return b.sweet; }).reduce(function (s, b) { return s + b.value; }, 0), 41);
  assert.equal(6 * 7 - 9, 33);
  assert.equal(L.menuScrap(), 4);
  assert.equal(L.registerScrap(), 50);
  assert.equal(L.changeDueCents(), 50);
  assert.equal(L.vendingAnswer(), "450");
  assert.equal(L.VENDING_SCRAP, 12);
  assert.equal(L.gymCode(), "45012");
  assert.equal(L.officeCode(), "502721");
  assert.equal(L.seatFromScore(27, 21), 16);
  assert.equal(L.SEAT_ANSWER, 16);
});

test("clocks, trays, menu steps, and login", function () {
  assert.deepEqual(L.checkClocks([{ h: 1, m: 0 }, { h: 8, m: 30 }, { h: 5, m: 45 }]), { ok: true });
  assert.equal(L.checkClocks([{ h: 1, m: 5 }, { h: 8, m: 30 }, { h: 5, m: 45 }]).ok, false);
  assert.equal(L.checkTrays("large", 12), true);
  assert.equal(L.checkTrays("small", 12), false);
  assert.equal(L.checkMenuStep(1, ["pizza", "mix"]), true);
  assert.equal(L.checkMenuStep(3, L.menuTarget(3)), true);
  assert.equal(L.menuTarget(3).indexOf("sweetpotato"), -1);
  assert.equal(L.coloredPass("orange", "415 33 41"), "cafeteria");
  assert.equal(L.coloredPass("green", "4-50-12"), "gym");
  assert.equal(L.coloredPass("purple", "502721"), "office");
  assert.equal(L.coloredPass("blue", "502721"), null);
  var login = L.checkLogin({
    colors: ["white", "orange", "green", "purple"],
    cafe: "4153341",
    gym: "45012",
    office: "502721",
    home: 27,
    guest: 21,
    lie: "classes"
  });
  assert.equal(login.ok, true);
  assert.equal(L.checkLogin({
    colors: ["orange", "white", "green", "purple"],
    cafe: "4153341",
    gym: "45012",
    office: "502721",
    home: 27,
    guest: 21,
    lie: "classes"
  }).ok, false);
  assert.equal(L.acceptPassword("pie", "pie", false).ok, true);
  assert.equal(L.acceptPassword("pie", "Pie", false).ok, true);
  assert.equal(L.acceptPassword("no", "no", false).ok, false);
  assert.equal(L.acceptPassword("", "", true).ok, true);
});
