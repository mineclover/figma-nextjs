import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

import {
  CloseHandler,
  CreateRequestHandler,
  CodeResponseHandler,
  MessageHandler,
} from "./handlerTypes";

import { pipe, take } from "@fxts/core";
import {
  asyncIter,
  iter,
  objectIterGenerator,
  objectIterGenerator2,
  objectIterGenerator3,
  processAsyncIter,
} from "../utils/JF";

import { JSXTargetCheck } from "../utils/typeChecker";
import { RecursiveFigmaNode, figmaProgress, notify } from "../FigmaPluginUtils";
import { RecursiveNodeType } from "../../types/NodeBase";
import {
  DeepNode,
  getAll2,
  getThis,
  Pages,
  delayPathDeepTraverse,
  symbolJoin,
  DetailPaths,
  relativeExtend,
  Relative,
  detailPathExtend,
} from "../utils/JsonParse";
import { takeAll, reduce } from "../utils/fx";

// figma api 실행하는 곳임
// ui에서의 트리거들을 분기로 기능들을 실행할 수 있음

const asdf = {} as any;

const oneLayerTraverse = objectIterGenerator3<DeepNode, DeepNode>(
  ({ node, path }) => {
    return (function* () {
      if ("children" in node && node.children && node.children.length) {
        for (let i = 0; i < node.children.length; i++) {
          yield {
            node: node.children[i],
            path: detailPathExtend(node, path, i),
            // path: path + testSymbol + i,
          };
        }
      }
    })();
  }
);

// 인터페이스
const PathDeepTraverseWrapper = objectIterGenerator3<DeepNode, DeepNode>(
  (input) => {
    return delayPathDeepTraverse(input);
  }
);

export type RelativeNode = {
  node: BaseNode;
  path: DetailPaths;
  relative: Relative;
};
const relativeTraverseWrapper = objectIterGenerator3<DeepNode, RelativeNode>(
  (input) => {
    return { ...input, relative: relativeExtend(input.node) };
  }
);

const test: RecursiveFigmaNode<NodeType> = {
  type: "COMPONENT",
  children: [],
  id: asdf,
  parent: asdf,
  name: "asdf",
  removed: asdf,
  remove: asdf,
  setRelaunchData: asdf,
  getRelaunchData: asdf,
  isAsset: asdf,
  getCSSAsync: asdf,
  getPluginData: asdf,
  setPluginData: asdf,
  getPluginDataKeys: asdf,
  getSharedPluginData: asdf,
  setSharedPluginData: asdf,
  getSharedPluginDataKeys: asdf,
  getDevResourcesAsync: asdf,
  addDevResourceAsync: asdf,
  editDevResourceAsync: asdf,
  deleteDevResourceAsync: asdf,
  setDevResourcePreviewAsync: asdf,
};

const testFn = objectIterGenerator2<DeepNode, DeepNode>((input) => {
  console.log("objectIterGenerator2", input, input.path.documentPath);

  return input;
});

const testFn2 = objectIterGenerator2<DeepNode, DeepNode>((input) => {
  return input;
});

export default function () {
  if (figma.editorType === "figma") {
    on<CreateRequestHandler>("CREATE_REQUEST", async () => {
      notify("teset", "x");
    });

    once<CloseHandler>("CLOSE", function () {
      figma.closePlugin();
    });
    on<MessageHandler>("POST_MESSAGE", function (text: string) {
      notify(text, "x");
    });
    figma.on("selectionchange", async function () {
      const current = figma.currentPage.selection;
      if (current.length === 1) {
        const target = current[0];
        const includeTypes = ["INSTANCE", "COMPONENT"];
        console.log("현재 선택된 타겟", target, target.name);
        // const a = pipe(

        //   PathDeepTraverse2({ node: target, path: target.name }),
        //   testFn
        // );
        // const a = pipe(getAll2(), testFn, take(Infinity));
        const a = pipe(
          getThis(target),
          PathDeepTraverseWrapper,
          relativeTraverseWrapper,
          testFn,
          take(Infinity)
        );

        for await (const value of processAsyncIter(a)) {
        }
      }
    });
    showUI({
      width: 300,
      height: 300,
    });
  }
}
