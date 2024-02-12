import { once, on, showUI } from "@create-figma-plugin/utilities";
import { CloseHandler, LocalTokenExport } from "./types";

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
    const variableValues = collenction.variableIds.map((variableId) => {
      // variableId 를 통해 variable 을 가져옴
      const variable = figma.variables.getVariableById(variableId);
      if (variable) {
        console.log("variable ::", variable);
        const temp: Temp = {
          id: "",
          name: "",
          resolvedType: "STRING",
          description: "",
          valuesByMode: {},
        };
        // valueByMode는 modes 의 modeId 를 키로 가지는 구조로 되어있음
        // x 축은 localCollections.name , ...modes 로 보면 된다
        temp.id = variable.id;
        temp.name = variable.name;
        temp.description = variable.description;
        temp.resolvedType = variable.resolvedType;
        temp.valuesByMode = { ...variable.valuesByMode };
        return temp;
      }
    });
    return {
      id: collenction.id,
      name: collenction.name,
      modes,
      variableValues,
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
