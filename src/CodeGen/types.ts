import { EventHandler } from "@create-figma-plugin/utilities";

export type SelectList = {
  id: string;
  name: string;
  pageId: string;
  pageName: string;
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

export interface SectionSelectMainResponseHandler extends EventHandler {
  name: "SECTION_SELECT_UI_RESPONSE";
  handler: (data: SelectList) => void;
}

export interface SelectNodeByIdUiHandler extends EventHandler {
  name: "SELECT_NODE_BY_ID_UI";
  handler: (id: string, pageId: string) => void;
}
