/**
 * 컴포넌트 최상단 세션 찾기 없으면 undefined
 * @param node
 * @param section
 * @returns
 */
export const FileMetaSearch = (
  node: BaseNode,
  page?: PageNode,
  document?: DocumentNode
): { page: PageNode; document: DocumentNode } | undefined => {
  const parent = node.parent;

  if (parent) {
    if (parent.type === "PAGE") {
      const name = parent;
      return FileMetaSearch(parent, name);
    } else {
      return FileMetaSearch(parent, page, document);
    }
  } else if (node.type === "DOCUMENT") {
    const name = node;
    if (!page) throw Error("DOCUMENT is null");
    return { page, document: name };
  }
  return undefined;
};

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

/** 인스턴스의 컴포넌트를 반환 */
export async function findMainComponent(instance: InstanceNode) {
  while (instance.type === "INSTANCE") {
    const main = await instance.getMainComponentAsync();
    if (main) {
      console.log(main);

      return main;
    }
    return null; // 메인 컴포넌트를 찾지 못한 경우
  }
}

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
