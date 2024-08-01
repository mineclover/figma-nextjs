// 백터는 서치에서 빼는게 좋을 것 같음
// 인스턴스는 쓸 수도 있어서 제외함
// 아니면 세션이랑 컴포넌트만 서치하는 것도 괜찮음
// 어짜피 그 외는 취급 안할꺼니까

import { figmaProgress, notify } from "../FigmaPluginUtils";
import { asyncIter, asyncIterGenerator, iter } from "./JF";
import { sleep } from "./promise";

// "DOCUMENT","PAGE",를 뺀 건   figma.currentPage.selection 호환을 위해
const selectType = ["SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE"];
const childrenIgnoreType = ["COMPONENT", "COMPONENT_SET", "INSTANCE"];

// figmaID, realName, documentPath, path
export type DetailPaths = {
  /** 피그마 아이디로 구성 */
  figmaID: string;
  /** 실제 이름 */
  realName: string;
  /** 도큐먼트 용 이름 > 공백 제거 */
  documentPath: {
    origin: string;
    path: string;
  };
  /** 실제 경로 > 공백 변형 */
  path: string;
};

const nullPaths = {
  /** 피그마 아이디로 구성 */
  figmaID: "",
  /** 실제 이름 */
  realName: "",
  /** 도큐먼트 용 이름 > 공백 제거 */
  documentPath: {
    path: "",
    origin: "",
  },
  /** 실제 경로 > 공백 변형 */
  path: "",
};
export type DeepNode = { node: BaseNode; path: DetailPaths };
/** 오로지 내부 식별용 유니크한 구분자 */

export const slashSymbol = "\u25AA";

export const sectionSymbol = "\u203D";
// 🔄
export const syncSymbol = "\u{1F504}";

// 좀 더 모듈화 해봄

export const symbolJoin = (...args: string[]) => {
  const arr = args.filter((text) => text != null || text === "");
  return arr.join(slashSymbol);
};

export const pathJoin = (...args: string[]) => {
  const arr = args.filter((text) => {
    return text != null && text !== "";
  });
  const result = arr.join("/");

  return result;
};

/**
 * 대상 객체 내부 순회 1초 딜레이
 */
export async function* delayPathDeepTraverse({
  node,
  path,
}: DeepNode): AsyncIterableIterator<DeepNode> {
  // }: DeepNode): IterableIterator<DeepNode> {
  // 현재 노드 방문
  figmaProgress("pathDeepTraverse");
  await sleep(1001);
  yield {
    node,
    path,
  };
  // 자식 노드가 존재하는 경우
  if ("children" in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색
    for (let i = 0; i < node.children.length; i++) {
      yield* delayPathDeepTraverse({
        node: node.children[i],
        path: detailPathExtend(node.children[i], path, i),
        // path: path + testSymbol + i,
      });
    }
  }
}

export function* pathDeepTraverse({
  node,
  path,
}: DeepNode): IterableIterator<DeepNode> {
  yield {
    node,
    path,
  };
  // 자식 노드가 존재하는 경우
  if ("children" in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색
    for (let i = 0; i < node.children.length; i++) {
      yield* pathDeepTraverse({
        node: node.children[i],
        path: detailPathExtend(node.children[i], path, i),
        // path: path + testSymbol + i,
      });
    }
  }
}

/**
 * 이름 저장 규칙, page, section, 이거나 이름에 # 붙였으면 파싱함
 * @param node
 * @returns
 */
const documentValid = (node: BaseNode) => {
  const type = node.type;
  const name = node.name.trim();
  // 섹션 페이지 도큐먼트는 이름을 그대로 씀
  if (type === "DOCUMENT") {
    return name;
  }

  if (type === "PAGE") {
    return name;
  }
  if (type === "SECTION") {
    return sectionSymbol + name;
  }

  // 그냥 접두사 # 거나 / 면
  if (name.startsWith("#") || name.startsWith("/")) {
    return name;
  }
  // 괄호 쳐져 있으거나 언더바가 앞에 있으면
  //  원래  처리해야하는데 그러려면 section에도 둬야해서 분리하기로 함
  // else if (
  //   name.startsWith("_") ||
  //   (name.startsWith("(") && name.endsWith(")"))
  // ) {
  //   return "";
  // }
  return "";
};

/**
 * 1. 괄호 치거나 앞에 _ 넣으면 생략하기로 했는데 그 컨벤션을 쓰는 경우가 종종 있긴 해서 ( 괄호는 써도 되는걸로 )
 * 2. _ 하나는 있을 수도 있으니
 * @param path
 * @returns
 */
const pathValid = (path: string) => {
  const temp1 = path.split(slashSymbol).map((t) => {
    const temp11 = t.trim();
    const temp12 = temp11.replace(/\s/g, "-").toLowerCase();
    return temp12;
  });

  const temp2 = temp1
    .filter(
      // _로 시작하거나 괄호가 감싸져 있으면 false
      (t) => {
        if (t.startsWith("__")) {
          return false;
        }
        // if (t.startsWith("(") && t.endsWith(")")) {
        //   return false;
        // }
        if (t === "") return false;
        return true;
      }
    )
    .join("/");

  console.log(temp1, temp2);
  return temp2;
};

/** 경로 파싱 */
const upPathTraverse = (node: BaseNode, path: string) => {
  const parent = node.parent;
  if (parent) {
    const name = documentValid(parent);
    return upPathTraverse(parent, symbolJoin(name, path));
  }
  return path;
};

const upIdTraverse = (node: BaseNode, path: string) => {
  const parent = node.parent;
  if (parent) {
    const name = parent.id;
    return upIdTraverse(parent, symbolJoin(name, path));
  }
  return path;
};

/** origin parser */
const originClear = (path: string) => {
  return path
    .split(slashSymbol)
    .map((t) => t.trim())
    .filter((t) => t !== "")
    .join(slashSymbol);
};

export const detailPathExtend = (
  node: BaseNode,
  path?: DetailPaths,
  index?: number
): DetailPaths => {
  const indexValue = typeof index === "number" ? String(index) : "0";

  const documentPath = documentValid(node);
  const up = upPathTraverse(node, documentPath);
  const upId = upIdTraverse(node, node.id);
  const current = {
    figmaID: upId,
    /** 경로로 앞이 채워지기 전 이름을 얻을 수 있어야됨
     * 현재 이름에 상위 경로 이름 제거하면 됨
     * TODO: ㅇㅇ
     * 이건 상위 이름만 받는 함수로 만들어서 이름에 상위 이름을 때는 구조로 해야함
     *
     */
    realName: node.name,
    /** 도큐먼트 용 이름 > origin: 컴포넌트용, path: 문서용
     * 자잘한거 무시하고 section이랑 이름으로 경로를 판단하므로 지금 방식이 맞다
     */
    documentPath: {
      path: pathValid(up),
      origin: originClear(up),
    },
    /** 실제 경로 > 공백 변형 */
    path: indexValue,
  };

  if (path) {
    // const next = pathJoin(path.documentPath, current.documentPath);

    return {
      figmaID: upId,
      /** 실제 이름 */
      realName: symbolJoin(path.realName, current.realName),
      /** 도큐먼트 용 이름 > 공백 제거 */
      documentPath: {
        //TODO: origin은 차후 피그마 경로를 위한 세션 경로 파싱 후 컴포넌트 이름 적용에 쓰여야 됨
        // 섹션 한계층을 무시하는 속성 때문에
        path: pathValid(up),
        origin: originClear(up),
      },
      /** 실제 상대 경로 > 공백 변형 > 재귀 탐색용 */
      path: symbolJoin(path.path, indexValue),
    };
  }
  return current;
};

export type Relative = {
  parent?: string;
  children?: string[];
};

/** node 1 depth near nodes */
export const relativeExtend = (node: BaseNode) => {
  const { parent, children } = node as {
    parent?: BaseNode;
    children?: BaseNode[];
  };

  console.log("parent:", parent, children);
  const result = {} as Relative;

  if (children) {
    if (children.length === 0) delete result.children;
    else result["children"] = children.map((node) => node.id);
  }

  if (parent) {
    if (parent == null) delete result.parent;
    else result["parent"] = parent.id;
  }

  return result;
};

/** node 1 depth near nodes */
export const stylesExtend = (node: BaseNode) => {
  const { parent, children } = node as {
    parent?: BaseNode;
    children?: BaseNode[];
  };

  console.log("parent:", parent, children);
  const result = {} as Relative;

  if (children) {
    if (children.length === 0) delete result.children;
    else result["children"] = children.map((node) => node.id);
  }

  if (parent) {
    if (parent == null) delete result.parent;
    else result["parent"] = parent.id;
  }

  return result;
};

export async function* getThis(node: BaseNode): AsyncGenerator<DeepNode> {
  yield { node, path: detailPathExtend(node) };
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

export type Pages = {
  node: PageNode;
  path: DetailPaths;
};

export async function* getAll2(): AsyncGenerator<Pages> {
  for (let i = 0; i < figma.root.children.length; i++) {
    const page = figma.root.children[i];
    await page.loadAsync();

    yield { node: page, path: detailPathExtend(page, nullPaths, i) };
  }
}
