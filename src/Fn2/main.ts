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
  processAsyncIter,
} from "../utils/JF";

import { JSXTargetCheck } from "../utils/typeChecker";
import { RecursiveFigmaNode, notify } from "../FigmaPluginUtils";
import { RecursiveNodeType } from "../../types/NodeBase";
import { getAll, getAll2, PathDeepTraverse } from "../utils/JsonParse";
import { takeAll, reduce } from "../utils/fx";

// figma api 실행하는 곳임
// ui에서의 트리거들을 분기로 기능들을 실행할 수 있음

const asdf = {} as any;

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

const testFn = objectIterGenerator2((input) => {
  console.log("input", input);
  return input;
});
const testFn2 = objectIterGenerator((input) => {
  console.log("input", input);
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
        console.log("현재 선택된 타겟", target);

        // const a = pipe(
        //   PathDeepTraverse({ node: target, path: target.name }),
        //   testFn
        // );
        const a = pipe(getAll2(), testFn, take(Infinity));

        for await (const value of processAsyncIter(a)) {
          console.log(value);
        }
      }
    });
    showUI({
      height: 500,
      width: 240,
    });
  }
}
