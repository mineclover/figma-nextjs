import { once, on, showUI, emit } from "@create-figma-plugin/utilities";
// import { parser } from "posthtml-parser";
import { parseDocument } from "htmlparser2";
import { Element } from "domhandler";
import render from "dom-serializer";
import { rename } from "../utils/rename";
import {
  SvgSymbolHandler,
  CloseHandler,
  ScanHandler,
  MessageHandler,
} from "./types";

type Inspection = {
  [key: string]: number;
};

type ErrorCase = "unsupported" | "ignore" | null;

const childrenScan = (node: Element): ErrorCase => {
  const children = node.children.filter(
    (item) => item instanceof Element
  ) as Element[];

  // "svg", "symbol" 에서 Fill 삭제 끝
  const ignore = ["svg", "symbol"];
  if (!ignore.includes(node.name)) {
    node.attribs.fill = "currentcolor";
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

export default function () {
  on<SvgSymbolHandler>("SVG_SYMBOL_CODE", async function async() {
    const unsupportedKeys = [] as string[];
    const symbolKeys = [] as string[];
    const inspection = {} as Inspection;
    const duplicate = [] as string[];
    const current = figma.currentPage.selection;
    const temp = current.map(async (item) => {
      const symbolID = rename(item.name);
      const svg = await item.exportAsync({
        format: "SVG_STRING",
        svgSimplifyStroke: true,
      });
      const ast = parseDocument(svg).children.filter(
        (item) => item.type === "tag"
      )[0] as Element;

      // ast === parser result
      // item === name
      //  ast.name === tag
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
      console.log(r);
      if (r === "unsupported") {
        console.log("unsupported");
        unsupportedKeys.push(symbolID);
      }

      // if (symbolKeys.includes(symbolID)) {
      //   return null;
      // }
      symbolKeys.push(symbolID);
      return render(ast);
    });

    const completed = await Promise.allSettled(temp);

    console.log(completed);
    const result = PromiseOpen(completed).filter((item) => item != null);
    emit<ScanHandler>(
      "FULL_SCAN",
      result.join("\n"),
      duplicate,
      unsupportedKeys
    );
  });
  once<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });
  on<MessageHandler>("POST_MESSAGE", function (text: string) {
    const NotificationHandler = figma.notify(text, {
      timeout: 2,
      button: {
        text: "x",
        action: () => {
          NotificationHandler.cancel();
        },
      },
    });
  });
  showUI({
    height: 360,
    width: 240,
  });
}
