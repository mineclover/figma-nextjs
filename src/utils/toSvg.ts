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
  const unsupportedKeys = [] as string[];
  const symbolKeys = [] as string[];
  const inspection = {} as Inspection;
  const duplicate = [] as string[];

  const temp = selection.map(async (item) => {
    const symbolID = rename(item.name);
    const svg = await item.exportAsync({
      format: "SVG_STRING",
      svgSimplifyStroke: true,
    });
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
    return render(ast);
  });

  const promise = await Promise.allSettled(temp);

  return {
    id: symbolKeys,
    completed: PromiseOpen(promise),
    duplicate,
    unsupportedKeys,
  };
};
