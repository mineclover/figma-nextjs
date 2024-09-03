import render from "dom-serializer";
// import { rename } from "../utils/rename";
import { parseDocument } from "htmlparser2";
import { Element } from "domhandler";

import * as parse5 from "parse5";
import type {
  Element as ParseElement,
  TextNode,
} from "parse5/dist/tree-adapters/default";

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

export const childrenScan = (node: Element): ErrorCase => {
  const children = node.children.filter(
    (item) => item instanceof Element
  ) as Element[];

  // "svg", "symbol" 에서 Fill 삭제 하지 않음
  const ignore = ["svg", "symbol"];
  if (currentOverrideOption && !ignore.includes(node.name)) {
    if (node.attribs.fill) {
      node.attribs.fill = "currentcolor";
    }

    if (currentOverrideOption && node.attribs.stroke) {
      node.attribs.stroke = "currentcolor";
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

// svg to symbol 작업
const ignore = ["svg", "symbol"];
// if (ignore.includes(ast.tagName)) {
//   ast.nodeName = "symbol";
//   ast.tagName = "symbol";
//   delete ast.attrs.width;
//   delete ast.attrs.height;
//   delete ast.attrs.xmlns;
// }

// 생성 대상이 필요함 unsupported 같은 경우는 svg use 쓸 때임
// object tag는 다 되고 current도 됨
// var 컬러 설정 기능을 추가하는게 1번
// 이름을 기반으로 동일한 인터페이스를 사용해서 아이콘을 수정할 수 있게 하고자 함
// 이름을 키로 잡고 타입으로 Props 중 한개 또는 props에 제어 속성 넣어서 수정하게끔 하는 구조임
// object 단점 호출이 쪼개짐 > 이미지 수준의 오버헤드
// 완전 단순한 svg는 use로 unsupported 로 관리하던 건 object로 넘길 수 있다는 소리임

type SvgCase = "object" | "use";
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

export const SvgScan = (ast: ParseElement, attr: Attr): SvgCase => {
  console.log(ast, attr);
  const children = ast.childNodes as ParseElement[];

  // 태그 이름으로 가능 여부를 구분하는 것
  // unsupported가 하나라도 있으면 이 파일은 object를 통해 임포트 한다
  if (ast.attrs.some((attr) => parse5Unsupported.attrs.includes(attr.name))) {
    return "object";
  }
  // 속성 중 하나라도 맞으면 > 속성 값 중 하나라도 prefix이 겹치면
  if (
    ast.attrs.some((attr) =>
      parse5Unsupported.attrsStartsWith.some((prefix) =>
        attr.value.startsWith(prefix)
      )
    )
  ) {
    return "object";
  }
  // 태그 네임에 특정이름이 포함되면
  if (parse5Unsupported.tagName.includes(ast.tagName)) {
    return "object";
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
    for (const item2 of useNodes) {
      return SvgScan(item2, attr);
    }
  }
  return "use";
};

export const toSingleSvg = async (selectNode: SceneNode) => {
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
  console.log("parseResult:", parseResult);
  const docu = parseResult.childNodes[0] as ParseElement;
  console.log("docu:", docu);
  const body = docu.childNodes.filter(
    (item) => (item as ParseElement).tagName === "body"
  )[0] as ParseElement;
  console.log("body:", body);
  const svgTag = body.childNodes.filter(
    (item) => (item as ParseElement).tagName === "svg"
  )[0] as ParseElement;
  console.log("svgTag:", svgTag);

  const svgText = SvgScan(svgTag, attrList);

  // childNodes[1];
  const html = parse5.serialize(body);
  console.log(svgText, "html", html);

  return html;
};
