import { TuplifyUnion } from "@fxts/core/dist/types/types/ExcludeObject";
import Head from "@fxts/core/dist/types/types/Head";
import Tail from "@fxts/core/dist/types/types/Tail";

/**
 * 이터러블 뽑는 코드
 * @param iter
 * @returns
 */
export function* iter<T>(iter: IterableIterator<T>) {
  for (const value of iter) {
    yield value;
  }
}

export function* prevIter<T>(iter: IterableIterator<T>) {
  yield "start";
  for (const value of iter) {
    yield value;
    yield value;
  }
  yield "end";
}

export function* combinationIter<T>(iter: IterableIterator<T>) {
  for (const prev of iter) {
    // const start = iter[Symbol.iterator]().next();
    const current = iter.next();
    yield {
      prev: prev as T,
      current: current.value as T,
    };
  }
}

/**
 * iter인 input 기반으로 계산해서 value를 확장하는 코드
 * @param fn
 * @returns
 */
export const objectExtendIterGenerator = <T, P>(fn: (input: T) => P) => {
  return function* (iter: IterableIterator<T>) {
    for (const value of iter) {
      yield {
        ...value,
        ...fn(value),
      };
    }
  };
};

/**
 * 실행된 함수의 결과만 반환하는 함수를 만드는 커링
 */
export const objectIterGenerator = <T, P>(fn: (input: T) => P) => {
  return function* (iter: IterableIterator<T>) {
    for (const value of iter) {
      yield fn(value);
    }
  };
};

/** async 을 쓸때 주의할 것은 */
export const objectIterGenerator2 = <T, P>(
  fn: (input: T) => Promise<P> | P
) => {
  return async function* (
    iter: AsyncIterableIterator<T> | IterableIterator<T>
  ): AsyncGenerator<P, void, unknown> {
    for await (const value of iter) {
      yield await fn(value);
    }
  };
};

/**
 * 실행된 함수의 결과만
 */
export const asyncFunctionIterGenerator = <T, P>(
  fn: (input: T) => Promise<P> | P
) => {
  return async function* (iter: IterableIterator<T>) {
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
    a != null &&
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

export async function* asyncIter<T>(
  iter: AsyncIterableIterator<T> | AsyncIterable<T>
): AsyncGenerator<T, void, unknown> {
  for await (const value of iter) {
    yield value;
  }
}

// Helper function to check if a value is a Promise
// function isPromise<T>(value: any): value is Promise<T> {
//   return value && typeof value.then === 'function';
// }

// Usage example
export async function* processAsyncIter<T>(
  iter: AsyncIterableIterator<Promise<T> | T>
): AsyncGenerator<T, void, unknown> {
  for await (const value of asyncIter(iter)) {
    yield isPromise(value) ? await value : value;
  }
}

// processAsyncIter 사용 예시
// const a = pipe(getAll2(), testFn, take(Infinity));

// for await (const value of processAsyncIter(a)) {
//   console.log(value);
// }

export const asyncIterGenerator = <T, P>(fn: (input: T) => P) => {
  return function* (iter: IterableIterator<Promise<T> | T>) {
    for (const value of iter) {
      yield isPromise(value) ? value.then((res) => fn(res)) : fn(value);
    }
  };
};

// export const asyncObjectExtendIterGenerator = <T, P>(fn: (input: T) => P) => {
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
