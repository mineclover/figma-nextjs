import render from "dom-serializer";
// import { rename } from "../utils/rename";
import { parseDocument } from "htmlparser2";
import { Element } from "domhandler";

import * as parse5 from "parse5";
import type {
  Element as ParseElement,
  TextNode,
} from "parse5/dist/tree-adapters/default";
import { Attribute } from "parse5/dist/common/token";
import { LLog } from "./console";

const unsupported = [
  "mask",
  "clip-path",
  "filter",
  "g",
  "feflood",
  "fegaussianblur",
  "fecomposite",
  "feblend",
  "defs",
];

type ErrorCase = "unsupported" | "ignore" | null;

type Inspection = {
  [key: string]: number;
};

const currentOverrideOption = false;

const SVG_COLOR_PREFIX = "svg-color";
const PERCENT_PREFIX = "svg-percent";
const CURRENT_COLOR = "currentColor";

export const childrenScan = (node: Element): ErrorCase => {
  const children = node.children.filter(
    (item) => item instanceof Element
  ) as Element[];

  // "svg", "symbol" 에서 Fill 삭제 하지 않음
  const ignore = ["svg", "symbol"];
  if (currentOverrideOption && !ignore.includes(node.name)) {
    if (node.attribs.fill) {
      node.attribs.fill = CURRENT_COLOR;
    }

    if (currentOverrideOption && node.attribs.stroke) {
      node.attribs.stroke = CURRENT_COLOR;
    }
  }

  if (unsupported.includes(node.name)) {
    return "unsupported";
  }
  if (Array.isArray(children)) {
    return children
      .map((item) => childrenScan(item))
      .filter((text) => text === "unsupported")[0];
  }
  return null;
};
const PromiseOpen = <T>(promiseArray: PromiseSettledResult<T>[]) => {
  return promiseArray.map((item) => {
    if (item.status === "fulfilled") return item.value;
    return item;
  });
};

export const toSvg = async (selection: readonly SceneNode[]) => {
  // 지원 안되는 심볼
  const unsupportedKeys = [] as string[];
  // 전체 심볼 이름 리스트
  const symbolKeys = [] as string[];
  // count 목적
  const inspection = {} as Inspection;
  // 중복 체크
  const duplicate = [] as string[];

  const temp = selection.map(async (item, index) => {
    const symbolID = item.name;
    // const symbolID = rename(item.name);

    let svg;
    try {
      svg = await item.exportAsync({
        format: "SVG_STRING",
        svgSimplifyStroke: true,
      });
    } catch (e) {
      console.error(e);
      svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }

    const ast = parseDocument(svg).children.filter(
      (item) => item.type === "tag"
    )[0] as Element;
    ast.name = "symbol";
    ast.attribs.id = symbolID;
    delete ast.attribs.width;
    delete ast.attribs.height;
    delete ast.attribs.xmlns;

    if (symbolID in inspection) {
      inspection[symbolID] += 1;
      duplicate.push(symbolID);
    } else {
      inspection[symbolID] = 1;
    }

    const r = childrenScan(ast);

    if (r === "unsupported") {
      unsupportedKeys.push(symbolID);
    }

    if (symbolKeys.includes(symbolID)) {
      return null;
    }
    symbolKeys.push(symbolID);
    const rendering = render(ast);
    return rendering;
  });

  const promise = await Promise.allSettled(temp);

  return {
    id: symbolKeys,
    completed: PromiseOpen(promise),
    duplicate,
    unsupportedKeys,
  };
};

// const symbol;

// 생성 대상이 필요함 unsupported 같은 경우는 svg use 쓸 때임
// object tag는 다 되고 current도 됨
// var 컬러 설정 기능을 추가하는게 1번
// 이름을 기반으로 동일한 인터페이스를 사용해서 아이콘을 수정할 수 있게 하고자 함
// 이름을 키로 잡고 타입으로 Props 중 한개 또는 props에 제어 속성 넣어서 수정하게끔 하는 구조임
// object 단점 호출이 쪼개짐 > 이미지 수준의 오버헤드
// 완전 단순한 svg는 use로 unsupported 로 관리하던 건 object로 넘길 수 있다는 소리임

const SVG_CASE_OBJECT = "object";
const SVG_CASE_USE = "use";

type SvgCase = typeof SVG_CASE_OBJECT | typeof SVG_CASE_USE;
type Attr = {
  /** "fill_1" : rgba(123,123,123,0.1) */
  [key: string]: string;
};

// Object.entries 써서 속성 값 같은 거 찾아서
// 이미 등록되있으면 등록된 키 사용
// 오파시티 값도 되긴 함
// op

// 태그 이름으로는 filter ~
// 속성이름으로는 result , in2 , filter
// 값으로는 url() 이 있을 때 해당 svg는 더 이상 svg use로 사용할 수 없음

/** 필터 하위로 들어가는 속성은 생략하고 나머지에서 */

const parse5Unsupported = {
  tagName: ["mask", "clipPath", "filter", "g", "defs", "linearGradient"],
  attrs: ["result", "in2", "filter"],
  attrsStartsWith: ["url(#"],
};

export const SvgScan = (ast: ParseElement): SvgCase => {
  const children = ast.childNodes as ParseElement[];

  LLog("검사로직 ", ast);
  // 태그 이름으로 가능 여부를 구분하는 것
  // unsupported가 하나라도 있으면 이 파일은 object를 통해 임포트 한다
  if (
    ast.attrs.some((attr) => {
      const isUnsupported = parse5Unsupported.attrs.includes(attr.name);
      LLog("태그 관리", parse5Unsupported.attrs, attr.name, isUnsupported);
      if (isUnsupported) {
        LLog("Unsupported attribute found:", attr.name);
      }
      return isUnsupported;
    })
  ) {
    return SVG_CASE_OBJECT;
  }

  // 접부사
  // unsupported가 하나라도 있으면 이 파일은 object를 통해 임포트 한다

  if (
    ast.attrs.some((attr) => {
      const isUnsupported = parse5Unsupported.attrsStartsWith.some((prefix) => {
        const startsWithPrefix = attr.value.startsWith(prefix);

        if (startsWithPrefix) {
          LLog(
            "Attribute value starts with unsupported prefix:",
            prefix,
            attr.value
          );
        }
        return startsWithPrefix;
      });
      return isUnsupported;
    })
  ) {
    return SVG_CASE_OBJECT;
  }
  // 태그네임
  // 태그 네임에 특정이름이 포함되면

  if (parse5Unsupported.tagName.includes(ast.tagName)) {
    return SVG_CASE_OBJECT;
  }

  if (Array.isArray(children) && children.length !== 0) {
    // 줄바꿈 생략
    const useNodes = children.filter((item) => {
      if (item.nodeName === "#text") {
        const textNode = item as unknown as TextNode;
        return textNode.value !== "\n";
      }
      return true;
    });
    if (useNodes.length > 0) {
      for (const item2 of useNodes) {
        return SvgScan(item2);
      }
    }
  }
  return SVG_CASE_USE;
};

// 색상 추출 해야함 일단 어디서 시작하든 가장 먼저 추출된 거 기준으로 키 설정 되는거임

const grantingVar = (
  ast: ParseElement,
  storeAttrObject: Attr,
  name: string
) => {
  const ignore = ["svg"];
  const colorTarget = ["fill", "stroke", "stop-color"];
  const percentTarget = ["opacity", "fill-opacity", "stroke-opacity"];
  const target = [...colorTarget, ...percentTarget];
  // 속성 값 배열

  if (!ignore.includes(ast.tagName)) {
    for (const innerAttr of ast.attrs) {
      // 컬러 타겟 속성이면
      if (colorTarget.includes(innerAttr.name)) {
        LLog("색상으로 판단", colorTarget, innerAttr);
        const existingColorKeys = Object.keys(storeAttrObject).filter((key) =>
          key.startsWith(SVG_COLOR_PREFIX)
        );
        const isExisting = existingColorKeys.some((colorKey) => {
          //소문자로 고정
          return storeAttrObject[colorKey.toLowerCase()] === innerAttr.value;
        });
        let newKey = "";

        // 만약 중복된 속성이 저장되있지 않으면 뉴 키에 속성을 저장한다
        if (!isExisting) {
          LLog("길면서 중복이 없음", existingColorKeys.length);
          // 키 생성
          newKey = `${SVG_COLOR_PREFIX}-${Object.keys(existingColorKeys).length + 1}`;
        } else {
          LLog("길면서 중복임", isExisting, existingColorKeys.length);
          for (const a of Object.entries(storeAttrObject)) {
            const [key, value] = a;
            if (value === innerAttr.value) {
              newKey = key;
              break;
            }
          }
        }
        // 키가 한개 이상이면 키 이름 관리

        storeAttrObject[newKey] = innerAttr.value;
        innerAttr.value = `var(--${newKey}, ${storeAttrObject[newKey]})`;
      } else if (percentTarget.includes(innerAttr.name)) {
        // tt

        const existingPercentKeys = Object.keys(storeAttrObject).filter((key) =>
          key.startsWith(PERCENT_PREFIX)
        );
        const isExisting = existingPercentKeys.some((percentKey) => {
          return storeAttrObject[percentKey] === innerAttr.value;
        });
        let newKey = `${PERCENT_PREFIX}-${Object.keys(existingPercentKeys).length + 1}`;
        // 한개 이상부터 커런트컬러를 안쓴다

        LLog("길이 충분", existingPercentKeys.length);
        // 만약 중복된 속성이 저장되있지 않으면 뉴 키에 속성을 저장한다
        if (isExisting) {
          LLog("길면서 중복임", isExisting, existingPercentKeys.length);
          // 중복이면 newKey는 객체에서 value 로 찾아서
          // newKey에 쓸 키를 가져온다
          for (const a of Object.entries(storeAttrObject)) {
            const [key, value] = a;
            if (value === innerAttr.value) {
              newKey = key;
              break;
            }
          }
        }
        // 키가 한개 이상이면 키 이름 관리

        storeAttrObject[newKey] = innerAttr.value;
        innerAttr.value = `var(--${newKey}, ${storeAttrObject[newKey]})`;
      }
    }
  }
};

/**
 * svg
 * @param ast
 * @param storeAttrObject
 * @param name
 * @returns
 */
export const svgToUse = (
  ast: Parameters<typeof grantingVar>[0],
  storeAttrObject: Parameters<typeof grantingVar>[1],
  name: Parameters<typeof grantingVar>[2]
): void => {
  const children = ast.childNodes as ParseElement[];

  const ignore = ["svg"];

  // svg to symbol 작업
  if (ignore.includes(ast.tagName)) {
    ast.tagName = "symbol";
    // 아이디는 추가해야하니까 제거 함
    const target = ["width", "height", "xmlns", "id"];
    const after = ast.attrs.filter((it) => !target.includes(it.name));
    ast.attrs = [
      ...after,
      {
        name: "id",
        value: name,
      },
    ];
  } else {
    // svg 외에서 작업해야하하므로 else로 둠
    // Object.entries 써서 속성 값 같은 거 찾아서
    // 이미 등록되있으면 등록된 키 사용
    // 오파시티 값도 되긴 함
    // key: value 저장되는 attr에 innerAttr.value가 이미 저장되있으면 기존 키를 사용하고
    // 저장된 적 없는 값이면 새로운 키를 생성한다
    // svg-color-{length} 라는 키를 사용함
    // svg-percent-{length} 를 사용할 거임
    // 가장 먼저 컬러로 추가되면 currentColorKey가 됨
    //
    // attr 에서 키를 currentColor 또는 svg-color로 시작하는 키를 가지고 있는 객체 중 innerAttr.name이 value로 이미 있는지 확인

    // currentColor 또는 svg-color로 시작하는 키를 가지고 있는 객체 중 innerAttr.name이 value로 이미 있는지 확인
    // 일단 색 관련 키들 전부 수집
    // 값이 이미 있음 이거 왜 안씀?
    // 색상 속성을 가진 속성이 있을 때 컬러 속성들의 숫자로 색상을 구분했음
    // 다음은 이미 사용한 색상일 때 그 색상의 키를 제사용하는 것
    // 속성을 저장함

    // 리스트가 있고 , 그 리스트가 컬러의 키들을 가지고 있음
    // 컬러 키로 컬러에 접근했을 때의 컬러 값이 저장된 값에서 쓰고 있는 것과 같은게 이미 있을 때
    // ( 중복 색상 또는 속성이 있을 떄 )
    // 커런트 컬러는 커런트 컬러다
    // 키 이름을 써서 데이터에 접근 해서 데이터 가져오고
    // 네이티브 빌드도 빌드해야하니 빌드

    grantingVar(ast, storeAttrObject, name);
  }
  // 자식이 있고 , 0이 아니면
  if (Array.isArray(children) && children.length !== 0) {
    // 줄바꿈 생략
    const useNodes = children.filter((item) => {
      if (item.nodeName === "#text") {
        const textNode = item as unknown as TextNode;
        return textNode.value !== "\n";
      }
      return true;
    });
    for (const item2 of useNodes) {
      svgToUse(item2, storeAttrObject, name);
    }
  }
};

/**
 * url을 사용하는 객체에 대해서 디테일한 설계가 필요하기 떄문에 사용 보류
 * @param ast
 * @param storeAttrObject
 * @param name
 * @returns
 */
export const svgToObject = (
  ast: ParseElement,
  storeAttrObject: Attr,
  name: string
): void => {
  const children = ast.childNodes as ParseElement[];

  // svg 외에서 작업해야하하므로 else로 둠
  // Object.entries 써서 속성 값 같은 거 찾아서
  // 이미 등록되있으면 등록된 키 사용
  // 오파시티 값도 되긴 함
  // key: value 저장되는 attr에 innerAttr.value가 이미 저장되있으면 기존 키를 사용하고
  // 저장된 적 없는 값이면 새로운 키를 생성한다
  // svg-color-{length} 라는 키를 사용함
  // svg-percent-{length} 를 사용할 거임
  // 가장 먼저 컬러로 추가되면 currentColorKey가 됨
  //
  // attr 에서 키를 currentColor 또는 svg-color로 시작하는 키를 가지고 있는 객체 중 innerAttr.name이 value로 이미 있는지 확인

  // currentColor 또는 svg-color로 시작하는 키를 가지고 있는 객체 중 innerAttr.name이 value로 이미 있는지 확인
  // 일단 색 관련 키들 전부 수집
  // 값이 이미 있음 이거 왜 안씀?
  // 색상 속성을 가진 속성이 있을 때 컬러 속성들의 숫자로 색상을 구분했음
  // 다음은 이미 사용한 색상일 때 그 색상의 키를 제사용하는 것
  // 속성을 저장함

  // 리스트가 있고 , 그 리스트가 컬러의 키들을 가지고 있음
  // 컬러 키로 컬러에 접근했을 때의 컬러 값이 저장된 값에서 쓰고 있는 것과 같은게 이미 있을 때
  // ( 중복 색상 또는 속성이 있을 떄 )
  // 커런트 컬러는 커런트 컬러다
  // 키 이름을 써서 데이터에 접근 해서 데이터 가져오고
  // 네이티브 빌드도 빌드해야하니 빌드

  /** url을 사용하는 객체에 대해서 디테일한 설계가 필요하기 떄문에 사용 보류 */
  // grantingVar(ast, storeAttrObject, name);

  // 자식이 있고 , 0이 아니면
  if (Array.isArray(children) && children.length !== 0) {
    // 줄바꿈 생략
    const useNodes = children.filter((item) => {
      if (item.nodeName === "#text") {
        const textNode = item as unknown as TextNode;
        return textNode.value !== "\n";
      }
      return true;
    });
    for (const item2 of useNodes) {
      svgToObject(item2, storeAttrObject, name);
    }
  }
};

export const toSingleSvg = async (selectNode: SceneNode, name: string) => {
  // 지원 안되는 심볼
  const unsupportedKeys = [] as string[];
  const attrList = {} as Attr;
  const symbolID = selectNode.name;
  // const symbolID = rename(item.name);
  let svg;
  try {
    svg = await selectNode.exportAsync({
      format: "SVG_STRING",
      svgSimplifyStroke: true,
    });
  } catch (e) {
    console.error(e);
    svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  const parseResult = parse5.parse(svg);
  // html 용이여서 빈 html과 Head가 생김
  LLog("parseResult:", parseResult);
  const docu = parseResult.childNodes[0] as ParseElement;
  LLog("docu:", docu);
  const body = docu.childNodes.filter(
    (item) => (item as ParseElement).tagName === "body"
  )[0] as ParseElement;
  LLog("body:", body);
  const svgTag = body.childNodes.filter(
    (item) => (item as ParseElement).tagName === "svg"
  )[0] as ParseElement;
  LLog("svgTag:", svgTag);
  const svgType = SvgScan(svgTag);

  const result = {
    raw: "",
    type: svgType,
    attrs: attrList,
    origin: svg,
  };

  if (svgType === SVG_CASE_OBJECT) {
    // svgToObject(svgTag, attrList, name);
    result.raw = parse5.serialize(body);
  } else if (svgType === SVG_CASE_USE) {
    svgToUse(svgTag, attrList, name);
    result.raw = parse5.serialize(body);
  }

  return result;
};
