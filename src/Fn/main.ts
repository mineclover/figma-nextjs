import { once, on, showUI } from "@create-figma-plugin/utilities";
import { peek, pipe, toAsync } from "@fxts/core";
import { CloseHandler, ScanHandler } from "./types";
import { iterGenarator } from "../utils/JF";
import { toArray } from "lodash";
import { go, log, take, reduce, add, L, takeAll } from "./fx";

let count = 0;

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

const pathParse = iterGenarator((tree: Tree) => ({
  depth: tree.path.split(":"),
}));

const NodeParentOn = iterGenarator((input: Tree) => ({
  parent: input.node.parent,
}));

function* PromiseUnPack(list: PromiseSettledResult<any>[]) {
  for (const item of list) {
    if (item.status === "fulfilled") yield item.value;
    else yield item;
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
      .then((json) => ({
        ...value,
        json,
      }));
  }
}

//

const allSettled = (x: any) => Promise.allSettled(x);

const ast = async (node: BaseNode) => {
  const b = await pipe(
    deepTraverse(node, node.name),
    asyncIterGenarator,
    // allSettled,
    // PromiseUnPack,
    L.map((a) => {
      log(a);
      return a;
    }),
    takeAll
  );

  // console.log("cccc", [...b], b.next());
  return b;
};

export default function () {
  if (figma.editorType === "figma") {
    on<ScanHandler>("FULL_SCAN", async () => {
      // const data = childrenScan(figma.root);
      count = 0;
      // 현재 페이지를 전달함 > 만약 피그마 파일 전체를 순회한다면?
      // const data = await childrenScan(figma.root);
      const data = await ast(figma.currentPage);
      const b = data[Symbol.iterator]();
      console.log([...data], "count :", count);
      console.log([...data], "count :", count);
      console.log([...b], "count :", count);
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
