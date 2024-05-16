import { EventHandler } from "@create-figma-plugin/utilities";

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface SvgSymbolHandler extends EventHandler {
  name: "SVG_SYMBOL_CODE";
  handler: () => void;
}

export interface ScanHandler extends EventHandler {
  name: "TEXT_RESULT";
  handler: (result: string) => void;
}

export interface MessageHandler extends EventHandler {
  name: "POST_MESSAGE";
  handler: (text: string) => void;
}
