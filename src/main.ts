import { once, on, showUI } from "@create-figma-plugin/utilities";
import {
  CloseHandler,
  ScanHandler,
  CreateRectanglesHandler,
  ShareNode,
} from "./types";
let count = 0;

const childrenScan = (node: ShareNode, parent?: any): any => {
  // 기본 트리 구조 수집 로직
  // #region
  count += 1;
  // 기본 노드 속성
  const { id, name, type } = node;
  const nodeName = node.constructor.name;
  const result = {
    id,
    name,
    type,
  };

  // data 안에 데이터 삽입
  const putData = (data: any) => {
    Object.assign(result, {
      data,
    });
  };
  // result와 같은 수준에 데이터 삽입
  const append = (data: any) => {
    Object.assign(result, data);
  };
  // 의도하려했지만 탐색되지 않은 정보를 알기 위한 디버그 콘솔
  const debugConsole = (msg: string) => {
    console.log("debugConsole::", msg, result, node.constructor.name);
  };
  if (type == null) {
    debugConsole("타입이 없음");
  }

  // children 추가
  const array = node.children as Array<any>;
  if (Array.isArray(array)) {
    const children = array.map((item) => childrenScan(item, result));
    append({
      children,
    });
  }

  // parent 추가
  if (parent) {
    const parentData = { ...parent };
    delete parentData.children;
    delete parentData.parent;
    append({ parent: parentData });
  }

  // #endregion

  if (name.includes("%%")) {
    append({
      tag: "주석",
    });
  }
  if (type === "TEXT") {
    // type Text에 대한 처리
    putData({ characters: node.characters });
    append({ name: "TEXT" });
  } else if ("characters" in node) {
    debugConsole("TEXT 가 아닌데 characters 가 있는 노드가 발견 됨");
  }

  return result;
};

export default function () {
  on<ScanHandler>("FULL_SCAN", () => {
    // const data = childrenScan(figma.root);
    count = 0;
    const data = childrenScan(figma.currentPage);
    console.log(data, "count :", count);
    console.log(JSON.stringify(data));
  });
  once<CreateRectanglesHandler>("CREATE_RECTANGLES", function (count: number) {
    const nodes: Array<SceneNode> = [];
    for (let i = 0; i < count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 200;
      rect.fills = [
        {
          color: { b: 0.3, g: 0.5, r: 1 },
          type: "SOLID",
        },
      ];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    console.log(figma);
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
    figma.closePlugin();
  });
  once<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });
  showUI({
    height: 500,
    width: 240,
  });
}
