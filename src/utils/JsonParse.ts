// 백터는 서치에서 빼는게 좋을 것 같음
// 인스턴스는 쓸 수도 있어서 제외함
// 아니면 세션이랑 컴포넌트만 서치하는 것도 괜찮음
// 어짜피 그 외는 취급 안할꺼니까

import { asyncIter, asyncIterGenerator, iter } from "./JF";

// "DOCUMENT","PAGE",를 뺀 건   figma.currentPage.selection 호환을 위해
const selectType = ["SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE"];
const childrenIgnoreType = ["COMPONENT", "COMPONENT_SET", "INSTANCE"];

export type DeepNode = { node: BaseNode; path: string };
/** 오로지 내부 식별용 유니크한 구분자 */
export const testSymbol = "\u25AA";
// 좀 더 모듈화 해봄
/**
 * 대상 객체 내부 순회
 */
export function* PathDeepTraverse({
  node,
  path,
}: DeepNode): IterableIterator<DeepNode> {
  // 현재 노드 방문
  yield {
    node,
    path,
  };
  // 자식 노드가 존재하는 경우
  if ("children" in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색
    for (let i = 0; i < node.children.length; i++) {
      yield* PathDeepTraverse({
        node: node.children[i],
        path: path + testSymbol + i,
      });
    }
  }
}

// 이터러블을 실행하는 pipe
// await이 호환되야하고 그럼에도 실행 자체는 병렬 지향..

// 이터러블 중에 본인의 이전 값을 얻고자할 때
// 이터러블 중에 본인의 이전 값에 접근하면 되는 부분
// 함수니까 스코프 달면 되지 않을까
// 내부적으로 주소가 같다고 가정했을 때 순서는 변하지 않고 작업 단계에 대해서 관리시키면서 인덱싱하면
// 자신의 이전 단계를 인덱싱 기반으로 ... 얻을 수 있지 않을까

//

// pipe in pipe 를 구축 가능한가?
// promise pipe 를 넣을 수 있나

// 파이프에 넣고 싶었는데 out of memory 뜸
export const getAll = () => {
  const promise = figma.root.children.map(async (page) => {
    // PageNodes are the only children of root
    await page.loadAsync();
    console.log("page", page);
    if (page.name.includes(":")) {
      figma.notify("page 이름에 : 이 있을 경우 -로 대체 됩니다");
      page.name = page.name.replace(/:/g, "-");
    }
    return { node: page, path: page.name };
    // const data = (await page.exportAsync({
    //   format: "JSON_REST_V1",
    // })) ;
  });
  return asyncIter(promise);
};

// 문법 오류 코드
// export function* getAll2() {
//   figma.root.children.forEach((page) => {
//     page.loadAsync().then(() => {
//       yield({ node: page, path: page.name });
//     });
//   });
// }

export async function* getAll2() {
  for (const page of figma.root.children) {
    await page.loadAsync();
    yield { node: page, path: page.name };
  }
}
