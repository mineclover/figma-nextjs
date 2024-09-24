import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SelectList } from "../CodeGen/types";
import { SVGResult } from "../CodeGen/main";
import { FilterType } from "../FigmaPluginUtils";
import { camel } from "./textTools";

// 텍스트 대체 기능 수행하는 함수
// object의 키가 전환될 $key로 사용되고 그 내용으로 대체하는 구조
const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  return Object.keys(variables).reduce((result, key) => {
    const regex = new RegExp(`\\$${key}`, "g");
    return result.replace(regex, variables[key]);
  }, template);
};

// 사용 예시

export const svgExporter = async (
  svgData: SVGResult["svgs"],
  settings: { sections: SelectList[]; filter: FilterType }
) => {
  const zipFile = new JSZip();
  const useList = svgData.filter((item) => item.type === "use");
  const objectList = svgData.filter((item) => item.type === "object");
  const useSvgList = useList.map((item) => item.raw);

  // .ts 파일 생성

  // use 인지 object 든 조건 분기에 필요한 것
  const typeSuffix = "Type";
  const listSuffix = "KeyList";

  let tsTemplate = `export type $name${typeSuffix} = $union`;
  let constTemplate = `export const $name${listSuffix} = [$array]`;

  const useUnion = useList.map((node) => `"${node.name}"`);

  const USE_NAME = "use";
  const useNameType = replaceTemplateVariables(tsTemplate, {
    name: USE_NAME,
    union: useUnion.join(" | "),
  });
  const useNameList = replaceTemplateVariables(constTemplate, {
    name: USE_NAME,
    array: useUnion.join(", "),
  });

  console.log("useNameType::", useNameType, "useNameList::", useNameList);

  const OBJECT_NAME = "object";
  const objectUnion = objectList.map((node) => `"${node.name}"`);

  const objectNameType = replaceTemplateVariables(tsTemplate, {
    name: OBJECT_NAME,
    union: useUnion.join(" | "),
  });

  const objectNameList = replaceTemplateVariables(constTemplate, {
    name: OBJECT_NAME,
    array: objectUnion.join(", "),
  });

  console.log(
    "objectNameType::",
    objectNameType,
    "objectNameList::",
    objectNameList
  );

  // props 읽어서 styles 로 추출할 때 읽어야하는 default style set
  // path 기준으로 attrs 저장
  const defaultStyles = svgData.reduce(
    (acc, node) => {
      const path = node.name;

      // props 는 camelcase 로 통일
      const temp = Object.entries(node.attrs).map(([key, value]) => {
        return [camel(key), value];
      });
      const attrs = Object.fromEntries(temp);

      acc[path] = attrs; // object에 속성 추가
      return acc; // 누적된 객체 반환
    },
    {} as Record<string, SVGResult["svgs"][number]["attrs"]>
  );

  // console;

  // 사용할 코드 구현해놓고, 그거 그대로 복붙해서 생성하게해야함 ㅇㅇ..

  // asset.svg 생성
  const result = `<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${useSvgList.join("\n")}
  </defs>
</svg>`;

  const all = svgData.map((item) => ({
    name: item.name,
    attrs: item.attrs,
    node: item.node,
    type: item.type,
    nodeInfo: item.nodeInfo,
  }));

  zipFile.file("settings.json", JSON.stringify({ ...settings, all }));
  zipFile.file("asset.svg", result);
  const objectFolder = zipFile.folder("object");
  // object/~.svg 생성
  if (objectFolder) {
    for (const svg of objectList) {
      objectFolder.file(svg.name + ".svg", svg.raw);
    }
  }

  zipFile.generateAsync({ type: "blob" }).then(function callback(blob) {
    saveAs(blob, "export.zip");
  });
};

type Color = string;
type Percent = number;

type Sample = {
  path: "newFeed_Feed__View";
  /** #FDFDFE */
  currentColor: Color;
  /** #FDFDFE */
  color1: Color;
  /** 0.1 */
  percent1: Percent;
};
