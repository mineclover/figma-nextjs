import { EventHandler } from "@create-figma-plugin/utilities";

export interface CreateRectanglesHandler extends EventHandler {
  name: "CREATE_RECTANGLES";
  handler: (count: number) => void;
}

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface AssetRequestHandler extends EventHandler {
  name: "ASSET_REQUEST";
  handler: () => void;
}

export interface CodeResponseHandler extends EventHandler {
  name: "CODE_RESPONSE";
  handler: (result: string) => void;
}

export interface ShareNode extends BaseNodeMixin {
  name: string;
  id: string;
  children?: readonly ShareNode[];
  [key: string]: any;
  type: NodeType;
}

export interface MessageHandler extends EventHandler {
  name: "POST_MESSAGE";
  handler: (text: string) => void;
}
