export type Tree = {
  node: SceneNode;
  path: string;
  rootSection: string | undefined;
};

export interface DepthData {
  id: string;
  name: string;
  type: NodeType;
  rootSection: string | undefined;
  pageName: string;
}
export interface PathData extends DepthData {
  key: string;
}
