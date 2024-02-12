import { EventHandler } from "@create-figma-plugin/utilities";

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface LocalTokenExport extends EventHandler {
  name: "LOCAL_TOKEN_EXPORT";
  handler: () => void;
}

export interface ShareNode extends BaseNodeMixin {
  name: string;
  id: string;
  children?: readonly ShareNode[];
  [key: string]: any;
  type: NodeType;
}
