"use strict";
// Run with:  node sync_core_tests.js     (no packages needed)
const assert = require("assert");
const C = require("./sync_core.js");

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("PASS  " + name); }
  catch (e) { failed++; console.log("FAIL  " + name + "\n      " + String(e.message).split("\n")[0]); }
}
const T0 = "2026-11-12T00:00:00.000Z";
const rec = (id, extra) => Object.assign({ id, date: "2026-11-12", salesIn: 100 }, extra);
const frozen = (o) => JSON.stringify(o);

// ---------- ids and fingerprints ----------
test("newId: UUID v4 shape, 20,000 unique", () => {
  const seen = new Set();
  for (let i = 0; i < 20000; i++) { const id = C.newId(); assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)); seen.add(id); }
  assert.strictEqual(seen.size, 20000);
});
test("newId: works without crypto.randomUUID (fallback path)", () => {
  const fake = { getRandomValues: (b) => { for (let i = 0; i < b.length; i++) b[i] = (i * 37 + 11) & 255; return b; } };
  assert(/^[0-9a-f-]{36}$/.test(C.newId(fake)));
  assert(/^[0-9a-f-]{36}$/.test(C.newId({})));
});
test("fingerprint: key order does not matter, any value change does", () => {
  assert.strictEqual(C.fingerprint({ a: 1, b: { x: 2, y: 3 } }), C.fingerprint({ b: { y: 3, x: 2 }, a: 1 }));
  assert.notStrictEqual(C.fingerprint({ a: 1 }), C.fingerprint({ a: 2 }));
  assert.notStrictEqual(C.fingerprint({ a: 1 }), C.fingerprint({ a: "1" }));
  assert.strictEqual(C.fingerprint({ a: 1, u: undefined }), C.fingerprint({ a: 1 }));
});
test("isLegacy: rows without id are legacy", () => {
  assert(C.isLegacy({ date: "x" })); assert(!C.isLegacy({ id: "a" }));
});

// ---------- add ----------
test("add: applied, retry is skipped, list never gets a duplicate", () => {
  const op = C.makeAddOp("dailyLogs", rec("A"), T0);
  let r = C.applyOp({ dailyLogs: [] }, op); assert.strictEqual(r.result, "applied");
  r = C.applyOp(r.blob, op); assert.strictEqual(r.result, "skipped-already-applied");
  assert.strictEqual(r.blob.dailyLogs.length, 1);
});
test("add: same id with different content is a conflict, nothing changes", () => {
  const base = { dailyLogs: [rec("A", { salesIn: 5 })] };
  const r = C.applyOp(base, C.makeAddOp("dailyLogs", rec("A", { salesIn: 999 }), T0));
  assert.strictEqual(r.result, "conflict"); assert.strictEqual(r.blob.dailyLogs[0].salesIn, 5);
});
test("add: creates the list when the category is missing; legacy rows untouched", () => {
  const legacy = { date: "2026-10-01", salesIn: 7 };
  const r = C.applyOp({ dailyLogs: [legacy] }, C.makeAddOp("dailyLogs", rec("A"), T0));
  assert.deepStrictEqual(r.blob.dailyLogs[0], legacy); assert.strictEqual(r.blob.dailyLogs.length, 2);
  assert.strictEqual(C.applyOp({}, C.makeAddOp("gcashLogs", rec("G"), T0)).blob.gcashLogs.length, 1);
});
test("add without an id is refused", () => assert.throws(() => C.makeAddOp("dailyLogs", { date: "x" })));

// ---------- delete by id + tombstones ----------
test("delete by id: removes only that row; replay finds it missing", () => {
  const op = C.makeDeleteByIdOp("dailyLogs", "B", T0);
  let r = C.applyOp({ dailyLogs: [rec("A"), rec("B"), rec("C")] }, op);
  assert.strictEqual(r.result, "applied"); assert.deepStrictEqual(r.blob.dailyLogs.map((x) => x.id), ["A", "C"]);
  r = C.applyOp(r.blob, op); assert.strictEqual(r.result, "skipped-target-missing");
});
test("RESURRECTION GUARD: a late retry of 'add' cannot bring back an entry deleted elsewhere", () => {
  const add = C.makeAddOp("dailyLogs", rec("X"), T0);
  let b = C.applyOp({ dailyLogs: [] }, add).blob;                          // phone A's add reached the server (reply lost)
  b = C.applyOp(b, C.makeDeleteByIdOp("dailyLogs", "X", T0)).blob;         // phone B deleted it
  const retry = C.applyOp(b, add);                                          // phone A retries
  assert.strictEqual(retry.result, "skipped-deleted"); assert.strictEqual(retry.blob.dailyLogs.length, 0);
});
test("tombstones keep only the newest 200", () => {
  let b = { dailyLogs: [] };
  for (let i = 0; i < 250; i++) { b.dailyLogs.push(rec("r" + i)); b = C.applyOp(b, C.makeDeleteByIdOp("dailyLogs", "r" + i, T0)).blob; }
  assert.strictEqual(b._meta.deleted.length, 200); assert.strictEqual(b._meta.deleted[0].id, "r50");
});

// ---------- legacy rows (no id) ----------
test("legacy delete among identical rows: removes exactly one; REPLAY never removes a second", () => {
  const A = { date: "2026-10-01", salesIn: 50 }, B = { date: "2026-10-02", salesIn: 60 };
  const list = [A, { ...A }, B];
  const op = C.makeDeleteLegacyOp("dailyLogs", list, A, T0);
  assert.strictEqual(op.expectCount, 2);
  let r = C.applyOp({ dailyLogs: list }, op); assert.strictEqual(r.result, "applied"); assert.strictEqual(r.blob.dailyLogs.length, 2);
  r = C.applyOp(r.blob, op); assert.strictEqual(r.result, "skipped-already-applied"); assert.strictEqual(r.blob.dailyLogs.length, 2);
});
test("legacy delete: someone changed the identical-row count -> conflict, no guess", () => {
  const A = { d: 1 }; const op = C.makeDeleteLegacyOp("x", [A, A], A, T0);
  assert.strictEqual(C.applyOp({ x: [A, A, A] }, op).result, "conflict");
  assert.strictEqual(C.applyOp({ x: [] }, op).result, "conflict");
  assert.strictEqual(C.applyOp({ x: [A] }, op).result, "skipped-already-applied");
});
test("legacy undo (re-add): applied once, replay skipped, changed count -> conflict", () => {
  const A = { d: 1 }; const op = C.makeAddLegacyOp("x", [A], A, T0);
  let r = C.applyOp({ x: [A] }, op); assert.strictEqual(r.result, "applied"); assert.strictEqual(r.blob.x.length, 2);
  r = C.applyOp(r.blob, op); assert.strictEqual(r.result, "skipped-already-applied"); assert.strictEqual(r.blob.x.length, 2);
  assert.strictEqual(C.applyOp({ x: [A, A, A, A, A] }, op).result, "conflict");
});
test("legacy delete of a row that is not in the list is refused when making the op", () =>
  assert.throws(() => C.makeDeleteLegacyOp("x", [{ a: 1 }], { a: 2 }, T0)));

// ---------- replace-list (forms not migrated yet) ----------
test("replaceKey: applies when the list is as I last saw it; replay skipped; changed elsewhere -> conflict", () => {
  const seen = [{ a: 1 }]; const op = C.makeReplaceKeyOp("payables", seen, [{ a: 1 }, { a: 2 }], T0);
  let r = C.applyOp({ payables: seen }, op); assert.strictEqual(r.result, "applied");
  assert.strictEqual(C.applyOp(r.blob, op).result, "skipped-already-applied");
  const c = C.applyOp({ payables: [{ a: 1 }, { a: 99 }] }, op);
  assert.strictEqual(c.result, "conflict"); assert.deepStrictEqual(c.blob.payables, [{ a: 1 }, { a: 99 }]);
});
test("replaceKey on a list that did not exist yet", () => {
  const op = C.makeReplaceKeyOp("expansionLog", undefined, [{ n: 1 }], T0);
  assert.strictEqual(C.applyOp({}, op).result, "applied");
});

// ---------- purity ----------
test("applyOp never mutates its input (every operation type)", () => {
  const A = { d: 1 };
  const blob = { dailyLogs: [rec("A"), rec("B")], x: [A, A], payables: [{ a: 1 }], _meta: { revision: 2, deleted: [] } };
  const before = frozen(blob);
  [C.makeAddOp("dailyLogs", rec("Z"), T0), C.makeDeleteByIdOp("dailyLogs", "A", T0), C.makeDeleteLegacyOp("x", blob.x, A, T0),
   C.makeAddLegacyOp("x", blob.x, A, T0), C.makeReplaceKeyOp("payables", blob.payables, [], T0)].forEach((op) => C.applyOp(blob, op));
  assert.strictEqual(frozen(blob), before);
});
test("ops are immutable snapshots: editing the original record afterwards does not change the queued op", () => {
  const r = rec("Q"); const op = C.makeAddOp("dailyLogs", r, T0); r.salesIn = 123456;
  assert.strictEqual(op.record.salesIn, 100);
});
test("unknown operation type is refused", () => assert.throws(() => C.applyOp({}, { type: "nope", category: "x" })));

// ---------- revision ----------
test("revision: legacy has none; next is 1; then +1; other data and keys preserved; input untouched", () => {
  const legacy = { dailyLogs: [rec("A")], _meta: { lastSavedAt: "old", lastSavedBy: "Dad" } };
  assert.strictEqual(C.getRevision(legacy), null);
  const n1 = C.nextBlob(legacy, T0, "Mom"); assert.strictEqual(C.getRevision(n1), 1);
  assert.strictEqual(n1._meta.lastSavedBy, "Mom"); assert.strictEqual(n1.dailyLogs.length, 1);
  assert.strictEqual(C.getRevision(C.nextBlob({ _meta: { revision: 41 } }, T0, "x")), 42);
  assert.strictEqual(C.getRevision(legacy), null);
  assert.strictEqual(C.getRevision({ _meta: { revision: "3" } }), null); // only whole numbers count
});
test("casCondition: 'is null' for legacy, exact revision text otherwise", () => {
  assert.deepStrictEqual(C.casCondition({ _meta: {} }), { mode: "is-null" });
  assert.deepStrictEqual(C.casCondition({ _meta: { revision: 7 } }), { mode: "eq", value: "7" });
});
test("detectOldClientWrite: flags dropped or lower revision", () => {
  assert.strictEqual(C.detectOldClientWrite(5, { _meta: {} }), "revision-missing");
  assert.strictEqual(C.detectOldClientWrite(5, { _meta: { revision: 3 } }), "revision-regressed");
  assert.strictEqual(C.detectOldClientWrite(5, { _meta: { revision: 6 } }), "ok");
  assert.strictEqual(C.detectOldClientWrite(null, { _meta: {} }), "ok");
});

// ---------- rebase ----------
test("rebase: others' entries and my pending entries are both shown; none duplicated", () => {
  const server = { dailyLogs: [rec("S1"), rec("S2")] };
  const mine = [C.makeAddOp("dailyLogs", rec("M1"), T0), C.makeAddOp("dailyLogs", rec("S2"), T0)]; // S2 already synced
  const r = C.rebase(server, mine);
  assert.deepStrictEqual(r.blob.dailyLogs.map((x) => x.id), ["S1", "S2", "M1"]);
  assert.deepStrictEqual(r.results.map((x) => x.result), ["applied", "skipped-already-applied"]);
});
test("rebase: a conflicting pending op is reported and left out, later ops still apply", () => {
  const A = { d: 1 };
  const bad = C.makeDeleteLegacyOp("x", [A, A], A, T0);
  const good = C.makeAddOp("dailyLogs", rec("G"), T0);
  const r = C.rebase({ x: [A, A, A], dailyLogs: [] }, [bad, good]);
  assert.deepStrictEqual(r.results.map((x) => x.result), ["conflict", "applied"]);
  assert.strictEqual(r.blob.x.length, 3); assert.strictEqual(r.blob.dailyLogs.length, 1);
});

// ---------- retry schedule ----------
test("backoff: 2s, 5s, 15s, 60s, then 5 min, within +-20%; attention after 8 tries", () => {
  const mid = () => 0.5;
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6, 20].map((n) => C.backoffMs(n, mid)), [2000, 5000, 15000, 60000, 300000, 300000, 300000]);
  assert.strictEqual(C.backoffMs(1, () => 0), 1600); assert.strictEqual(C.backoffMs(5, () => 1), 360000);
  assert(!C.needsAttention(7) && C.needsAttention(8));
});

// ---------- randomised simulation: 3 phones, lost replies, duplicate delivery, cross-phone deletes ----------
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function simulate(seed) {
  const rnd = mulberry32(seed); let server = { dailyLogs: [], _meta: {} };
  const phones = [[], [], []], records = new Map(), intentDeleted = new Set(); let n = 0;
  const deliver = (i) => {
    const op = phones[i][0]; server = C.applyOp(server, op).blob;
    if (rnd() >= 0.3) phones[i].shift();                       // 30%: the reply is lost, the phone will send the same op again
  };
  const steps = 40 + Math.floor(rnd() * 80);
  for (let s = 0; s < steps; s++) {
    const p = Math.floor(rnd() * 3), a = rnd();
    if (a < 0.4) { const r = rec("id" + n++, { v: Math.floor(rnd() * 1000) }); records.set(r.id, r); phones[p].push(C.makeAddOp("dailyLogs", r, T0)); }
    else if (a < 0.55) {
      const ids = server.dailyLogs.map((x) => x.id).filter((id) => !intentDeleted.has(id));
      if (ids.length) { const id = ids[Math.floor(rnd() * ids.length)]; intentDeleted.add(id); phones[p].push(C.makeDeleteByIdOp("dailyLogs", id, T0)); }
    } else { const c = [0, 1, 2].filter((i) => phones[i].length); if (c.length) deliver(c[Math.floor(rnd() * c.length)]); }
  }
  let guard = 0;
  while (phones.some((q) => q.length) && guard++ < 100000) deliver([0, 1, 2].filter((i) => phones[i].length)[0]);
  const ids = server.dailyLogs.map((x) => x.id);
  assert.strictEqual(new Set(ids).size, ids.length, "duplicate id on server (seed " + seed + ")");
  const expected = [...records.keys()].filter((id) => !intentDeleted.has(id)).sort();
  assert.deepStrictEqual([...ids].sort(), expected, "lost or resurrected entry (seed " + seed + ")");
  server.dailyLogs.forEach((x) => assert.deepStrictEqual(x, records.get(x.id), "content changed (seed " + seed + ")"));
}
test("SIMULATION 4000 runs: 3 phones, lost replies, retries, cross-phone deletes -> nothing lost, duplicated, resurrected or altered", () => {
  for (let seed = 1; seed <= 4000; seed++) simulate(seed);
});

function simulateLegacy(seed) {
  const rnd = mulberry32(seed + 90000); const pool = [0, 1, 2, 3].map((k) => ({ date: "2026-10-0" + (k + 1), salesIn: 10 * (k + 1) }));
  let server = { dailyLogs: [] }; const model = [];
  for (let i = 0; i < 6; i++) { const r = pool[Math.floor(rnd() * 4)]; server.dailyLogs.push({ ...r }); model.push(C.fingerprint(r)); }
  for (let s = 0; s < 25; s++) {                                // ONE phone: operations are sent one at a time, each possibly several times
    const r = pool[Math.floor(rnd() * 4)], fp = C.fingerprint(r); let op;
    if (rnd() < 0.5 && model.includes(fp)) { op = C.makeDeleteLegacyOp("dailyLogs", server.dailyLogs, r, T0); model.splice(model.indexOf(fp), 1); }
    else { op = C.makeAddLegacyOp("dailyLogs", server.dailyLogs, r, T0); model.push(fp); }
    const sends = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < sends; k++) { const res = C.applyOp(server, op); assert.notStrictEqual(res.result, "conflict", "unexpected conflict (seed " + seed + ")"); server = res.blob; }
  }
  assert.deepStrictEqual(server.dailyLogs.map(C.fingerprint).sort(), model.slice().sort(), "legacy rows drifted (seed " + seed + ")");
}
test("SIMULATION 4000 runs: legacy rows with identical copies, repeated sends -> exact counts, never a second delete or add", () => {
  for (let seed = 1; seed <= 4000; seed++) simulateLegacy(seed);
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
