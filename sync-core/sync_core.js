"use strict";
/*
 * sync_core.js - Phase 2, step 2b. PURE LOGIC ONLY.
 * No DOM, no network, no storage, no timers. NOT loaded by index.html (it will be pasted into
 * the single-file app in a later step, behind the per-device switch, default off).
 *
 * What is here: ids, content fingerprints for legacy rows, operations (add / delete / legacy
 * add+delete / replace-list), applying an operation to a copy of the shared data idempotently,
 * revision helpers, "server data + pending operations" rebase, and the retry schedule.
 *
 * Rules every function follows: never mutates its inputs, never guesses. Anything ambiguous
 * returns result "conflict" so a later step can raise an Issue instead of changing financial data.
 */

const TOMBSTONE_LIMIT = 200; // recent deletions remembered in _meta.deleted
const BACKOFF_STEPS = [2000, 5000, 15000, 60000, 300000];
const ATTENTION_AFTER = 8;

function deepClone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}
function nowIso() {
  return new Date().toISOString();
}

// ---- ids -------------------------------------------------------------------------------
function newId(cryptoObj) {
  const c = cryptoObj || (typeof crypto !== "undefined" ? crypto : null);
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join("-");
}

// ---- fingerprints (legacy rows have no id) ----------------------------------------------
// The fingerprint is the exact canonical text of the row (keys sorted), not a hash, so two
// different rows can never be mistaken for each other.
function canonicalJson(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(v[k])).join(",") + "}";
}
const fingerprint = canonicalJson;

// Short hash, used only to notice that a whole list changed (replace-list operations).
function hashString(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16) + ":" + str.length;
}

function countMatching(list, fp) {
  return (list || []).filter((r) => fingerprint(r) === fp).length;
}
const isLegacy = (record) => !record || record.id === undefined || record.id === null;

// ---- operations -------------------------------------------------------------------------
function makeAddOp(category, record, now) {
  if (isLegacy(record)) throw new Error("add needs a record with an id");
  return { opId: newId(), type: "add", category, record: deepClone(record), createdAt: now || nowIso() };
}
function makeDeleteByIdOp(category, id, now) {
  if (!id) throw new Error("delete needs an id");
  return { opId: newId(), type: "delete", category, id, createdAt: now || nowIso() };
}
// `list` = the list as the user saw it when they acted.
function makeDeleteLegacyOp(category, list, record, now) {
  const fp = fingerprint(record);
  const count = countMatching(list, fp);
  if (count < 1) throw new Error("row not found in the list");
  return { opId: newId(), type: "deleteLegacy", category, fp, expectCount: count, createdAt: now || nowIso() };
}
function makeAddLegacyOp(category, list, record, now) {
  const fp = fingerprint(record);
  return { opId: newId(), type: "addLegacy", category, record: deepClone(record), fp, expectCount: countMatching(list, fp), createdAt: now || nowIso() };
}
function makeReplaceKeyOp(category, baseValue, newValue, now) {
  const base = baseValue === undefined ? [] : baseValue;
  return { opId: newId(), type: "replaceKey", category, baseHash: hashString(canonicalJson(base)), value: deepClone(newValue), createdAt: now || nowIso() };
}

// ---- applying an operation to a COPY of the shared data ----------------------------------
function addTombstone(blob, id, at) {
  blob._meta = blob._meta && typeof blob._meta === "object" ? blob._meta : {};
  const d = Array.isArray(blob._meta.deleted) ? blob._meta.deleted : [];
  d.push({ id, at });
  blob._meta.deleted = d.slice(-TOMBSTONE_LIMIT);
}
function isTombstoned(blob, id) {
  const d = blob._meta && blob._meta.deleted;
  return Array.isArray(d) && d.some((t) => t.id === id);
}

/*
 * Returns { blob, result, reason }. `blob` is always a fresh copy (unchanged when nothing applied).
 * result: "applied" | "skipped-already-applied" | "skipped-target-missing" | "skipped-deleted" | "conflict"
 */
function applyOp(blob, op) {
  const out = deepClone(blob) || {};
  const done = (result, reason) => ({ blob: out, result, reason: reason || "" });
  const cat = op.category;
  if (op.type === "replaceKey") {
    const cur = out[cat] === undefined ? [] : out[cat];
    const curHash = hashString(canonicalJson(cur));
    if (curHash === op.baseHash) { out[cat] = deepClone(op.value); return done("applied"); }
    if (curHash === hashString(canonicalJson(op.value))) return done("skipped-already-applied");
    return done("conflict", "list changed elsewhere");
  }
  if (out[cat] !== undefined && !Array.isArray(out[cat])) return done("conflict", "not a list");
  const list = out[cat] || (out[cat] = []);

  switch (op.type) {
    case "add": {
      const existing = list.find((r) => r && r.id === op.record.id);
      if (existing) {
        return canonicalJson(existing) === canonicalJson(op.record)
          ? done("skipped-already-applied")
          : done("conflict", "same id, different content");
      }
      if (isTombstoned(out, op.record.id)) return done("skipped-deleted", "deleted elsewhere before it synced");
      list.push(deepClone(op.record));
      return done("applied");
    }
    case "delete": {
      const idx = list.findIndex((r) => r && r.id === op.id);
      if (idx < 0) return done("skipped-target-missing");
      list.splice(idx, 1);
      addTombstone(out, op.id, op.createdAt);
      return done("applied");
    }
    case "deleteLegacy": {
      const count = countMatching(list, op.fp);
      if (count === op.expectCount) {
        list.splice(list.findIndex((r) => fingerprint(r) === op.fp), 1);
        return done("applied");
      }
      if (count === op.expectCount - 1) return done("skipped-already-applied");
      return done("conflict", "identical-row count changed elsewhere");
    }
    case "addLegacy": {
      const count = countMatching(list, op.fp);
      if (count === op.expectCount) { list.push(deepClone(op.record)); return done("applied"); }
      if (count === op.expectCount + 1) return done("skipped-already-applied");
      return done("conflict", "identical-row count changed elsewhere");
    }
    default:
      throw new Error("unknown operation type: " + op.type);
  }
}

// "Server data + my pending operations": what the screen should show. Operations that
// conflict are left out of the view and reported, never silently forced in.
function rebase(serverBlob, pendingOps) {
  let blob = deepClone(serverBlob) || {};
  const results = [];
  for (const op of pendingOps) {
    const r = applyOp(blob, op);
    blob = r.blob;
    results.push({ opId: op.opId, result: r.result, reason: r.reason });
  }
  return { blob, results };
}

// ---- revision (compare-and-swap) -----------------------------------------------------------
function getRevision(blob) {
  const r = blob && blob._meta && blob._meta.revision;
  return Number.isInteger(r) && r >= 0 ? r : null;
}
// The data to write: same content, revision + 1. `blob` is what we last read from the server.
function nextBlob(blob, now, user) {
  const out = deepClone(blob) || {};
  const rev = getRevision(out);
  out._meta = Object.assign({}, out._meta, { lastSavedAt: now, lastSavedBy: user, revision: (rev === null ? 0 : rev) + 1 });
  return out;
}
// How the update must be conditioned: legacy rows without a revision use "is null".
function casCondition(readBlob) {
  const r = getRevision(readBlob);
  return r === null ? { mode: "is-null" } : { mode: "eq", value: String(r) };
}
// Spot writes made by older app versions (they replace _meta and drop the revision).
function detectOldClientWrite(expectedRevision, serverBlob) {
  if (expectedRevision === null || expectedRevision === undefined) return "ok";
  const sr = getRevision(serverBlob);
  if (sr === null) return "revision-missing";
  if (sr < expectedRevision) return "revision-regressed";
  return "ok";
}

// ---- retry schedule ------------------------------------------------------------------------
function backoffMs(attempt, rand) {
  const r = rand || Math.random;
  const base = BACKOFF_STEPS[Math.min(Math.max(attempt, 1), BACKOFF_STEPS.length) - 1];
  return Math.round(base * (0.8 + 0.4 * r()));
}
const needsAttention = (attempts) => attempts >= ATTENTION_AFTER;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TOMBSTONE_LIMIT, deepClone, newId, canonicalJson, fingerprint, hashString, countMatching, isLegacy,
    makeAddOp, makeDeleteByIdOp, makeDeleteLegacyOp, makeAddLegacyOp, makeReplaceKeyOp,
    applyOp, rebase, getRevision, nextBlob, casCondition, detectOldClientWrite, backoffMs, needsAttention,
  };
}
