//@ts-nocheck
export const log = log;

type AnyFn = (...args: any) => any;

// export const curryOrigin  =
//   (f) =>
//   (a, ..._) =>
//     _.length ? f(a, ..._) : (..._) => f(a, ..._);
export const curry: <T extends AnyFn>(f: T) => (a: any, ...args: any) => any =
  (f) =>
  (a, ..._) =>
    _.length ? f(a, ..._) : (..._: any) => f(a, ..._);

export const isIterable = (a: any) => a && a[Symbol.iterator];

export const go1 = (a: any, f: AnyFn) =>
  a instanceof Promise ? a.then(f) : f(a);

export const reduceF = (acc: any, a: any, f: AnyFn) =>
  a instanceof Promise
    ? a.then(
        (a) => f(acc, a),
        (e) => (e == nop ? acc : Promise.reject(e))
      )
    : f(acc, a);

export const head = (iter: Iterable<any>) => go1(take(1, iter), ([h]) => h);

export const reduce = curry((f, acc, iter) => {
  if (!iter) return reduce(f, head((iter = acc[Symbol.iterator]())), iter);
  iter = iter[Symbol.iterator]();
  return go1(acc, function recur(acc) {
    let cur;
    while (!(cur = iter.next()).done) {
      acc = reduceF(acc, cur.value, f);
      if (acc instanceof Promise) return acc.then(recur);
    }
    return acc;
  });
});

export const go = (...args: any) => reduce((a, f) => f(a), args);

export const pipe =
  (f, ...fs) =>
  (...as) =>
    go(f(...as), ...fs);

export const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  return (function recur() {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;
      if (a instanceof Promise) {
        return a
          .then((a) => ((res.push(a), res).length == l ? res : recur()))
          .catch((e) => (e == nop ? recur() : Promise.reject(e)));
      }
      res.push(a);
      if (res.length == l) return res;
    }
    return res;
  })();
});

export const takeAll = take(Infinity);

export const L = {};

L.range = function* (l) {
  let i = -1;
  while (++i < l) yield i;
};

L.map = curry(function* (f, iter) {
  for (const a of iter) {
    yield go1(a, f);
  }
});

export const nop = Symbol("nop");

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    const b = go1(a, f);
    if (b instanceof Promise)
      yield b.then((b) => (b ? a : Promise.reject(nop)));
    else if (b) yield a;
  }
});

L.entries = function* (obj) {
  for (const k in obj) yield [k, obj[k]];
};

L.flatten = function* (iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* a;
    else yield a;
  }
};

L.deepFlat = function* f(iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* f(a);
    else yield a;
  }
};

L.flatMap = curry(pipe(L.map, L.flatten));

export const map = curry(pipe(L.map, takeAll));

export const filter = curry(pipe(L.filter, takeAll));

export const find = curry((f, iter) =>
  go(iter, L.filter(f), take(1), ([a]) => a)
);

export const flatten = pipe(L.flatten, takeAll);

export const flatMap = curry(pipe(L.map, flatten));

export const add = (a, b) => a + b;

export const range = (l) => {
  let i = -1;
  let res = [];
  while (++i < l) {
    res.push(i);
  }
  return res;
};
