import { Prettify } from "../../types/utilType";
import { FigmaNodeType, FigmaNodeTypeMapping } from "./FigmaNodes";

export const notify = (message: string, closeLabel: string, timeout = 2000) => {
  const NotificationHandler = figma.notify(message, {
    timeout: timeout,
    button: {
      text: closeLabel,
      action: () => {
        NotificationHandler.cancel();
      },
    },
  });
};

const notifyMap = {} as Record<string, number>;
/** progress 생성 */
export const figmaProgress = (name: string, reset?: boolean) => {
  if (reset) notifyMap[name] = 0;
  if (notifyMap[name] == null) notifyMap[name] = 0;
  notifyMap[name] = notifyMap[name] + 1;
  notify(name, String(notifyMap[name]), 1000);
};

type 참조 = Prettify<BaseNodeMixin>;

export interface RecursiveFigmaNode<T extends BaseNode["type"]>
  extends BaseNodeMixin {
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

// type TestNode = Prettify<BaseNodeMixin>;
let temp: TestNode = null as any;

type TestNode = Prettify<BaseNodeMixin>;
