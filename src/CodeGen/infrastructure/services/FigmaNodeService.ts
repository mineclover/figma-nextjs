import { NodeInfo } from "../../domain/entities/NodeInfo";

export class FigmaNodeService {
	async findNodeById(nodeId: string, pageId: string): Promise<any> {
		const page = figma.root.findChild(
			(node) => node.id === pageId && node.type === "PAGE",
		) as PageNode | null;

		if (!page) {
			return null;
		}

		await figma.setCurrentPageAsync(page);
		return await figma.getNodeByIdAsync(nodeId);
	}

	getNodeInfo(node: any): NodeInfo {
		const docs = this.findPageInfo(node);
		if (docs && typeof docs === "object" && "page" in docs) {
			return {
				pageId: (docs as any).page.id,
				selectedNodeId: node.id,
			};
		}
		return {
			pageId: "",
			selectedNodeId: node.id,
		};
	}

	async exportNodeAsPNG(node: any, scale: number): Promise<Uint8Array> {
		return await node.exportAsync({
			format: "PNG",
			constraint: { type: "SCALE", value: scale },
		});
	}

	async getNodeCSS(node: any): Promise<Record<string, string>> {
		return await node.getCSSAsync();
	}

	getNodeDimensions(node: any): { width: number; height: number } {
		return {
			width: node.width,
			height: node.height,
		};
	}

	setNodeName(node: any, name: string): void {
		node.setPluginData("name", name);
	}

	private findPageInfo(node: any): any {
		// 페이지 정보를 찾는 로직
		return null;
	}
}

export class FigmaSVGService {
	generateSVG(node: any, name: string) {
		// 기존 toSingleSvg 로직
		return Promise.resolve({
			attrs: {},
			raw: "",
			origin: null,
		});
	}

	processNodeName(node: any, filter: Record<string, any>) {
		// 기존 toNodeName 로직
		return {
			resultName: node.name,
			alias: false,
		};
	}
}
