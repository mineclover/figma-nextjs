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
import { Welcome } from "../../types/figma";

import {
  iter,
  isPromise,
  objectExtendIterGenarator,
  asyncIterGenarator,
  prevIter,
  combinationIter,
  objectIterGenarator,
} from "../utils/JF";

type GeneratorReturn<T extends IterableIterator<unknown>> = Exclude<
  ReturnType<T["next"]>["value"],
  void
>;

let count = 0;
const tapSpace = 2;
const tabText = " ".repeat(tapSpace);

type Tree = {
  node: SceneNode;
  path: string;
};

// 깊이 우선 탐색

// 백터는 서치에서 빼는게 좋을 것 같음
// 인스턴스는 쓸 수도 있어서 제외함
// 아니면 세션이랑 컴포넌트만 서치하는 것도 괜찮음
// 어짜피 그 외는 취급 안할꺼니까
// "DOCUMENT","PAGE",를 뺀 건   figma.currentPage.selection 호환을 위해

const selectType = ["SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE"];
const childrenIgnoreType = ["COMPONENT", "COMPONENT_SET", "INSTANCE"];
function* deepTraverse(
  node: BaseNode,
  path = "select"
): IterableIterator<Tree> {
  // 현재 노드 방문
  if (selectType.includes(node.type))
    yield { node, path } as { node: SceneNode; path: string };
  // 자식 노드가 존재하는 경우
  if ("children" in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색

    if (!childrenIgnoreType.includes(node.type)) {
      for (let i = 0; i < node.children.length; i++) {
        yield* deepTraverse(node.children[i], path + ":" + i);
      }
    }
  }
}

// const treeMap = new Map()

const depthMap = objectIterGenarator(<T extends Tree>(tree: T) => {
  return [tree.path, tree.node.id] as readonly [string, string];
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

const ast = async (node: BaseNode) => {
  // depthMap
  const deepTreeMap = pipe(deepTraverse(node, node.name), depthMap);
  const a = new Map(deepTreeMap);

  const b = [...a.entries()].map(([key, value], index) => {
    return value;
  });
  const c = b.map((d) => figma.getNodeByIdAsync(d));
  const promiseAll = await Promise.allSettled(c);
  const e = PromiseUnPack(promiseAll);
  console.log([...e]);

  // component map
  const getAll = async () => {
    const result = [] as Welcome[];
    const promise = figma.root.children.map(async (page) => {
      // PageNodes are the only children of root
      await page.loadAsync();
      const data = (await page.exportAsync({
        format: "JSON_REST_V1",
      })) as Welcome;
      // name은 나중에 preview나 tokens를 위해
      result.push({ ...data, name: page.name });
      return;
    });
    await Promise.allSettled(promise);
    return result;
  };

  const all = await getAll();
  console.log(JSON.stringify(all));

  const commponentMap = (all: Welcome[]) => {
    const allComponentSets = [] as [string, any][];
    const allComponents = [] as [string, any][];
    let setCount = 0;
    let sCount = 0;

    all.forEach((item) => {
      const { componentSets, components } = item;
      if (componentSets) {
        Object.entries(componentSets).forEach((item) =>
          allComponentSets.push(item)
        );
        setCount += Object.entries(componentSets).length;
      }
      if (components) {
        Object.entries(components).forEach((item) => allComponents.push(item));
        sCount += Object.entries(components).length;
      }
    });
    const componentSetsMap = new Map(allComponentSets);
    const componentsMap = new Map(allComponents);
    console.log(
      [...componentSetsMap.keys()],
      [...componentsMap.keys()],
      setCount,
      sCount,
      allComponentSets,
      allComponents
    );
  };
  commponentMap(all);
};

type Co = {};

export default function () {
  if (figma.editorType === "figma") {
    on<ScanHandler>("FULL_SCAN", async () => {
      // const data = childrenScan(figma.root);
      count = 0;
      // 현재 페이지를 전달함 > 만약 피그마 파일 전체를 순회한다면?
      // const data = await childrenScan(figma.root);
      const data = await ast(figma.currentPage);
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
