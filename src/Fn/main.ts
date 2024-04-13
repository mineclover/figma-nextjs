import { once, on, showUI } from "@create-figma-plugin/utilities";
import {
  peek,
  pipe,
  toAsync,
  curry,
  take,
  map,
  reduce,
  head,
} from "@fxts/core";
import { CloseHandler, ScanHandler } from "./types";

import {
  iter,
  isPromise,
  objectExtendIterGenarator,
  asyncIterGenarator,
  prevIter,
  combinationIter,
  objectIterGenarator,
} from "../utils/JF";
import { sectionRename } from "./feature/section";
import { ast, deepTraverse } from "./feature/ast";
import { Tree } from "./type";
import { exportToJSON } from "./feature/exportVariables";

type GeneratorReturn<T extends IterableIterator<unknown>> = Exclude<
  ReturnType<T["next"]>["value"],
  void
>;

let count = 0;
const tapSpace = 2;
const tabText = " ".repeat(tapSpace);

// 깊이 우선 탐색

// const treeMap = new Map()

/**
 * [path, id]
 */
const depthMap = objectIterGenarator(<T extends Tree>(tree: T) => {
  return [tree.path, tree.node.id] as readonly [string, string];
});

type DepthData = {
  id: string;
  type: NodeType;
};
type PathData = { key: string; type: NodeType };

const depthTypeMap = objectIterGenarator(<T extends Tree>(tree: T) => {
  return [
    tree.path,
    {
      id: tree.node.id,
      type: tree.node.type,
    },
  ] as readonly [string, DepthData];
});

const depthNodeMap = objectIterGenarator(<T extends Tree>(tree: T) => {
  return [tree.path, tree.node];
});

const pathParse = objectExtendIterGenarator(<T extends Tree>(tree: T) => ({
  depth: tree.path.split(":"),
}));

const nodeParentOn = objectExtendIterGenarator(<T extends Tree>(input: T) => ({
  parent: input.node.parent,
}));

const nodeId = objectExtendIterGenarator(<T extends Tree>(input: T) => ({
  id: input.node.id,
}));
const hello = asyncIterGenarator(<T extends Tree>(input: T) => {
  return {
    ...input,
    hello: input.node.id,
  };
});

const world = asyncIterGenarator(<T extends Tree>(input: T) => {
  return {
    ...input,
    hello2: input.node.id,
  };
});

function* PromiseUnPack<T>(list: PromiseSettledResult<T>[]) {
  for (const item of list) {
    if (item.status === "fulfilled" && item.value != null) yield item.value;
    else console.error(item, "PromiseUnPack error");
    // else yield item; reject을 제거
  }
}

function* asyncStyleExport<T extends Tree>(iter: Iterable<T>) {
  for (const value of iter) {
    const node = value.node;
    yield new Promise<T & Object>((resolve) => {
      (node as Exclude<BaseNode, DocumentNode>)
        .exportAsync({
          format: "JSON_REST_V1",
        })
        .then((data) =>
          resolve({
            ...value,
            data,
          })
        );
    });
  }
}

//

interface Ast1 extends Tree {
  depth: string[];
  parent: BaseNode | null;
}

const allSettled = (x: any) => Promise.allSettled(x);

const textPostion = (axisNode: Ast1) => {
  const depth = axisNode.depth;
  const len = depth.length - 1;
  const tagName =
    axisNode.node.type + ":" + axisNode.node.name + "%" + axisNode.path;
  const id = axisNode.node.id;
  return { depth, len, tagName, id };
};

const semanticDFSFn = <T extends Ast1>() => {
  let prev: T;
  let openTags = [] as string[];

  const closeFn = (astNode: T) => {
    if (prev) {
      const { depth: PrevDepthTemp } = textPostion(prev);
      const { len: currentLength } = textPostion(astNode);
      const closeLoop = (PrevDepth: string[], close = ""): string => {
        const prevLength = PrevDepth.length - 1;
        if (prevLength < currentLength) return close;
        else {
          const closeTag = openTags.pop();
          return closeLoop(
            PrevDepth.slice(0, -1),
            (close += `${tabText.repeat(prevLength)}</${closeTag}>
`)
          );
        }
      };
      // console.log("closeFn", [...PrevDepthTemp]);
      return closeLoop([...PrevDepthTemp]);
    }
    return "";
  };

  const last = () => {
    if (prev) {
      const { depth: PrevDepthTemp } = textPostion(prev);
      const currentLength = 0;
      const closeLoop = (PrevDepth: string[], close = ""): string => {
        const prevLength = PrevDepth.length - 1;
        if (prevLength < currentLength) return close;
        else {
          const closeTag = openTags.pop();
          return closeLoop(
            PrevDepth.slice(0, -1),
            (close += `${tabText.repeat(prevLength)}</${closeTag}>
`)
          );
        }
      };
      // console.log("last", [...PrevDepthTemp]);
      return closeLoop([...PrevDepthTemp]);
    }
    return "";
  };

  return {
    FP: (astNode: T) => {
      // 열린려있는 만큼 닫는 재귀
      let result = closeFn(astNode);
      const { len, tagName } = textPostion(astNode);
      const a = `${tabText.repeat(len)}<${tagName}>
`;
      result += a;
      openTags.push(tagName);
      prev = astNode;
      return result;
    },
    last: last,
  };
};

type Te = GeneratorReturn<ReturnType<typeof prevIter<Ast1>>>;
type Tes = GeneratorReturn<ReturnType<typeof combinationIter<Te>>>;

// jsx 코드 생성
function* combine<T extends Tes>(iter: IterableIterator<T>) {
  const skipType = [""];
  // const commponent = {} as { [key: string]: string[] };
  let commponent = [] as string[];
  let prevCommponent = [] as string[];
  let code = "";
  let minDepth = Infinity;
  let count = 0;
  for (const value of iter) {
    const { prev, current } = value;

    // 확인하고 싶은 것 , 동기성을 유지하는지
    // 클로저를 유지하는지
    if (typeof current !== "string") {
      // console.log("prev", textPostion(prev));
      // console.log("current", textPostion(current));
      // 2. 코드 추가 중에 닫히는 상황 발생 시 지금까지 작성한 코드를 감싸는 컴포넌트를 만든다
      // 인스턴스 객체일 경우는 이전 검색에서 pass 여부를 넣어줘야한다
      // 감싸진 객체는 특정 조건을 만족 할 때 까지 코드를 생성한다
      // 조건이 만족되면 code를 commponent 로 선언한다?
      // 안쪽의 prev에도 pipe를 넣을 수 있지 않을까

      const { len, tagName, id } = textPostion(current);
      console.log("diff::", "currentLen::", len);

      /**
       * 1이면 이전 값들을 가져와야한다
       * 0이면 code를 code에 추가해야한다
       * -1 ~ 일 경우에는 code를 초기화한다
       * @returns prev - current
       */
      const isPrev = (prev2: Ast1 | "start" | "end", currentLen: number) => {
        if (typeof prev2 === "string") return -1;
        const { len: prevLen } = textPostion(prev2);
        minDepth = Math.min(minDepth, prevLen);
        return prevLen - currentLen;
      };
      const expr = isPrev(prev, len);
      if (expr === 1) {
        // 현재 탐색 중인 높이가 현재까지 탐색된 최상단 노드와 같다면
        if (minDepth === len) {
        }
      }
      if (expr < 0) {
        // 마이너스 일 경우, 이전 값은 탐색을 끝냈다는 뜻 ,
        // -1 이면 형제 탐색중
        // -n 이면 다음 형제의 첫 노드가 아주 깊게 있다는 뜻
        // 한 컴포넌트 내부 순회를 끝내고 다음, 또는 start
        code = "";
      }
      if (expr === 0) {
        code = `${tabText.repeat(len)}<${tagName}/${current.node.id}>
${count++}
${tabText.repeat(len)}</${tagName}@@@@${current.node.id}>
`;
      }
      console.log(expr);
    }
  }
  yield commponent;
}

const ast2 = async (node: BaseNode) => {
  const astDFSTree = pipe(
    deepTraverse(node, node.name),
    pathParse,
    nodeParentOn
  );

  const DeepTreeMap = pipe(
    deepTraverse(node, node.name),
    pathParse,
    nodeParentOn
  );

  const promiseAll = await Promise.allSettled([...astDFSTree]);
  const unPack = PromiseUnPack(promiseAll);
  console.log(JSON.stringify([...unPack]));
};

export default function () {
  if (figma.editorType === "figma") {
    on<ScanHandler>("FULL_SCAN", async () => {
      // const data = childrenScan(figma.root);
      count = 0;
      // 현재 페이지를 전달함 > 만약 피그마 파일 전체를 순회한다면?
      // const data = await childrenScan(figma.root);

      // // 세션 기반 이름 수정
      // //#region
      const data = await ast();
      console.log(data);
      const {
        allResult,
        componentSets,
        components,
        idToPath,
        pathToId: NodeInfo,
      } = data;

      const rootComponentKey = Object.entries(components)
        .filter(([key, value]) => !("componentSetId" in value))
        .map(([key, value]) => key);

      const rootCompId = [...Object.keys(componentSets), ...rootComponentKey];
      sectionRename(rootCompId);

      //#endregion

      // 스타일 정보 가져오기
      // const variables = await figma.variables.getLocalVariablesAsync();
      // const variableCollections =
      //   await figma.variables.getLocalVariableCollectionsAsync();

      const variableCollections = await exportToJSON();

      console.log({
        rootCompId,
        componentSets,
        components,
        NodeInfo,
        variableCollections,
      });

      // const instances = Object.entries(idToPath).filter(
      //   ([key, value]) => value.type === "INSTANCE"
      // );
      // const sections = Object.entries(idToPath).filter(
      //   ([key, value]) => value.type === "SECTION"
      // );

      // console.log(instances, sections);

      // components 를 정의할 건데
      // 컴포
    });

    once<CloseHandler>("CLOSE", function () {
      figma.closePlugin();
    });
    showUI({
      height: 500,
      width: 240,
    });
  }
}
