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
    const variableIds = collenction.variableIds.map((variableId) =>
      figma.variables.getVariableById(variableId)
    );
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
