import { EventHandler } from "@create-figma-plugin/utilities";
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
