export interface DepthData {
  id: string;
  name: string;
  type: NodeType;
  rootSection: string | undefined;
  page: string;
  document: string;
}
export interface PathData extends DepthData {
  key: string;
}

export interface JSXNode extends ExportMixin {
  id: string;
  name: string;
  type: BaseNode["type"];
  parent: JSXNode | null;
  children: JSXNode[];
  [key: string]: any;
}

export type Tree = {
  node: JSXNode;
  path: string;
  rootSection: string | undefined;
  page: string;
  document: string;
};
