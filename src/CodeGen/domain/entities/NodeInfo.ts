export interface NodeInfo {
  pageId: string;
  selectedNodeId: string;
}

export interface SVGNodeInfo {
  name: string;
  alias: boolean;
  nodeInfo: NodeInfo;
  type: 'use' | 'object' | 'image' | string;
  attrs: Record<string, any>;
  raw: string;
  origin: string;
  pngs: { scale: number; png: Uint8Array }[];
}

export interface SelectList {
  id: string;
  name: string;
  pageId: string;
  pageName: string;
}

export interface Project {
  fileKey: string;
  projectName: string;
}

export interface SVGResult {
  input: {
    sections: SelectList[];
    filter: FilterType;
  };
  svgs: {
    name: string;
    alias: boolean;
    node: any;
    nodeInfo: NodeInfo;
    type: 'use' | 'object' | 'image' | string;
    attrs: Record<string, any>;
    raw: string;
    origin: any;
    pngs: { scale: number; png: Uint8Array }[];
  }[];
}

export interface FilterType {
  [key: string]: any;
}
