import { once, on, showUI, emit } from "@create-figma-plugin/utilities";
// import { parser } from "posthtml-parser";
import { Element } from "domhandler";
import {
  SvgSymbolHandler,
  CloseHandler,
  ScanHandler,
  MessageHandler,
} from "./types";
import { toSvg } from "../utils/toSvg";

type ErrorCase = "unsupported" | "ignore" | null;

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

export default function () {
  if (figma.editorType === "figma") {
    on<SvgSymbolHandler>("SVG_SYMBOL_CODE", async function async() {
      const current = figma.currentPage.selection;

      const { id, completed, duplicate, unsupportedKeys } =
        await toSvg(current);
      const result = completed
        .filter((item) => item != null)
        .join("\n")
        .replace(/viewbox/g, "viewBox");
      emit<ScanHandler>("FULL_SCAN", result, duplicate, unsupportedKeys, id);
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
    figma.on("selectionchange", async function () {
      const current = figma.currentPage.selection;
      if (current.length === 1) {
        const { completed, duplicate, unsupportedKeys, id } =
          await toSvg(current);

        const codeSnippet =
          '<SvgUse src="/$1/asset.svg#$0" className="$1" alt="$0" />';
        const $0 = id[0];
        const $1 = "icon";

        const result = codeSnippet.replace(/\$0/g, $0).replace(/\$1/g, $1);

        emit<ScanHandler>("FULL_SCAN", result, duplicate, unsupportedKeys, id);
      }
    });
    showUI({
      height: 360,
      width: 240,
    });
  }
}
