import render from "dom-serializer";
import { rename } from "../utils/rename";
import { parseDocument } from "htmlparser2";
import { Element } from "domhandler";

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
  console.log("childrenScan", node);
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
    console.log("unsupported", node.name);
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
    const symbolID = rename(item.name);

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

    console.log(
      "end",
      item,
      item.componentPropertyReferences,
      item.boundVariables,
      index,
      svg,
      symbolID
    );

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
    console.log("childrenScanResult", r);

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
