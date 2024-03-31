import { pipe } from "@fxts/core";
import { Welcome } from "../../../types/figma";
import { objectIterGenarator } from "../../utils/JF";
import { DepthData, PathData, Tree } from "../type";
import { rootSectionSearch } from "./section";

export const depthTypeMap = objectIterGenarator(<T extends Tree>(tree: T) => {
  const path = tree.path.split(":");
  return [
    tree.path,
    {
      id: tree.node.id,
      type: tree.node.type,
      name: tree.node.name,
      rootSection: tree.rootSection,
      pageName: path[0],
    },
  ] as readonly [string, DepthData];
});

// 백터는 서치에서 빼는게 좋을 것 같음
// 인스턴스는 쓸 수도 있어서 제외함
// 아니면 세션이랑 컴포넌트만 서치하는 것도 괜찮음
// 어짜피 그 외는 취급 안할꺼니까
// "DOCUMENT","PAGE",를 뺀 건   figma.currentPage.selection 호환을 위해
const selectType = ["SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE"];
const childrenIgnoreType = ["COMPONENT", "COMPONENT_SET", "INSTANCE"];
/**
 * 깊이우선 탐색
 * "SECTION", "COMPONENT", "COMPONENT_SET", "INSTANCE" 만 탐색하고 자식은 탐색하지 않는 코드
 */
export function* deepTraverse(
  node: BaseNode,
  path = "select"
): IterableIterator<Tree> {
  // 현재 노드 방문
  if (selectType.includes(node.type))
    yield { node, path, rootSection: rootSectionSearch(node) } as {
      node: SceneNode;
      path: string;
      rootSection: string | undefined;
    };
  // 자식 노드가 존재하는 경우
  if ("children" in node && node.children && node.children.length) {
    // 자식 노드를 재귀적으로 탐색

    if (!childrenIgnoreType.includes(node.type)) {
      for (let i = 0; i < node.children.length; i++) {
        yield* deepTraverse(node.children[i], path + ":" + i);
      }
    }
  }
}

/**
 * 제어 대상이 될 객체를 얻는 함수
 * @returns
 */
export const ast = async () => {
  // path , id 쌍
  // component map
  const getAll = async () => {
    const result = [] as Welcome[];
    const pathToId = [] as PathData[];
    const idToPathArray = [] as [string, PathData][];
    const promise = figma.root.children.map(async (page) => {
      // PageNodes are the only children of root
      await page.loadAsync();
      const data = (await page.exportAsync({
        format: "JSON_REST_V1",
      })) as Welcome;

      if (page.name.includes(":")) {
        figma.notify("page 이름에 : 이 있을 경우 -로 대체 됩니다");
        page.name = page.name.replace(/:/g, "-");
      }

      const temp = pipe(deepTraverse(page, page.name), depthTypeMap);
      [...temp].forEach(([key, value]) => {
        pathToId.push({ key, ...value });
        idToPathArray.push([value.id, { key, ...value }]);
        // 세션용 traverse가 필요한가?
      });

      // name은 나중에 preview나 tokens를 위해
      result.push({ ...data, name: page.name });
      return;
    });
    await Promise.allSettled(promise);
    const idToPath = Object.fromEntries(idToPathArray);
    return { result, pathToId, idToPath };
  };

  const { result: all, pathToId, idToPath } = await getAll();

  /**
   * 페이지 노드들에 exportAsync 하고 나온 컴포넌트들을 반환
   * @param all 페이지 노드를 exportAsync 한 것들의 배열 Welcome.documents 에 전체 루프를 가지고 있음
   * @returns
   */
  const componentMap = (all: Welcome[]) => {
    const allComponentSets = [] as [string, Object][];
    const allComponents = [] as [string, Object][];

    all.forEach((item) => {
      const { componentSets, components } = item;
      if (componentSets) {
        Object.entries(componentSets).forEach((item) => {
          delete item[1].key;
          delete item[1].remote;
          delete item[1].documentationLinks;
          allComponentSets.push(item);
        });
      }
      if (components) {
        Object.entries(components).forEach((item) => {
          delete item[1].key;
          delete item[1].remote;
          delete item[1].documentationLinks;
          allComponents.push(item);
        });
      }
    });

    // id에는 이 섞여있는 상태임
    // 디버깅을 위해 all result를 열어둔 상태
    return {
      allResult: all,
      componentSets: Object.fromEntries(allComponentSets),
      components: Object.fromEntries(allComponents),
      idToPath,
      pathToId,
    };
  };
  return componentMap(all);
};
