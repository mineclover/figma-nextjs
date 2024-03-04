import { once, on, showUI } from "@create-figma-plugin/utilities";
import { peek, pipe, toAsync, curry, take, map, reduce } from "@fxts/core";
import { CloseHandler, ScanHandler } from "./types";
import { iter, objectExtendIterGenarator } from "../utils/JF";

let count = 0;
const tapSpace = 2;
const tabText = " ".repeat(tapSpace);

interface Parent {
  id: string;
  name: string;
  type: NodeType;
  data?: any;
  children?: any;
  parent?: any;
  path?: string;
  style?: any;
}

type Tree = {
  node: BaseNode;
  path: string;
};

function* deepTraverse(node: BaseNode, path = "select"): Iterable<Tree> {
  // 현재 노드 방문
  yield { node, path };
  // 자식 노드가 존재하는 경우
  if ("children" in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색
    for (let i = 0; i < node.children.length; i++) {
      yield* deepTraverse(node.children[i], path + ":" + i);
    }
  }
}

const pathParse = objectExtendIterGenarator((tree: Tree) => ({
  depth: tree.path.split(":"),
}));

const nodeParentOn = objectExtendIterGenarator((input: Tree) => ({
  parent: input.node.parent,
}));

function* PromiseUnPack<T>(list: PromiseSettledResult<T>[]) {
  for (const item of list) {
    if (item.status === "fulfilled") yield item.value;
    else console.error(item, "PromiseUnPack error");
    // else yield item; reject을 제거
  }
}

// function* asyncIterGenarator(iter: Iterable<Tree>) {
//   for (const value of iter) {
//     const node = value.node;
//     yield new Promise((resolve) => {
//       (node as Exclude<BaseNode, DocumentNode>)
//         .exportAsync({
//           format: "JSON_REST_V1",
//         })
//         .then((json) =>
//           resolve({
//             ...value,
//             json,
//           })
//         );
//     });
//   }
// }

function* asyncIterGenarator(iter: Iterable<Tree>) {
  for (const value of iter) {
    const node = value.node;
    yield (node as Exclude<BaseNode, DocumentNode>)
      .exportAsync({
        format: "JSON_REST_V1",
      })
      .then((data) => ({
        ...value,
        data,
      }));
  }
}

//

interface Ast1 extends Tree {
  depth: string[];
  parent: BaseNode;
}

const allSettled = (x: any) => Promise.allSettled(x);

const textPostion = (axisNode: Ast1) => {
  const depth = axisNode.depth;
  const len = depth.length - 1;
  const tagName = axisNode.node.id;
  return { depth, len, tagName };
};

const semanticDFSFn = () => {
  let prev: Ast1;
  let openTags = [] as string[];

  const closeFn = (astNode: Ast1) => {
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
      console.log("hello", [...PrevDepthTemp]);
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
      console.log("hello", [...PrevDepthTemp]);
      return closeLoop([...PrevDepthTemp]);
    }
    return "";
  };

  return {
    FP: (astNode: Ast1) => {
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

const ast = async (node: BaseNode) => {
  const astDFSTree = await pipe(
    deepTraverse(node, node.name),
    pathParse,
    nodeParentOn,
    asyncIterGenarator,
    allSettled,
    PromiseUnPack<Ast1>
  );

  const { FP, last } = semanticDFSFn();

  const semantic = pipe(
    astDFSTree,
    map(FP),
    reduce((a, b) => a + b),
    (a) => a + last()
  );
  console.log("semantic", semantic);
  console.log("data::");
};

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