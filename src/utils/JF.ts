import { TuplifyUnion } from "@fxts/core/dist/types/types/ExcludeObject";
import Head from "@fxts/core/dist/types/types/Head";
import Tail from "@fxts/core/dist/types/types/Tail";

/**
 * 이터러블 뽑는 코드
 * @param iter
 * @returns
 */
export function* iter<T>(iter: Iterable<T>) {
  for (const value of iter) {
    yield value;
  }
}

/**
 * iter인 input 기반으로 계산해서 value를 확장하는 코드
 * @param fn
 * @returns
 */
export const objectExtendIterGenarator = <T, P>(fn: (input: T) => P) => {
  return function* (iter: Iterable<T>) {
    for (const value of iter) {
      yield {
        ...value,
        ...fn(value),
      };
    }
  };
};

export const asyncFunctionIterGenarator = <T, P>(
  fn: (input: T) => Promise<P> | P
) => {
  return async function* (iter: Iterable<T>) {
    for await (const value of iter) {
      let result = await fn(value);
      yield { ...value, ...result };
    }
  };
};

function* PromiseUnPack(list: PromiseSettledResult<any>[]) {
  for (const item of list) {
    if (item.status === "fulfilled") yield item.value;
    else yield item;
  }
}

export const isPromise = <T>(a: T | Promise<T>): a is Promise<T> => {
  if (a instanceof Promise) {
    return true;
  }

  if (
    a !== null &&
    typeof a === "object" &&
    //@ts-ignore
    typeof a.then === "function" &&
    //@ts-ignore
    typeof a.catch === "function"
  ) {
    return true;
  }
  return false;
};

const values = Promise.all([]);

export const asyncIterGenarator = <T, P>(fn: (input: T) => P) => {
  return function* (iter: Iterable<Promise<T> | T>) {
    for (const value of iter) {
      console.log(value);
      yield isPromise(value) ? value.then((res) => fn(res)) : fn(value);
    }
  };
};

// export const asyncObjectExtendIterGenarator = <T, P>(fn: (input: T) => P) => {
//   return function* (iter: Iterable<Promise<T>>) {
//     for (const value of iter) {
//       console.log(typeof value);
//       yield value.then((res) => fn(res));
//     }
//   };
// };

// import type Awaited from "./Awaited";
// import type { TuplifyUnion } from "./ExcludeObject";
// import type Head from "./Head";
// import type Tail from "./Tail";

type HasPromise<T extends any[]> =
  Head<T> extends never
    ? false
    : Head<T> extends Promise<unknown>
      ? true
      : T["length"] extends 0
        ? false
        : HasPromise<Tail<T>>;
// type PossiblyHasPromise<T extends any[]> = Head<T> extends never ? false : HasPromise<TuplifyUnion<Head<T>>> extends true ? true : T["length"] extends 0 ? false : PossiblyHasPromise<Tail<T>>;
// type PipeLast<T extends any[]> = T["length"] extends 0 ? undefined : T["length"] extends 1 ? Head<T> : Awaited<T[1]> extends never ? never : PipeLast<Tail<T>>;
