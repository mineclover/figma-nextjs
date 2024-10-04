import { EventHandler, once } from "@create-figma-plugin/utilities";
import { FilterType } from "../FigmaPluginUtils";
import { SVGResult } from "./main";

export type SelectList = {
  id: string;
  name: string;
  pageId: string;
  pageName: string;
};

export type Project = {
  fileKey?: string;
  projectName: string;
};

// 핸들러
export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface SvgSymbolHandler extends EventHandler {
  name: "SVG_SYMBOL_CODE";
  handler: () => void;
}

export interface ScanHandler extends EventHandler {
  name: "FULL_SCAN";
  handler: (
    result: string,
    duplicate: string[],
    unsupportedKeys: string[],
    id: string[]
  ) => void;
}

export interface MessageHandler extends EventHandler {
  name: "POST_MESSAGE";
  handler: (text: string) => void;
}

export interface SectionSelectUiRequestHandler extends EventHandler {
  name: "SECTION_SELECT_UI_REQUEST";
  handler: () => void;
}

export interface FigmaSelectMainResponseHandler extends EventHandler {
  name: "SECTION_SELECT_UI_RESPONSE";
  handler: (data: SelectList) => void;
}

export interface SelectNodeByIdZoomHandler extends EventHandler {
  name: "SELECT_NODE_BY_ID_ZOOM";
  handler: (id: string, pageId: string) => void;
}

export interface SelectNodeSetNameHandler extends EventHandler {
  name: "SELECT_NODE_SET_NAME";
  handler: (
    id: string,
    pageId: string,
    name: string,
    TransactionID: string
  ) => void;
}

/**
 * name 은 트렌젝션 아이디로 설정하고 once로 받는 인터페이스랑 타임아웃 설정해서 넣으면 가능
 */
export interface EndSignalHandler extends EventHandler {
  name: string;
  handler: () => void;
}

/** 보낼 때 생성한 걸로 넘어올 때까지 promise 해라 임 */
export const promiseOnce = (
  id: string,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) => {
  once<EndSignalHandler>(id, () => {
    resolve("성공");
  });

  setTimeout(() => {
    reject("3s timeout");
  }, 3000);
};

export const promiseOnceSample = (key: string) =>
  new Promise((resolve, reject) => {
    // 특정 id로 emit 이후 받는 것은 promiseOnce
    promiseOnce(key, resolve, reject);
  });

export interface SectionSelectSvgUiRequestHandler extends EventHandler {
  name: "SECTION_SELECT_SVG_UI_GENERATE_REQUEST";
  handler: (selectedSections: SelectList[], filter: FilterType) => void;
}

export interface SectionSelectSvgMainResponseHandler extends EventHandler {
  name: "SECTION_SELECT_SVG_MAIN_GENERATE_RESPONSE";
  handler: (svgs: SVGResult["svgs"]) => void;
}

export interface ProjectUIHandler extends EventHandler {
  name: "PROJECT_INFO_UI_RESPONSE";
  handler: () => void;
}

export interface ProjectMainHandler extends EventHandler {
  name: "PROJECT_INFO_MAIN_RESPONSE";
  handler: (project: Project) => void;
}

export interface ResizeWindowHandler extends EventHandler {
  name: "RESIZE_WINDOW";
  handler: (windowSize: { width: number; height: number }) => void;
}
