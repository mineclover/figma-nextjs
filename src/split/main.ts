import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

import {
  SvgSymbolHandler,
  CloseHandler,
  ScanHandler,
  MessageHandler,
} from "./types";
import { toSvg } from "../utils/toSvg";
import { sliceDeepTraverse } from "../utils/imageSplit";

type ErrorCase = "unsupported" | "ignore" | null;

export default function () {
  if (figma.editorType === "figma") {
    on<SvgSymbolHandler>("SVG_SYMBOL_CODE", async function async() {
      const current = figma.currentPage.selection;
      const root = current[0].absoluteBoundingBox;
      if (!root) return;
      //  프레임이 없어서 여러개 선택해야 전부 선택되는 경우가 변수임
      if (current.length !== 1) return;
      const slice = sliceDeepTraverse(current[0]);

      const slices = [...slice].map((rect) => ({
        x: rect.x - root.x,
        y: rect.y - root.y,
        width: rect.width,
        height: rect.height,
      }));

      const zeroPrefix = (num: number, text: string) => {
        const prefix = num > 0 ? text : "";
        return prefix + num + "px";
      };

      const getStyle = (vector: Rect, index: number) => {
        // 초과되서 짤려야하는 것

        // 어느 방향이 짤리는가
        // 일단 x, y가 - 일 경우 왼쪽 위 방향으로 짤림
        // x , y 가 root.x, root.y 보다 크면 그만큼 오른쪽 아래로 짤림

        const x = vector.x < 0 ? 0 : vector.x;
        const y = vector.y < 0 ? 0 : vector.y;
        const overX =
          root.width < x + vector.width ? x + vector.width - root.width : 0;
        const overY =
          root.height < y + vector.height ? y + vector.height - root.height : 0;

        const width = vector.x < 0 ? vector.width + vector.x : vector.width;
        const height = vector.y < 0 ? vector.height + vector.y : vector.height;

        const jsConvention = {
          backgroundSize:
            zeroPrefix(root.width, "") + " " + zeroPrefix(root.height, ""),
          backgroundPosition: zeroPrefix(x, "-") + " " + zeroPrefix(y, "-"),
          width: width - overX + "px",
          height: height - overY + "px",
          display: "block",

          backgroundRepeat: "no-repeat",
          flexShrink: 0,
        };
        const cssConvention = `.${current[0].name.replace(/ /g, "")}_${String(index).padEnd(2, "0")} {
  background-size: ${root.width}px ${root.height}px;
  background-position: ${zeroPrefix(x, "-")} ${zeroPrefix(y, "-")};
  width: ${width - overX}px;
  height: ${height - overY}px;
  display: block;

  background-repeat: no-repeat;
  flex-shrink: 0;
}`;

        return { jsConvention, cssConvention };
      };

      const slicesStyle = slices.map((slic, index) => getStyle(slic, index));

      const cssSlices = slicesStyle.map((item) => item.cssConvention);

      emit<ScanHandler>("TEXT_RESULT", cssSlices.join("\n"));
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
}
