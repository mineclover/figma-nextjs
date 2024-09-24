import { once, on, showUI, emit } from "@create-figma-plugin/utilities";

import { toSingleSvg, toSvg } from "../utils/toSvg";
import {
  ScanHandler,
  SectionSelectUiRequestHandler,
  FigmaSelectMainResponseHandler,
  SvgSymbolHandler,
  SelectNodeByIdZoomHandler,
  MessageHandler,
  SectionSelectSvgUiRequestHandler,
  SelectList,
  SectionSelectSvgMainResponseHandler,
} from "./types";
import {
  FileMetaSearch,
  FilePathSearch,
  FilterType,
  FilterTypeIndex,
  findMainComponent,
} from "../FigmaPluginUtils";
import { LLog } from "../utils/console";

/** 하위 객체 탐색 필요 대상 */
const area = ["SECTION", "COMPONENT_SET"];
const areaInclude = (
  node: SceneNode
): node is SectionNode | ComponentSetNode => {
  return area.includes(node.type);
};
/** 그 자체가 svg화 되야하는 대상 */
const single = ["FRAME", "INSTANCE", "GROUP", "COMPONENT"];

export type NodeInfo = {
  pageId: string;
  seleteNodeId: string;
};

/**
 * 전송할 노드 선택
 */
const responseNode = (target: SceneNode) => {
  const docs = FileMetaSearch(target);
  if (docs) {
    return emit<FigmaSelectMainResponseHandler>("SECTION_SELECT_UI_RESPONSE", {
      id: target.id,
      name: target.name,
      pageId: docs.page.id,
      pageName: docs.page.name,
    });
  } else {
    return emit<FigmaSelectMainResponseHandler>("SECTION_SELECT_UI_RESPONSE", {
      id: target.id,
      name: target.name,
      pageId: "",
      pageName: "",
    });
  }
};

export type SVGResult = {
  input: {
    sections: SelectList[];
    filter: FilterType;
  };
  svgs: {
    name: string;
    node: SceneNode;
    nodeInfo: NodeInfo;
    type: Awaited<ReturnType<typeof toSingleSvg>>["type"];
    attrs: Awaited<ReturnType<typeof toSingleSvg>>["attrs"];
    raw: Awaited<ReturnType<typeof toSingleSvg>>["raw"];
    origin: Awaited<ReturnType<typeof toSingleSvg>>["origin"];
  }[];
};

export default function () {
  if (figma.editorType === "dev") {
    figma.on("selectionchange", async () => {
      const current = figma.currentPage.selection;
    });

    on<SectionSelectUiRequestHandler>("SECTION_SELECT_UI_REQUEST", async () => {
      const current = figma.currentPage.selection;

      if (current.length <= 0) {
        return figma.notify("선택된 노드가 없습니다");
      }

      // 하위에 그룹이 있으면 문제가 되는거지 프레임이 그룹이면 문제는 없음
      // export svg 했을 때 괜찮으면 ok

      if ([...area, ...single].includes(current[0].type)) {
        const target = current[0] as SectionNode;

        if (current[0].type === "INSTANCE") {
          const mainComponent = await findMainComponent(current[0]);
          if (mainComponent) {
            if (mainComponent.remote) {
              responseNode(current[0]);
              figma.notify(
                "이 인스턴스의 메인 컴포넌트는 현재 프로젝트 외부 라이브러리입니다. 문서화 시 찾기 어려움"
              );
            } else {
              // 메인 컴포넌트인데 remote가 아닐 경우 조회 하는데 page가 다르면 데이터를 읽지 못하나?
              // table, memory 모두 리부팅 하면 해결 되긴 함
              responseNode(mainComponent);
            }
          }
        } else {
          responseNode(target);
        }
      }
    });

    on<SelectNodeByIdZoomHandler>(
      "SELECT_NODE_BY_ID_ZOOM",
      async (nodeId, pageId) => {
        const page = figma.root.findChild(
          (node) => node.id === pageId && node.type === "PAGE"
        ) as PageNode | null;

        if (!page) {
          return;
        }
        //

        // 테스트
        // const time = new Date().getTime();
        // 페이지 이동 시켜줘야 줌이 됨
        await figma.setCurrentPageAsync(page);
        // 현재 페이지를 찾은 페이지로 설정
        // figma 내에서 노드 찾기
        const node = (await figma.getNodeByIdAsync(nodeId)) as SceneNode;
        // const node = page.findOne((n) => n.id === nodeId);

        if (node) {
          // 노드로 화면 줌
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          // figma.notify(`${page.name}  /  ${node.name}`);
          // const time2 = new Date().getTime();
          // console.log(time2 - time);
        }
      }
    );

    on<SectionSelectSvgUiRequestHandler>(
      "SECTION_SELECT_SVG_UI_GENERATE_REQUEST",
      async (sections, filter) => {
        const nodes: SceneNode[] = []; // 노드를 저장할 배열 추가
        const pageIdMap = {} as Record<string, NodeInfo>;
        const svgResult = {} as SVGResult;

        const addPageMap = (
          node: SceneNode,
          pageId: string,
          nodeId: string
        ) => {
          nodes.push(node);
          pageIdMap[node.id] = {
            pageId: pageId,
            seleteNodeId: nodeId,
          };
        };

        /**
         * 선택된 섹션을 순회해서 노드 데이터를 수집
         */
        for (const section of sections) {
          // for...of 루프 사용
          const { pageId, id } = section;

          const page = figma.root.findChild(
            (node) => node.id === pageId && node.type === "PAGE"
          ) as PageNode | null;

          if (!page) {
            continue; // 다음 섹션으로 넘어감
          }
          await figma.setCurrentPageAsync(page);
          // 현재 페이지를 찾은 페이지로 설정

          // figma 내에서 노드 찾기
          const node = page.findOne((n) => n.id === id);

          if (node) {
            // 컴포넌트 셋 또는 섹션일 경우
            if (areaInclude(node)) {
              node.children.forEach((n) => {
                addPageMap(n, pageId, node.id);
              });
            } else {
              addPageMap(node, pageId, node.id);
            }
          }
        }

        /**
         *  접근 방법 두 개임
         * 1. flat 한 다음 부모에 접근해서 이름을 얻는다
         * 2. 부모 정보 저장하고 그 아래에 자식 순회해서 이름 부여한다
         *  - 이 경우에는 부모가 area 에 속하면 가져오는 개념
         * # 이름 중복 문제가 있음
         *  - 파일 이름 > 페이지 > 섹션 > 섹션 > 컴포넌트 셋 > 컴포넌트
         *  - 다 쓰면 중복 안될 가능성이 높음
         *  - 소속을 나타내는 데이터는 전부 수집한다
         */
        /**
         * 노드 데이터에서 섹션 데이터와 컴포넌트 셋의 데이터 내에 있는 노드에 접근하기 쉽게 평탄화
         */

        // nodes 배열을 사용하여 후속 작업 수행
        // 각 노드 > svg 대상

        const svgs = [] as SVGResult["svgs"];
        /** 노드 순회하면서 svg 생성한다 컬러 프로퍼티 svg를 생성함 */
        for (const node of nodes) {
          // 패스 작업
          // 받아올 때 컴포넌트 소속이 뭔지 판단하기 위해 코드를 넣음
          // 패스 역할을 하는 구성요소만 저장했고
          // 컴포넌트는 그 경계에 있기 때문에 필요에 따라 설계함
          // 일반적인 프레임, 랙탱글, 그룹 등은 name으로 추가됨
          // 노드는 현재 선택한 노드
          console.log("FilePathSearch::", FilePathSearch(node, []));
          const paths = FilePathSearch(node, []).filter((path) => {
            // 의도적 결합도

            if (FilterTypeIndex(path.type) === 1) return filter.DOCUMENT;
            if (FilterTypeIndex(path.type) === 2) return filter.PAGE;
            if (FilterTypeIndex(path.type) === 3) return filter.SECTION;
            if (FilterTypeIndex(path.type) === 4) return filter.COMPONENT_SET;
            if (FilterTypeIndex(path.type) === 5) return filter.COMPONENT;
            return false;
          });
          // property 구분

          // 일단 선택된거 쓰고
          let currentNode = node;
          if (node.parent && FilterTypeIndex(node.parent.type) === 5) {
            // 부모가 컴포넌트면 팝해서 써라
            currentNode = paths.pop() as SceneNode;
          }
          if (currentNode == null) currentNode = node;
          console.log("currentNode::", currentNode, paths);
          const names = currentNode.name.split(", ");

          // 키=벨류, 키=벨류 구조의 텍스트에서 벨류만 파싱하는 코드임
          // 문서에 =이 없으면 공백이 나옴
          console.log(names);
          const tempName = names
            .map((t) => t.split("=")[1])
            .join("_")
            .trim();
          // tempName이 공백이면 기존 이름을 조인하는 코드임

          const name =
            tempName === ""
              ? names
                  .map((t) => t.trim())
                  .join("_")
                  .trim()
              : tempName;
          const path = paths
            .map((item) => item.name.replace(/[^a-zA-Z0-9_]/g, "").trim())
            .map((t, index) =>
              t !== "" ? t : FilterTypeIndex(paths[index].type) + "😎"
            )
            .join("_");
          const firstName = path ? path + "__" : "";
          const resultName =
            firstName +
            name.replace(/ /g, "").replace(/-/g, "_").replace(/\//g, "_");
          const svg = await toSingleSvg(node, resultName);
          // const parser = new DOMParser();
          // const svgDom = parser.parseFromString(svg, "image/svg+xml");
          // console.log("dom:", svgDom);
          svgs.push({
            node: node,
            name: resultName,
            nodeInfo: pageIdMap[node.id],
            ...svg,
          });
          // 클래스에 한글을 쓰냐 마냐는 컨벤션 따옴표로 감싸서 쓸 수 있음

          // 선택된 값들에 대한 섹션 아이디가 있고
          // 결과물로 svg 아이디가 있고 , Node 아이디가 있음
        }
        const input = { sections, filter };

        /** SVG react 버전 생성 */

        emit<SectionSelectSvgMainResponseHandler>(
          "SECTION_SELECT_SVG_MAIN_GENERATE_RESPONSE",
          svgs
        );
      }

      // Object.assign(svgResult, { settings: input, svgs });

      // sections 는 json import export가 구현되있음
      //
      // svg export
    );

    on<SvgSymbolHandler>("SVG_SYMBOL_CODE", async function async() {
      const current = figma.currentPage.selection;

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

    on<MessageHandler>("POST_MESSAGE", function (text: string) {
      const NotificationHandler = figma.notify(text, {
        timeout: 200,
        button: {
          text: "x",
          action: () => {
            NotificationHandler.cancel();
          },
        },
      });
    });

    showUI({});
  }
  // 코드 제너레이터 코드를 넣을 수 있음
  // 일단 기본적인 코드 토크나이저 부터 시작
}
