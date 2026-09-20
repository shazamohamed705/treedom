import { useState, useEffect } from "react";

const favs = new Set();
const subs = new Set();

function emit() { subs.forEach(fn => fn()); }

export function setFav(id, on) {
  const v = String(id ?? "");
  if (!v) return;
  if (on) favs.add(v); else favs.delete(v);
  emit();
}

export function isFav(id) { return favs.has(String(id ?? "")); }

export function seedFavs(ids) {
  let changed = false;
  (ids ?? []).forEach(i => {
    const v = String(i ?? "");
    if (v && !favs.has(v)) { favs.add(v); changed = true; }
  });
  if (changed) emit();
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function useFavStore() {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force(x => x + 1)), []);
  return favs;
}