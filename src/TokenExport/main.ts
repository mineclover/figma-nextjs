import { once, on, showUI } from "@create-figma-plugin/utilities";
import { CloseHandler, LocalTokenExport } from "./types";
import { RGBA } from "@create-figma-plugin/ui";

type Temp = {
  id: string;
  name: Variable["name"];
  description: string;
  resolvedType: Variable["resolvedType"];
  valuesByMode: Record<string, any>;
};

function readVariables() {
  const localCollections = figma.variables.getLocalVariableCollections();
  // name에 collection name 이 들어감
  console.log("localCollections ::", localCollections);
  return localCollections.map((collenction) => {
    console.log("collenction ::", collenction);
    console.log();
    const modes = collenction.modes;
    console.log("Modes::", modes);
    const variableIds = collenction.variableIds.map((variableId) => {
      // variableId 를 통해 variable 을 가져옴
      const variable = figma.variables.getVariableById(variableId);
      const temp: Temp = {
        id: "error",
        name: "",
        resolvedType: "STRING",
        description: "",
        valuesByMode: {},
      };
      if (variable) {
        console.log("variable ::", variable);
        // valueByMode는 modes 의 modeId 를 키로 가지는 구조로 되어있음
        // x 축은 localCollections.name , ...modes 로 보면 된다
        temp.id = variable.id;
        temp.name = variable.name;
        temp.description = variable.description;
        temp.resolvedType = variable.resolvedType;
        variable.valuesByMode;

        const valuesByMode = modes.reduce(
          (acc, mode) => {
            const roundRange = 100;
            const value = variable.valuesByMode[mode.modeId];
            if (variable.resolvedType === "COLOR") {
              Object.keys(value).forEach((key) => {
                const tempValue = value as any;
                tempValue[key] =
                  Math.round(Number(tempValue[key]) * roundRange) / roundRange;
              });
              acc[mode.modeId] = value;
            }
            return acc;
          },
          // acc에 대한 초기값 + 타입 선언
          {} as typeof variable.valuesByMode
        );
        // temp.valuesByMode = { ...variable.valuesByMode };
        temp.valuesByMode = { ...valuesByMode };
      }
      return temp;
    });
    return {
      id: collenction.id,
      name: collenction.name,
      modes,
      variableIds,
    };
  });
}
// 함수 실행

export default function () {
  if (figma.editorType === "figma") {
    on<LocalTokenExport>("LOCAL_TOKEN_EXPORT", () => {
      const a = readVariables();
      console.log(a);
    });
    once<CloseHandler>("CLOSE", function () {
      figma.closePlugin();
    });
    showUI({
      height: 500,
      width: 240,
    });
  }
}
