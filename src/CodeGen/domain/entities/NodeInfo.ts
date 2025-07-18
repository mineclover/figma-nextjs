import { toSingleSvg } from "../../../utils/toSvg";

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

export interface FilterType {
	DOCUMENT: boolean;
	PAGE: boolean;
	SECTION: boolean;
	COMPONENT_SET: boolean;
	COMPONENT: boolean;
}

export interface NodeInfo {
	pageId: string;
	seleteNodeId: string;
}

// 지연 처리를 위한 새로운 타입들
export interface LazyNodeData {
	nodeId: string;
	pageId: string;
	nodeInfo: NodeInfo;
	filter: FilterType;
}

export interface LazySVGRequest {
	sections: SelectList[];
	filter: FilterType;
	project: Project;
	path?: `/${string}`;
}

export interface SVGResult {
	input: {
		sections: SelectList[];
		filter: FilterType;
	};
	svgs: {
		name: string;
		alias: boolean;
		node: SceneNode;
		nodeInfo: NodeInfo;
		type: "use" | "object" | "image" | string;
		nodeType: string;
		attrs: Awaited<ReturnType<typeof toSingleSvg>>["attrs"];
		raw: Awaited<ReturnType<typeof toSingleSvg>>["raw"];
		origin: Awaited<ReturnType<typeof toSingleSvg>>["origin"] | null;
		pngs: { scale: number; png: Uint8Array }[];
	}[];
}
