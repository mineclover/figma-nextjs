import { EventHandler } from "@create-figma-plugin/utilities";

export interface CreateRectanglesHandler extends EventHandler {
  name: "CREATE_RECTANGLES";
  handler: (count: number) => void;
}

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface ScanHandler extends EventHandler {
  name: "FULL_SCAN";
  handler: () => void;
}

export interface ShareNode extends BaseNodeMixin {
  name: string;
  id: string;
  children?: readonly ShareNode[];
  [key: string]: any;
  type: NodeType;
}
