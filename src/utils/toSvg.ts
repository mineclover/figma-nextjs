import render from "dom-serializer";
import { rename } from "../utils/rename";
import { parseDocument } from "htmlparser2";
import { Element } from "domhandler";

type ErrorCase = "unsupported" | "ignore" | null;

type Inspection = {
  [key: string]: number;
};
const childrenScan = (node: Element): ErrorCase => {
  const children = node.children.filter(
    (item) => item instanceof Element
  ) as Element[];

  // "svg", "symbol" 에서 Fill 삭제 끝
  const ignore = ["svg", "symbol"];
  if (!ignore.includes(node.name)) {
    if (node.attribs.fill) {
      node.attribs.fill = "currentcolor";
    }

    if (node.attribs.stroke) {
      node.attribs.stroke = "currentcolor";
    }
  }

  const unsupported = ["mask", "clip-path"];
  if (unsupported.includes(node.name)) {
    return "unsupported";
  }
  if (Array.isArray(children)) {
    return children.map((item) => childrenScan(item))[0];
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
    const symbolID = rename(item.name);
    console.log("start", item, index, symbolID);

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

    console.log("end", item, index, svg, symbolID);

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
