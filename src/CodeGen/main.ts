import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

import { toSvg } from "../utils/toSvg";
import {
  ScanHandler,
  SectionSelectUiRequestHandler,
  SectionSelectMainResponseHandler,
  SvgSymbolHandler,
  SelectNodeByIdUiHandler,
} from "./types";
import { FileMetaSearch, findMainComponent } from "../FigmaPluginUtils";

export default function () {
  console.log("hello::", figma);
  if (figma.editorType === "dev") {
    figma.on("selectionchange", async () => {
      const current = figma.currentPage.selection;
      console.log(current);
    });

    on<SectionSelectUiRequestHandler>("SECTION_SELECT_UI_REQUEST", async () => {
      const current = figma.currentPage.selection;

      if (current.length <= 0) {
        return figma.notify("선택된 노드가 없습니다");
      }

      const agree = ["SECTION", "FRAME"];
      if (agree.includes(current[0].type)) {
        const target = current[0] as SectionNode;
        const docs = FileMetaSearch(target);
        if (docs) {
          return emit<SectionSelectMainResponseHandler>(
            "SECTION_SELECT_UI_RESPONSE",
            {
              id: target.id,
              name: target.name,
              pageId: docs.page.id,
              pageName: docs.page.name,
            }
          );
        }
      }

      if (current[0].type === "INSTANCE") {
        const mainComponent = await findMainComponent(current[0]);
        if (mainComponent) {
          if (mainComponent.remote) {
            figma.notify(
              "이 인스턴스의 메인 컴포넌트는 현재 프로젝트 외부 라이브러리입니다."
            );
          } else {
            const docs = FileMetaSearch(mainComponent);
            if (docs) {
              figma.ui.postMessage({
                type: "SECTION_SELECT_UI_RESPONSE",
                data: {
                  id: mainComponent.id,
                  name: mainComponent.name,
                  pageId: docs.page.id,
                  pageName: docs.page.name,
                },
              });
            }
          }
        }
      }
    });

    on<SelectNodeByIdUiHandler>(
      "SELECT_NODE_BY_ID_UI",
      async (nodeId, pageId) => {
        const page = figma.root.findChild(
          (node) => node.id === pageId && node.type === "PAGE"
        ) as PageNode | null;

        console.log("page", page);
        if (!page) {
          return;
        }
        await figma.setCurrentPageAsync(page);
        // 현재 페이지를 찾은 페이지로 설정

        // figma 내에서 노드 찾기
        const node = page.findOne((n) => n.id === nodeId);

        if (node) {
          // 노드로 화면 줌
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);

          figma.notify(`${page.name}  /  ${node.name}`);
        }
      }
    );

    on<SvgSymbolHandler>("SVG_SYMBOL_CODE", async function async() {
      const current = figma.currentPage.selection;
      console.log("current", current);
      const { id, completed, duplicate, unsupportedKeys } =
        await toSvg(current);
      const text = completed
        .filter((item) => item != null)
        .join("\n")
        .replace(/viewbox/g, "viewBox");

      const result = `<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${text}
  </defs>
</svg>`;
      emit<ScanHandler>("FULL_SCAN", result, duplicate, unsupportedKeys, id);
    });
    showUI({});
  }
  // 코드 제너레이터 코드를 넣을 수 있음
  // 일단 기본적인 코드 토크나이저 부터 시작
}
