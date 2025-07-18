import {
	SelectList,
	FilterType,
	LazyNodeData,
	LazySVGRequest,
	SVGResult,
} from "../../domain/entities/NodeInfo";
import { toNodeName } from "../../../CodeGen/variableMain";
import { toSingleSvg } from "../../../utils/toSvg";

export class LazySvgGenerationUseCase {
	async collectNodes(sections: SelectList[]): Promise<LazyNodeData[]> {
		const lazyNodes: LazyNodeData[] = [];

		for (const section of sections) {
			const { pageId, id } = section;
			const page = figma.root.findChild(
				(node) => node.id === pageId && node.type === "PAGE",
			) as PageNode | null;

			if (page) {
				await figma.setCurrentPageAsync(page);
				const node = await figma.getNodeByIdAsync(id);

				if (node && node.type !== "PAGE" && node.type !== "DOCUMENT") {
					// 노드 정보만 저장, 실제 SVG 생성은 나중에
					lazyNodes.push({
						nodeId: node.id,
						pageId,
						nodeInfo: {
							pageId,
							seleteNodeId: id,
						},
						filter: {} as FilterType, // 나중에 설정됨
					});
				}
			}
		}

		return lazyNodes;
	}

	async generateSVGOnDemand(
		lazyNodes: LazyNodeData[],
		filter: FilterType,
	): Promise<SVGResult> {
		const svgs = [];

		for (const lazyNode of lazyNodes) {
			try {
				// 실제 노드 가져오기
				const page = figma.root.findChild(
					(node) => node.id === lazyNode.pageId && node.type === "PAGE",
				) as PageNode | null;

				if (!page) {
					console.warn(`Page not found: ${lazyNode.pageId}`);
					continue;
				}

				await figma.setCurrentPageAsync(page);
				const node = await figma.getNodeByIdAsync(lazyNode.nodeId);

				if (!node || node.type === "PAGE" || node.type === "DOCUMENT") {
					console.warn(`Node not found or invalid type: ${lazyNode.nodeId}`);
					continue;
				}

				// SceneNode로 타입 캐스팅
				const sceneNode = node as SceneNode;

				// 이 시점에서 실제 SVG 생성 및 스캔
				const { resultName, alias } = toNodeName(sceneNode, filter);
				const svg = await toSingleSvg(sceneNode, resultName);

				// PNG 생성도 이 시점에서
				const pngs = [];
				const scales = [2];
				for (const scale of scales) {
					const png = await sceneNode.exportAsync({
						format: "PNG",
						constraint: { type: "SCALE", value: scale },
					});
					pngs.push({ scale, png });
				}

				svgs.push({
					node: sceneNode,
					name: resultName,
					alias,
					nodeInfo: lazyNode.nodeInfo,
					nodeType: sceneNode.type || "unknown",
					...svg,
					pngs,
				});
			} catch (error) {
				console.error(`Error processing node ${lazyNode.nodeId}:`, error);
				continue;
			}
		}

		return {
			input: { sections: [], filter }, // sections는 나중에 설정
			svgs,
		};
	}
}
