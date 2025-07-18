import { SelectList, FilterType } from "../../domain/entities/NodeInfo";
import { emit } from "@create-figma-plugin/utilities";

export class SvgEventHandler {
	private svgGenerationUseCase: any;

	constructor() {
		this.svgGenerationUseCase = new (class {
			async execute(sections: SelectList[], filter: FilterType) {
				// 기본 구현
				return { svgs: [] };
			}
		})();
	}

	async handleSvgGeneration(sections: SelectList[], filter: FilterType) {
		try {
			const result = await this.svgGenerationUseCase.execute(sections, filter);
			emit("SECTION_SELECT_SVG_MAIN_GENERATE_RESPONSE", result.svgs);
		} catch (error) {
			console.error("SVG generation error:", error);
			figma.notify("SVG 생성 중 오류가 발생했습니다.");
		}
	}

	handleNodeSelection() {
		const current = figma.currentPage.selection;
		if (current.length <= 0) {
			return figma.notify("선택된 노드가 없습니다");
		}

		const target = current[0];

		emit("SECTION_SELECT_UI_RESPONSE", {
			id: target.id,
			name: target.name,
			pageId: "",
			pageName: "",
		});
	}
}
