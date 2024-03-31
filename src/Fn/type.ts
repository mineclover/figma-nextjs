export type Tree = {
  node: SceneNode;
  path: string;
  rootSection: string | undefined;
};

export type DepthData = {
  id: string;
  type: NodeType;
  rootSection: string | undefined;
};
export type PathData = {
  key: string;
  type: NodeType;
  rootSection: string | undefined;
};
