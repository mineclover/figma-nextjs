import { emit } from "@create-figma-plugin/utilities";

export class VariableEventHandler {
	private variableProcessingUseCase: any;
	private variableService: any;

	constructor() {
		this.variableProcessingUseCase = new (class {
			async execute() {
				// 기본 구현
				return {
					designTokens: {},
					scssModeStyles: {},
					defaultScssStyles: {},
					scssVariableStyles: {},
					errorTokens: {},
					sameNamesObject: {},
				};
			}
		})();

		this.variableService = new (class {
			async getLocalVariableCollections() {
				return await figma.variables.getLocalVariableCollectionsAsync();
			}
		})();
	}

	async handleVariableProcessing() {
		try {
			const result = await this.variableProcessingUseCase.execute();
			emit("VARIABLE_GET_RESPONSE", result);
		} catch (error) {
			console.error("Variable processing error:", error);
			figma.notify("변수 처리 중 오류가 발생했습니다.");
		}
	}

	async handleProjectInfo() {
		const project = {
			fileKey: figma.fileKey,
			projectName: figma.root.name,
		};
		emit("PROJECT_INFO_MAIN_RESPONSE", project);
	}
}
