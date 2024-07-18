import { Prettify } from "../../types/utilType";
import { FigmaNodeType, FigmaNodeTypeMapping } from "./FigmaNodes";

export const notify = (message: string, closeLabel: string) => {
  const NotificationHandler = figma.notify(message, {
    timeout: 3000,
    button: {
      text: closeLabel,
      action: () => {
        NotificationHandler.cancel();
      },
    },
  });
};

type 참조 = BaseNodeMixin;

export interface RecursiveFigmaNode<T extends BaseNode["type"]> {
  type: T;
  children: RecursiveFigmaNode<T>[];
}

// baseNode 사용 시 전체 키
// id: asdf,
// parent: asdf,
// name: "asdf",
// removed: asdf,
// remove: asdf,
// setRelaunchData: asdf,
// getRelaunchData: asdf,
// isAsset: asdf,
// getCSSAsync: asdf,
// getPluginData: asdf,
// setPluginData: asdf,
// getPluginDataKeys: asdf,
// getSharedPluginData: asdf,
// setSharedPluginData: asdf,
// getSharedPluginDataKeys: asdf,
// getDevResourcesAsync: asdf,
// addDevResourceAsync: asdf,
// editDevResourceAsync: asdf,
// deleteDevResourceAsync: asdf,
// setDevResourcePreviewAsync: asdf,

type TestNode = Prettify<BaseNodeMixin>;
let temp: TestNode = null as any;

export interface RecursiveFigmaNode<T extends BaseNode["type"]>
  extends Omit<BaseNodeMixin, "children"> {
  type: T;
  children: RecursiveFigmaNode<T>[];
}
