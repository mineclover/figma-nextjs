import {
  FilterType,
  FilePathSearch,
  FilterTypeIndex,
} from "../FigmaPluginUtils";
import { LLog } from "../utils/console";
import { typeofNumber } from "../utils/textTools";

export type TokenValue = Variable | Omit<VariableValue, "VariableAlias">;

export type StringKeyValue = Record<string, string>;
export type ModeStyles = Record<string, StringKeyValue>;
/** 키는  */
export type ErrorTokensValue = Record<string, string[][]>;

export type SameNameVariableInfo = {
  collectionName: string;
  variableName: string;
};

export type ErrorTokenData = {
  /** 하나의 컨테이너를 기준으로 에러난  */
  errorTokens: ErrorTokensValue;
  /** 하나의 이름을 키로 반복되는 변수들의 정보 저장 */
  sameNamesObject: Record<string, SameNameVariableInfo[]>;
};

export type VariableResponseData = VariableTokenData & ErrorTokenData;

export type VariableTokenData = {
  designTokens: StringKeyValue;
  scssModeStyles: ModeStyles;
  defaultScssStyles: StringKeyValue;
  scssVariableStyles: StringKeyValue;
};

export const splitUnit = ", $";

/**
 * const styleName = toStyleName(variable);
 * const tokenName = toTokenId(variable, modeId);
 * css var name
 * */
export const getVarName = (styleName: string, tokenName: string) => {
  return "var(--" + styleName + splitUnit + tokenName + ");";
};

export const getIsVariable = (
  variable: VariableValue
): variable is VariableAlias => {
  return (
    typeof variable === "object" &&
    (("type" in variable) as unknown as VariableAlias) &&
    (variable as unknown as VariableAlias).type === "VARIABLE_ALIAS"
  );
};

export const VCID = "VariableCollectionId:";
export const VID = "VariableID:";

let count = 0;
/**
 * 스타일 이름 , css 생성기
 *  getCSSAsync 결과랑 출력 맞춰놨음
 *  종속성 문제랑 getCSSAsync이 기능이 더 많은 문제가 있음
 * number, string, boolean 값도 지원하는 차이
 */
export const toStyleName = (
  vari: {
    name: string;
    resolvedType: Variable["resolvedType"] | "STYLE_COLOR";
  },
  // parent: VariableCollection,
  parent: {
    name: string;
  },
  errorTokens: ErrorTokensValue
) => {
  // 이름에서 특수문자 , 한글 제거
  // 공백은 언더바 처리 가능한데
  // _를 어떻게 처리할지는 좀 고민되긴 하네 딱히 규칙은 필요 없음
  const name = vari.name
    .trim()
    .replace(/[^a-zA-Z0-9_: \-\/]/g, "")
    .replace(/:/g, "__")
    .replace(/ /g, "_")
    .replace(/\//g, "-");
  // .replace(/\//g, "_")
  // 대문자 처리하고
  const errorPrefix = "NAME_ERROR_";

  // 특수문자만 남아있는 경우도 제거
  const test = name.replace(/[^a-zA-Z0-9]/g, "");
  // 숫자만 있는 경우
  // 길이가 0이거나 숫자거나
  if (test.length === 0 || typeofNumber(test) || name.startsWith("/")) {
    // 에러 토큰... 처리를 어떻게 하는가 뭐 일단 에러인 건 맞아
    count++;

    if (!parent) {
      return "PARANT NULL ERROR" + count;
    }

    if (errorTokens[parent.name] == null) {
      errorTokens[parent.name] = [];
    }

    errorTokens[parent.name].push([
      errorPrefix + count,
      vari.name,
      vari.resolvedType,
    ]);
    return errorPrefix + count;
  }

  return name
    .split("/")
    .map((text, index) => {
      // 0빼고 나머지
      return index ? text.charAt(0).toUpperCase() + text.slice(1) : text;
    })
    .join("");
};

export const toNodeName = (
  node: SceneNode,
  filter: FilterType
): {
  resultName: string;
  alias: boolean;
} => {
  const paths = FilePathSearch(node).filter((path) => {
    // 의도적 결합도
    if (FilterTypeIndex(path.type) === 1) return filter.DOCUMENT;
    if (FilterTypeIndex(path.type) === 2) return filter.PAGE;
    if (FilterTypeIndex(path.type) === 3) return filter.SECTION;
    if (FilterTypeIndex(path.type) === 4) return filter.COMPONENT_SET;
    if (FilterTypeIndex(path.type) === 5) return filter.COMPONENT;
    return false;
  });
  // property 구분
  // 일단 선택된거 쓰고
  let currentNode = node;
  if (node.parent && FilterTypeIndex(node.parent.type) === 5) {
    // 부모가 컴포넌트면 팝해서 써라
    currentNode = paths.pop() as SceneNode;
  }
  if (currentNode == null) currentNode = node;
  LLog("svg", "currentNode::", currentNode, paths);

  const pluginSaveName = currentNode.getPluginData("name").trim();

  /** 있으면 덮어씀 */
  if (pluginSaveName !== "")
    return {
      resultName: pluginSaveName,
      alias: true,
    };

  const names = currentNode.name.split(", ");

  // 키=벨류, 키=벨류 구조의 텍스트에서 벨류만 파싱하는 코드임
  // 문서에 =이 없으면 공백이 나옴
  LLog("svg", names);
  const tempName = names
    .map((t) => t.split("=")[1])
    .join("_")
    .trim();
  // tempName이 공백이면 기존 이름을 조인하는 코드임

  const name =
    tempName === ""
      ? names
          .map((t) => t.trim())
          .join("_")
          .trim()
      : tempName;
  const path = paths
    .map((item) => item.name.replace(/[^a-za-zA-Z0-9_]/g, "").trim())
    .map((t, index) => (t !== "" ? t : "❌" + paths[index].type + "❌"))
    .join("_");
  const firstName = path ? path + "__" : "";
  return {
    resultName:
      firstName + name.replace(/ /g, "").replace(/-/g, "_").replace(/\//g, "_"),
    alias: false,
  };
};

/**
 * 변수를 토큰으로
 * VCID , VID
 *  스코프 디펜던시 있음
 */
export const toTokenId = (vari: Variable, modeKey: string) => {
  const variableCollectionId = vari.variableCollectionId
    .replace(VCID, "VCID")
    .replace(":", "_");
  const variableID = vari.id.replace(VID, "VID").replace(/:/g, "_");

  const isRemote =
    variableCollectionId.includes("/") && variableID.includes("/");

  // const modeValue = vari.valuesByMode[modeKey];
  // console.log("mode:", modeValue);
  const modeName = "M" + modeKey.replace(/:/g, "_");

  if (isRemote) {
    const remoteVcid = "R_VCID" + variableCollectionId.split("/")[1];
    const remoteVid = "R_VID" + variableID.split("/")[1];

    return [remoteVcid, remoteVid, modeName].join("__");
  }

  return [variableCollectionId, variableID, modeName].join("__");
};
/**
 * 토큰에서 변수 정보를
 * TODO: R_VCID 정보는 못읽음 근데  이 코드 자체를 안써서 괜찮긴 함
 * VCID , VID
 *  스코프 디펜던시 있음
 */
export const fromTokenId = (tokenId: string) => {
  const [tokenVCID, tokenVID, tokenMode] = tokenId.split("__");
  const variableCollectionId = tokenVCID
    .replace("VCID", VCID)
    .replace(/_/g, ":");
  const variableID = tokenVID.replace("VID", VID).replace(/_/g, ":");
  const mode = tokenMode.replace("M", "");

  // 딱 식별키
  return {
    variableCollectionId,
    variableID,
    mode,
  };
};
