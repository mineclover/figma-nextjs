export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// 함수의 첫 번째 매개변수 타입을 추출하는 유틸리티 타입
export type FirstParameter<T extends (...args: any) => any> = T extends (
  first: infer P,
  ...args: any
) => any
  ? P
  : never;

// 첫번째 제네릭으로 넘어온 객체의 전체 타입 추론
export type ExtractProps<T, K extends keyof T> = T[K] extends (
  props: infer P
) => any
  ? P
  : never;
