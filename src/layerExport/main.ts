import { once, on, showUI } from "@create-figma-plugin/utilities";
import {
  CloseHandler,
  ScanHandler,
  CreateRectanglesHandler,
  ShareNode,
} from "./types";
let count = 0;

interface Parent {
  id: string;
  name: string;
  type: NodeType;
  data?: any;
  children?: any;
  parent?: any;
  path?: string;
  style?: any;
}

const ignore = ["disable"];

const childrenScan = async (node: ShareNode, parent?: Parent) => {
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
  console.log(node.overrides, node.componentProperties);
  if (ignore.includes(name)) return;
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
  const debugConsole = (msg: string, option?: any) => {
    console.log("debugConsole::", msg, result, node.constructor.name, node);
    console.log("디버그 조건", option);
  };
  if (type == null) {
    debugConsole("타입이 없음");
  }

  // parent 추가
  if (parent) {
    const parentData = { ...parent };
    delete parentData.children;
    delete parentData.parent;
    delete parentData.style;
    append({ parent: parentData });
    // root 구분하기
    //
    if (parent.path) {
      // 패스가 있으면 확장
      // 세션을 통해 경로 확장을 하는게 맞고... 같은 경로에 여러 요소가 있을 수 있는 것임으로 path 확장도 세션일 때만 함

      if (node.type === "SECTION") {
        // 세션이면 path 수정
        let path = (parent.path + node.name).split("//").join("/");
        append({ path });
      } else {
        // 프레임이면 path 유지 > 다른 추가 로직 필요
        append({ path: parent.path });
      }
    } else {
      // 상위 요소에 path를 추가한 요소가 없을 때 추가하는 건데
      if (node.type === "SECTION") {
        append({ path: node.name });
      } else {
        // 세션도 아닌데 상위에 패스도 없으면 최상단 요소로 취급
        // 없는 걸로 취급하거나 특정 컴포넌트로 취급해야함
        let path = ("#/" + node.name).split("//").join("/");
        append({ path });
      }
    }
  }

  // 스타일 추가 > 스타일 없는 애들은 제외 ( {} 로 제외해도 되는데 ... 그냥 await 횟수 자체부터 줄이는 게 더 좋아보임 )
  const nullStyles = ["SECTION", "PAGE", "DOCUMENT"];
  if (!nullStyles.includes(node.type)) {
    const css = await node.getCSSAsync();
    append({ style: css });
  }

  // #endregion

  if (name.includes("%%")) {
    append({
      tag: "memo",
    });
  }
  if (type === "TEXT") {
    // type Text에 대한 처리
    putData({ characters: node.characters });
    append({ name: "TEXT" });
  } else if ("characters" in node) {
    debugConsole("TEXT 가 아닌데 characters 가 있는 노드가 발견 됨");
  }

  // children 추가 // 재귀되서 실행될 자식에게 path 정보가 필요하기 때문에 가장 아래로 내려가야했다
  const array = node.children as Array<ShareNode>;
  if (Array.isArray(array)) {
    const isPromise = array.map((item) => childrenScan(item, result));
    const promiseArray = await Promise.allSettled(isPromise);
    const children = promiseArray.map((item) => {
      if (item.status === "fulfilled") return item.value;
      debugConsole(item.reason);
      return item;
    });
    append({
      children,
    });
  }

  return result;
};

export default function () {
  if (figma.editorType === "figma") {
    on<ScanHandler>("FULL_SCAN", async () => {
      // const data = childrenScan(figma.root);
      count = 0;
      // 현재 페이지를 전달함 > 만약 피그마 파일 전체를 순회한다면?
      // const data = await childrenScan(figma.root);
      const data = await childrenScan(figma.currentPage);
      console.log(data, "count :", count);
      console.log(JSON.stringify(data));
    });
    once<CreateRectanglesHandler>(
      "CREATE_RECTANGLES",
      function (count: number) {
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
      }
    );
    once<CloseHandler>("CLOSE", function () {
      figma.closePlugin();
    });
    showUI({
      height: 500,
      width: 240,
    });
  }
}
