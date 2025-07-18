import { NodeInfo } from "../entities/NodeInfo";

export interface NodeService {
	findNodeById(nodeId: string, pageId: string): Promise<any>;
	getNodeInfo(node: any): NodeInfo;
	exportNodeAsPNG(node: any, scale: number): Promise<Uint8Array>;
	getNodeCSS(node: any): Promise<Record<string, string>>;
	getNodeDimensions(node: any): { width: number; height: number };
	setNodeName(node: any, name: string): void;
}

export interface SVGGenerationService {
	generateSVG(
		node: any,
		name: string,
	): Promise<{
		attrs: Record<string, any>;
		raw: string;
		origin: any;
	}>;
	processNodeName(
		node: any,
		filter: Record<string, any>,
	): {
		resultName: string;
		alias: boolean;
	};
}
