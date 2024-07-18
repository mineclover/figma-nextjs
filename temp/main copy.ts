import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

// import { parser } from "posthtml-parser";
import { parseDocument } from "htmlparser2";
import { Element } from "domhandler";
import render from "dom-serializer";
import { rename } from "../src/utils/rename";
import {
  SvgSymbolHandler,
  CloseHandler,
  ScanHandler,
  MessageHandler,
} from "../src/utils/types";

export default function () {
  if (figma.mode === "codegen") {
    figma.codegen.on("preferenceschange", async (event) => {
      console.log(event);
      if (event.propertyName === "example") {
        figma.showUI(
          "<style>body { font-family: system-ui, -apple-system, sans-serif; }</style><p>An iframe for external requests or custom settings!</p>",
          {
            width: 300,
            height: 300,
          }
        );
      }
    });

    figma.codegen.on("generate", async (event) => {
      let blocks = [] as CodegenResult[];
      const { node, language } = event;
      const { unit, scaleFactor } = figma.codegen.preferences;

      console.log(event, figma.codegen.preferences, figma.codegen);

      console.log(figma);

      if (scaleFactor) {
        const formatUnit = (number: number) =>
          unit === "scaled"
            ? `${(number * scaleFactor).toFixed(3)}su`
            : `${number}px`;
        const nodeObject = {
          type: node.type,
          name: node.name,
          width: formatUnit(node.width),
          height: formatUnit(node.height),
        };
        blocks = [
          language === "html"
            ? {
                title: `Custom HTML`,
                code: `<p>${node.name} is a node! Isn't that great??? I really really think so. This is a long line.</p>`,
                language: "HTML",
              }
            : null,
          language === "css"
            ? {
                title: `Custom CSS`,
                code: `div { width: ${nodeObject.width}; height: ${nodeObject.height} }`,
                language: "CSS",
              }
            : null,
          language === "js"
            ? {
                title: `Custom JS`,
                code: `function log() { console.log(${JSON.stringify(
                  nodeObject
                )}); }`,
                language: "JAVASCRIPT",
              }
            : null,
          language === "json"
            ? {
                title: `Custom JSON`,
                code: JSON.stringify(nodeObject),
                language: "JSON",
              }
            : null,
        ].filter(Boolean) as CodegenResult[];
      }
      return blocks;
    });
    showUI({ visible: false });
  }
}
