export const safeNumberConversion = (input: string) => {
  // 입력이 문자열이 아니면 그대로 반환
  if (typeof input !== "string") {
    return input;
  }

  // 문자열이 숫자로만 구성되어 있는지 확인 (양수, 음수, 소수점 허용)
  const numberRegex = /^-?\d+(\.\d+)?$/;

  if (numberRegex.test(input)) {
    // 숫자로만 구성된 경우, Number 함수를 사용하여 변환
    return Number(input);
  } else {
    // 숫자가 아닌 문자가 포함된 경우, 원래 문자열 반환
    return input;
  }
};

/** input이 숫자로 바꿨을 때 숫자면 true */
export const typeofNumber = (input: string) => {
  return typeof safeNumberConversion(input) === "number";
};

// -_ 잡아서 스플릿해서 파스칼로
export const pascal = (text: string) =>
  text
    .split(/[-_]/) // 수정: - 또는 _로 스플릿
    .map((t, index) => {
      return t.charAt(0).toUpperCase() + t.slice(1);
      return t;
    })
    .join("");

// -_ 잡아서 스플릿해서 카멜로 수정
export const camel = (text: string) =>
  text
    .split(/[-_]/) // 수정: - 또는 _로 스플릿
    .map((t, index) => {
      if (index > 0) return t.charAt(0).toUpperCase() + t.slice(1);
      return t;
    })
    .join("");

/** svg-color-1 이 들어왔을 때, s */
export const varToName = (input: string) => {
  return input.split("-").slice(1).join("");
};
