import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

import {
  CloseHandler,
  CreateRequestHandler,
  CodeResponseHandler,
  MessageHandler,
} from "./handlerTypes";

import { JSXTargetCheck } from "../utils/typeChecker";
import { notify, RecursiveFigmaNode } from "../FigmaPluginUtils";
import { RecursiveNodeType } from "../../types/NodeBase";

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
      }
    });
    showUI({
      height: 500,
      width: 240,
    });
  }
}
