import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

import { toSvg } from "../utils/toSvg";

export default function () {
  if (figma.editorType === "dev" && figma.mode === "codegen") {
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

      const current = [node];
      if (current.length === 1) {
        const { completed, duplicate, unsupportedKeys, id } =
          await toSvg(current);
        const codeSnippet =
          '<SvgUse src="/$1/asset.svg#$0" className="$1" alt="$0" />';
        const $0 = id[0];
        const $1 = "icon";

        const result = codeSnippet.replace(/\$0/g, $0).replace(/\$1/g, $1);

        return [
          {
            title: "code",
            code: result,
            language: "JAVASCRIPT",
          },
        ] as CodegenResult[];
      }
      return [];
    });
    showUI({ visible: false });
  }
  if (figma.editorType === "figma") {
    showUI({});
  }
}
