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

export const asyncIterGenarator = <T, P>(fn: (input: T) => Promise<P> | P) => {
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
