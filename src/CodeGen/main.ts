import {
  once,
  on,
  showUI,
  emit,
  convertRgbColorToHexColor,
} from "@create-figma-plugin/utilities";

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
  ProjectUIHandler,
  ProjectMainHandler,
  ResizeWindowHandler,
  SelectNodeSetNameHandler,
  EndSignalHandler,
} from "./types";
import {
  FileMetaSearch,
  FilePathSearch,
  FilterType,
  FilterTypeIndex,
  findMainComponent,
} from "../FigmaPluginUtils";
import { LLog } from "../utils/console";
import {
  InspectFilterUpdate,
  InspectMainData,
  InspectOff,
  InspectOn,
  VariableGetRequestHandler,
  VariableGetResponseHandler,
} from "./pages/variableHandlerType";
import { typeofNumber } from "../utils/textTools";
import {
  ErrorTokensValue,
  TokenValue,
  getIsVariable,
  ModeStyles,
  StringKeyValue,
  getVarName,
  ErrorTokenData,
  SameNameVariableInfo,
  VCID,
  toNodeName,
  toStyleName,
  VID,
  toTokenId,
} from "./variableMain";
import { base64TokenEncode, hexToBase64 } from "../utils/data";
import { colorTo255Object, paintCheck, rgbaToHex } from "../utils/gradient";
import {
  AllMemo,
  DocsMainAllData,
  DocsOff,
  DocsOn,
  DocsUIUpdate,
  MemoData,
} from "./pages/docsHandlerType";
import { safetyParse } from "../utils/JsonParse";

/** 값을 고유하다고 가정하고 찾아진 하나만  */
const findOne = <T extends Object>(arr: T[], fn: (item: T) => boolean) => {
  const data = arr.filter(fn);
  if (data.length) return arr.filter(fn)[0];
  return null;
};

/** 하위 객체 탐색 필요 대상 */
const area = ["SECTION", "COMPONENT_SET"];
const areaInclude = (
  node: SceneNode
): node is SectionNode | ComponentSetNode => {
  return area.includes(node.type);
};

/** 그 자체가 svg화 되야하는 대상 */
/** TODO: 이미지 리소스 대응 추가 필요  : RECTANGLE  */
const single = [
  "FRAME",
  "INSTANCE",
  "GROUP",
  "COMPONENT",
  "RECTANGLE",
  "VECTOR",
];

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
    alias: boolean;
    node: SceneNode;
    nodeInfo: NodeInfo;
    type: "use" | "object" | "image" | string;
    attrs: Awaited<ReturnType<typeof toSingleSvg>>["attrs"];
    raw: Awaited<ReturnType<typeof toSingleSvg>>["raw"];
    origin: Awaited<ReturnType<typeof toSingleSvg>>["origin"];
    pngs: { scale: number; png: Uint8Array }[];
  }[];
};

export default function () {
  if (["dev", "figma"].includes(figma.editorType)) {
    const globalFilter = {} as FilterType;

    on<ResizeWindowHandler>(
      "RESIZE_WINDOW",
      function (windowSize: { width: number; height: number }) {
        const { width, height } = windowSize;
        figma.ui.resize(width, height);
      }
    );

    // SVG
    // #region
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
          // LLog("svg",time2 - time);
        }
      }
    );

    on<SelectNodeSetNameHandler>(
      "SELECT_NODE_SET_NAME",
      async (nodeId, pageId, name, TransactionID) => {
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
        node.setPluginData("name", name);

        emit<EndSignalHandler>(TransactionID);
      }
    );

    on<SectionSelectSvgUiRequestHandler>(
      "SECTION_SELECT_SVG_UI_GENERATE_REQUEST",
      async (sections, filter) => {
        const nodes: SceneNode[] = []; // 노드를 저장할 배열 추가
        const pageIdMap = {} as Record<string, NodeInfo>;

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

          const { resultName, alias } = toNodeName(node, filter);

          const svg = await toSingleSvg(node, resultName);
          // const parser = new DOMParser();
          // const svgDom = parser.parseFromString(svg, "image/svg+xml");
          // LLog("svg","dom:", svgDom);

          const scales = [2];
          const pngs = [] as SVGResult["svgs"][number]["pngs"];
          for (const scale of scales) {
            const png = await node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: scale },
            });
            pngs.push({
              scale,
              png,
            });
          }

          svgs.push({
            node: node,
            name: resultName,
            alias,
            nodeInfo: pageIdMap[node.id],
            ...svg,
            pngs,
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
      // svg export
    );

    on<ProjectUIHandler>("PROJECT_INFO_UI_RESPONSE", async function async() {
      const project = {
        fileKey: figma.fileKey,
        projectName: figma.root.name,
      };

      emit<ProjectMainHandler>("PROJECT_INFO_MAIN_RESPONSE", project);
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
    // #endregion

    // Variables
    // #region
    on<VariableGetRequestHandler>("VARIABLE_GET_REQUEST", async function () {
      const remoteParent = {
        name: "figma_remote_parent",
      };
      const collectionsList1 =
        await figma.variables.getLocalVariableCollectionsAsync();
      const localVariablesList = await figma.variables.getLocalVariablesAsync();
      // 아직 문서화되지 않은 api

      const subscribedVariableList =
        // @ts-ignore
        figma.variables.getSubscribedVariables() as Variable[];
      const variablesList1 = [...subscribedVariableList, ...localVariablesList];
      const stylesList1 = await figma.getLocalPaintStylesAsync();
      // 있음
      //@ts-ignore
      // const remoteVariables = figma.variables.getSubscribedVariables();

      // const textList1 = await figma.getLocalTextStylesAsync();
      // console.log(textList1);

      // const effectList1 = await figma.getLocalEffectStylesAsync();
      // console.log(effectList1);
      // const gridList1 = await figma.getLocalGridStylesAsync();
      // console.log(gridList1);

      // console.log(await figma.variables.getLocalVariablesAsync());
      // console.log(await figma.getLocalTextStylesAsync());
      // console.log(await figma.getLocalPaintStylesAsync());
      // console.log(await figma.getLocalEffectStylesAsync());
      // console.log(await figma.getLocalGridStylesAsync());

      const getPaintValue = (paints: Paint[]) => {
        // 비지블 없으면 없는 처리

        const paintStyles = paints
          .filter((paint) => {
            if (typeof paint.visible === "undefined")
              console.log("visible 없는 Paint", paint);
            return paint.visible;
          })
          .map((paint, index, origin) =>
            paintCheck(paint, index === origin.length - 1)
          )
          .reduce(
            (prev, cur) => {
              const next = {
                background: [...prev.background, cur.background],
                blend: [...prev.blend, cur.blend.toLowerCase()],
              };

              return next;
            },
            {
              background: [] as string[],
              blend: [] as string[],
            }
          );

        const { background, blend } = paintStyles;

        return {
          backgroundImage: background.join(", "),
          backgroundBlendMode: blend.join(", "),
        };
      };

      /**
       * 스코프 디팬던시 있음 variablesList1
       * VARIABLE_ALIAS 일 경우 참조된 variable를 가져오게 함
       * @param vari
       * @param modeName
       * @returns
       */
      const getStyleValue = async (
        vari: Variable,
        modeName: string
      ): Promise<TokenValue> => {
        const value = vari.valuesByMode[modeName];
        if (value == null) {
          LLog("svg", "Error check", vari, modeName, value);
          return "ERROR";
        }

        if (getIsVariable(value)) {
          const next = value.id;
          const nextVari = findOne(variablesList1, (item) => item.id === next);

          // 값을 얻어야하는데 참조의 모드를 추론하는게 안됨

          // 이름에 모드까지 얹어서 토큰 호출하거나 > 이건 모드 추론 안되는 문제가 있음
          // 이름 기반으로 css 토큰 호출하는게 이상적일 것으로 판단됨

          if (nextVari) {
            return nextVari;
          } else if (value.type) {
            // 있으면 찾고 없으면 가져와서 넣어라

            const nextRemoteValue = await figma.variables.getVariableByIdAsync(
              value.id
            );
            return nextRemoteValue
              ? nextRemoteValue
              : "권한이 없거나 변수에 문제가 있음";
          }

          return "분기 처리 실패 ERROR";
        }
        return value;
      };
      // const fromStyleName = (name: string) => {

      // };

      /** 전체 스타일 이름
       * 키 이름을 변수 이름으로 잡고 , 벨류 리스트 즉 이름에 할당된 변수들으로 추론한다
       */
      const globalName = {} as Record<string, (Variable | PaintStyle)[]>;
      /** 글로벌 토큰으로 저장되는 값 */
      const tokens = {} as Record<string, TokenValue>;
      /** SCSS 생성을 위해 저장되는 스타일 */
      const scssModeStyles = {} as ModeStyles;
      /** var를 사용하는 scss 변수 생성 */
      const scssVariableStyles = {} as StringKeyValue;
      /** default scss 생성 */
      const defaultScssStyles = {} as StringKeyValue;

      const errorTokens = {} as ErrorTokensValue;

      // 작업 티켓을 만들어서 처리하는 방식으로 구성할 것임
      // 토큰 키 : variableID
      // 어짜피 참조 값 땡겨 쓰는 구조라서 딱히 비용은 없음 매핑 개념으로 사용
      // 어떻게 순차처리를하면서 갯수를 판단하면서 기본 스타일임을 구분하는가
      // variableCollectionId 에서 모드를 끌어오는것도 방법
      // 아이디가 이름..을 줄 수 있지만 .. 모드의 갯수를 판단해서 기본 값을 판단하긴 해야해
      // array 로 티켓 key value 해도 되고
      // 오브젝트로 key : { variable : VA , count: 갯수 } 로 갯수를 붙여야하나
      const cssProcess = async (
        length: number,
        styleName: string,
        variable: Variable,
        mode: {
          modeId: string;
          name: string;
        }
      ) => {
        const modeId = mode.modeId;
        const modeName = mode.name
          .toUpperCase()
          .trim()
          .replace(/[^a-zA-Z0-9_: \-\/]/g, "")
          .replace(/:/g, "__")
          .replace(/ /g, "_");
        // console.log(variable, "name::", toStyleName(variable));

        // 생성된 스타일 이름과 모드를 포함해서 데이터를 읽고 저장하는 코드가 필요함
        // 전체 이름 중복 검사를 위한 코드인데 지금 당장 할 필요가 있나?
        // globalName[ toStyleName(variable)] = toStyleName(variable)

        // 1. 토큰으로 구성
        // 고유식별토큰이름으로 ${token}: value
        const tokenName = toTokenId(variable, modeId);

        tokens[tokenName] = await getStyleValue(variable, modeId);

        // 2. 모드에 저장
        // 스타일이라는 건 이제 고유 식별 이름
        // 대시로 구성되는 것 a-b-c 로 구성하는 것
        // 모드 이름 안에
        // --{스타일}: $고유식별토큰
        // 으로 생성할 거임 그 근거
        if (length > 1) {
          // 모드 이름으로 구조가 없으면 없으면 객체 생성
          if (scssModeStyles[modeName] == null) {
            scssModeStyles[modeName] = {} as any;
          }

          // 해당 모드가
          if (
            Object.entries(variable.valuesByMode).some(([key, _], index) => {
              // 한개는 무조건 false
              // 모드 아이디가 키와 맞을 때 > 그 모드 아이디는 첫번째에 있어야한다
              if (index === 0) return key === modeId;
              return false;
            })
          ) {
            if (globalName[styleName] == null) globalName[styleName] = [];
            globalName[styleName].push(variable);

            if (globalName[styleName].length > 1) {
              LLog("debug", "겹침 :", variable);
            }
          }

          /** scss 이름에 해당 실제 벨류 매핑 > var 토큰이 값을 구성할 수 있게 함 */
          scssModeStyles[modeName][styleName] = "$" + tokenName;

          // 이름이 중첩되기 때문에 이전 값이 있으면 중첩될거임
        } else if (length === 1) {
          // mode가 하나라서 기본 값에 데이터를 넣는다
          // 이름이 한개면 선택지가 없으니까 그냥 때려박음
          if (globalName[styleName] == null) globalName[styleName] = [];
          globalName[styleName].push(variable);

          if (globalName[styleName].length > 1) {
            LLog("debug", "겹침 :", variable);
          }
          defaultScssStyles[styleName] = "$" + tokenName;
        }

        // 공통 로직
        // 3. 이름으로 토큰 선언해서 실질적으로 시스템으로써 쓸 수 있게 해주는 구간
        // var에 쓰는 이름이랑 scss이름이랑 실질적으로 같은게 맞다
        // ${스타일}: var(--{스타일}, ${token});
        if (scssVariableStyles["$" + styleName] == null)
          scssVariableStyles["$" + styleName] = getVarName(
            styleName,
            tokenName
          );
      };

      for (const variable of variablesList1) {
        const variableCollectionId = variable.variableCollectionId;
        const parent = findOne(
          collectionsList1,
          (item) => item.id === variableCollectionId
        );
        /** 생성 코드  */

        // 일단 콜렉션은 로컬에만 존재함
        if (parent) {
          const modes = parent.modes;
          const parentCollection = findOne(
            collectionsList1,
            (item) => item.id === variable.variableCollectionId
          );
          if (parentCollection == null)
            return console.log(
              "parent 로 검증되는 값이라 필요 없는데 타입 때문에 넣은 코드라서 나오면 문제 있음"
            );
          const styleName = toStyleName(
            variable,
            parentCollection,
            errorTokens
          );

          // 모드에 데이터를 넣는다

          for (const mode of modes) {
            // color 일단 컬러만 처리해야하므로 그냥 숫자도 토큰화해보자
            // if (variable.resolvedType === "COLOR") {
            await cssProcess(modes.length, styleName, variable, mode);
            // }
          }
        } else {
          // remote variable 체크 코드
          // css process써야해서 넣었음
          if (variable.resolvedType === "COLOR") {
            const mode = {
              modeId: Object.keys(variable.valuesByMode)[0],
              name: "If you find this letter, report it",
            };

            const styleName = toStyleName(variable, remoteParent, errorTokens);
            // 항상 기본 값으로 처리하고 그래도 모드 값은 가지고 있어라라는 의미
            // remote collection 읽는 코드 안넣어서 없음
            await cssProcess(1, styleName, variable, mode);
          }
        }

        // const defaultModeId = variable.variableCollectionId;
      }
      // convertRgbColorToHexColor

      // variable 처리

      const isVariable = (variab: TokenValue): variab is Variable => {
        if (
          typeof variab === "object" &&
          "id" in variab &&
          variab.id.startsWith(VID)
        )
          return true;
        return false;
      };

      const isRGB = (variab: TokenValue): variab is RGB | RGBA => {
        if (
          typeof variab === "object" &&
          "r" in variab &&
          "g" in variab &&
          "b" in variab
        )
          return true;
        return false;
      };

      // 사용할 수 있는 모드 종류
      // 사용할 수 있는 모든 별칭 scss 키 ( 모든 vari key 기도 함 )
      //  ---

      // 일단 토큰 처리 완료 됨
      // token value 처리를 하지 않음 > 쌩 객체인 상태임
      // 아직 처리된 걸로 파일을 만드는 작업을 하지 않음
      //
      // console.log(variablesList1);

      // 텍스트, 이펙트 , 그리드는 아직 목적이 불분명함
      // 일단 그라디언트는 필요하긴 해

      const paintProcess = async (styleName: string, paint: PaintStyle) => {
        const modeId = "stylePaint";
        const modeName = "stylePaintName";

        // console.log(variable, "name::", toStyleName(variable));

        // 생성된 스타일 이름과 모드를 포함해서 데이터를 읽고 저장하는 코드가 필요함
        // 전체 이름 중복 검사를 위한 코드인데 지금 당장 할 필요가 있나?
        // globalName[ toStyleName(variable)] = toStyleName(variable)

        // 1. 토큰으로 구성
        // 고유식별토큰이름으로 ${token}: value

        const paints = [...paint.paints];

        // 토큰화 하긴 해야 함 근데 이건 딱히 변수로 선언되지 않고 한개만 존재해서...

        // 콜론과 컴마가 특징
        // S:f67c03c344efac0ad56a8a381bfb1781edb397ba,
        // const tokenName = paint.id.replace(/:/g, "").replace(//g, "");
        const tokenName = base64TokenEncode(hexToBase64(paint.key));

        const data = getPaintValue(paints);

        // const text =
        //   "background-image: " +
        //   data.backgroundImage +
        //   ";\nbackground-blend-mode: " +
        //   data.backgroundBlendMode +
        //   ";";
        // console.log(text);
        // 토큰으로써 유효하진 않음
        // 블랜드모드가.... 필요한가 이건 그냥 임의로 구현하던가 뭉개던가 안써도 되지 않을까하는 것

        tokens[tokenName] = data.backgroundImage;

        // 2. 모드에 저장
        // 스타일이라는 건 이제 고유 식별 이름
        // 대시로 구성되는 것 a-b-c 로 구성하는 것
        // 모드 이름 안에
        // --{스타일}: $고유식별토큰
        // 으로 생성할 거임 그 근거
        if (globalName[styleName] == null) globalName[styleName] = [];
        globalName[styleName].push(paint);
        if (globalName[styleName].length > 1) {
          LLog("debug", "겹침 :", paint);
        }
        defaultScssStyles[styleName] = "$" + tokenName;
        // 공통 로직
        // 3. 이름으로 토큰 선언해서 실질적으로 시스템으로써 쓸 수 있게 해주는 구간
        // var에 쓰는 이름이랑 scss이름이랑 실질적으로 같은게 맞다
        // ${스타일}: var(--{스타일}, ${token});
        scssVariableStyles["$" + styleName] = getVarName(styleName, tokenName);
      };

      const getPaintStyleName = (paint: PaintStyle) => {
        const styleName = toStyleName(
          {
            name: paint.name,
            resolvedType: "STYLE_COLOR",
          },
          remoteParent,
          errorTokens
        );
        return styleName;
      };
      /**
       * 백그라운드를 위한 스타일을
       * 1. 한번에 겹쳐서 구현한다
       * 2. div 레이어 여러 개 나눠서 구현한다
       *
       * 번외: 블랜더모드가 필요한가?
       * 토큰으로 구현하기 위해서는 어떻게 해야하는가
       * 리니어 떡칠해야하는 부분이 있음
       * 시각적인 통일을 하기 위해 리니어 떡칠됨 ㅇㅇ
       *
       * 블랜드 모드까지 쓰려면 scss로 써야하나? 어떻게?
       * 굳이도 포함
       * 블랜드랑 그라디언트를 분리하는게 좋을 것 같고 그 이유는 스펙 확인하려고
       * 변수의 변수를 호출할 수 있는지 모르겠지만 뭐 된다면 {이름}_blend , {이름}_image 를 생각하고 있음
       */
      for (const colorStyle of stylesList1) {
        // paintStyle 이더라도
        console.log(colorStyle.name);
        console.log(colorStyle);
        const styleName = getPaintStyleName(colorStyle);

        await paintProcess(styleName, colorStyle);
      }

      // for (const variable of variablesList1) {
      //   await figma.variables.get
      // }

      // 프로세스 마지막에 처리되야하는 것

      const tokensValueMap = Object.entries(tokens).map(([key, value]) => {
        // 숫자 , 문자, 불린은 스타일 선언 대상 객체가 아님
        // 어떻게 처리할 지 생각해야할 듯

        // string이 가능하게 바뀌었으므로 제거함
        const arr = ["number", "boolean"];
        if (arr.includes(typeof value)) {
          console.log("나오면 에러임", value);
        }

        // variable 여부 판단 > variable일 때의 로직
        if (isVariable(value)) {
          // const {mode} =  fromTokenId(key)

          // const styleName = toStyleName(value);

          if (value.remote) {
            // asdf 가능
            LLog("dubug", [key, value]);
          }

          const localParentCollection =
            findOne(
              collectionsList1,
              (item) => item.id === value.variableCollectionId
            ) ?? remoteParent;

          const styleName = toStyleName(
            value,
            localParentCollection,
            errorTokens
          );

          // var(이름, 그 값의 원본은?)

          // styleName
          // 변수 처리
          // 일단 무한루프는 피그마에서 막혀있음
          // 모드에 의한 분기를 처리하지 못하기 때문에

          return [key, "var(--" + styleName + ")"];
        } else if (isRGB(value)) {
          return [key, "#" + rgbaToHex(colorTo255Object(value))];
        }
        // 나머지
        return [key, value];
      });

      const designTokens = Object.fromEntries(tokensValueMap) as StringKeyValue;

      //  --- 아래 세 개가 같은 수준으로 설정 된다
      // 디자인 토큰 선언
      // scss 에서 css 만들 때 쓰는 토큰
      // 모드 선언
      // 모드 설정 없는 기본 값 선언
      LLog(
        "svg",
        "designTokens:",
        designTokens,
        "scssModeStyles:",
        scssModeStyles,
        "defaultScssStyles",
        defaultScssStyles
      );

      //  scss 에서 css 만들 때 쓰는 토큰
      // 그리고 그걸 사용할 수 있으면서 별칭으로 정의되있는 scss
      LLog("svg", "scssVariableStyles:", scssVariableStyles);
      // 에러 토큰
      LLog("svg", "errorTokens:", errorTokens);
      const sameNames = Object.entries(globalName)
        .filter(([key, value]) => value.length >= 2)
        .map(([key, variables]) => {
          const collections = variables.map((vari) => {
            // 중복 이름 검사 로직임
            //
            const collection = findOne(collectionsList1, (item) => {
              return item.id === (vari as Variable).variableCollectionId;
            });
            const isPaint = "type" in vari && vari.type === "PAINT";
            const parentName = isPaint
              ? "Local Style Paint"
              : (collection?.name ?? "error");
            return {
              collectionName: parentName,
              // variableName: '변수 이름'
              variableName: vari.name,
            } as SameNameVariableInfo;
          });
          return [key, collections] as const;
        });

      const sameNamesObject = Object.fromEntries(
        sameNames
      ) as ErrorTokenData["sameNamesObject"];

      emit<VariableGetResponseHandler>("VARIABLE_GET_RESPONSE", {
        designTokens,
        scssModeStyles,
        defaultScssStyles,
        scssVariableStyles,
        // 에러를 따로 구분해야하나?
        errorTokens,
        sameNamesObject,
      });
    });
    // #endregion

    const InspectFunction = async () => {
      const selection = figma.currentPage.selection;
      if (selection.length === 1) {
        const target = selection[0];

        // target.setPluginData("hello", "world");

        const { resultName: nodeName, alias } = toNodeName(
          target,
          globalFilter
        );
        // width , height

        const css = await target.getCSSAsync();

        // console.log(
        //   "data:",
        //   nodeName,
        //   css,
        //   target.boundVariables,
        //   target.width,
        //   target.height
        // );
        // + 효과
        // 필터가 밖에 있어서 이름 뽑는 건 외부에서 해야 함

        emit<InspectMainData>("INSPECT_MAIN_DATA", {
          nodeName,
          alias,
          css,
          width: target.width,
          height: target.height,
        });
      }
    };
    // Variables
    // #region
    on<InspectOn>("INSPECT_ON", () => {
      figma.on("selectionchange", InspectFunction);
    });

    on<InspectFilterUpdate>("INSPECT_FILTER", (data) => {
      Object.assign(globalFilter, data);
      InspectFunction();
    });

    //이게 여러번 실행해도 끌 수 있는가
    on<InspectOff>("INSPECT_OFF", () => {
      figma.off("selectionchange", InspectFunction);
    });

    //#endregion

    // Docs

    //#region

    const docsFunction = async () => {
      const currentPage = figma.currentPage;
      console.log(currentPage);

      const plan1 = currentPage.getPluginData("plan");
      const notes1 = currentPage.getPluginData("notes");
      const resource1 = currentPage.getPluginData("resource");
      const deploy1 = currentPage.getPluginData("deploy");

      const plan = safetyParse<MemoData>(plan1);
      const notes = safetyParse<MemoData>(notes1);
      const resource = safetyParse<MemoData>(resource1);
      const deploy = safetyParse<MemoData>(deploy1);

      const memos = {
        plan,
        notes,
        resource,
        deploy,
      } as AllMemo;

      emit<DocsMainAllData>("DOCS_MAIN_DATA", memos);
    };

    // 키기
    on<DocsOn>("DOCS_ON", () => {
      docsFunction();
      figma.on("currentpagechange", docsFunction);
    });

    // 수정
    on<DocsUIUpdate>("DOCS_UI_UPDATE", (key, value) => {
      console.log(key, value);
      const currentPage = figma.currentPage;
      currentPage.setPluginData(key, JSON.stringify(value));

      docsFunction();
    });

    on<DocsOff>("DOCS_OFF", () => {
      figma.off("currentpagechange", docsFunction);
    });
    //#endregion

    showUI({
      width: 300,
      height: 800,
    });
  }
  // 코드 제너레이터 코드를 넣을 수 있음
  // 일단 기본적인 코드 토크나이저 부터 시작
}
