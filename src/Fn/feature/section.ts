// 컴포넌트나 인스턴스 ,컴포넌트, page , document 를 만나기 전까지 올라갈거고
// 세션을 만날 경우 이름을 추가할 것임
// PAGE , DOCUMENT 빼고 나머지는 좀 애매하긴 함.. "COMPONENT", "COMPONENT_SET", "INSTANCE" 어짜피 안나올꺼라서..
// 이유는 이건 이름 앞에 세션 경로를 붙이는 거고 세션이 나와서 이름이 추가 됬는데 다시 컴포넌트가 나올일은 없어야 정상임
const breakPoint = ["PAGE", "DOCUMENT"];
const checkPoint = ["SECTION"];
/**
 * 컴포넌트에 맞는 이름 탐색 , name에는 현재 노드의 이름을 넣는 규칙
 * @param node
 * @param name
 * @returns
 */
export const sectionSearch = (
  node: BaseNode,
  name: string | string[]
): string[] => {
  const parent = node.parent;
  if (typeof name === "string") {
    const a = name.split("/").pop();
    if (a) name = [a];
    else name = [node.name];
    console.log("split name", name);
  }
  if (parent) {
    // 세션 정보 수집
    if (parent.type === "SECTION") {
      return sectionSearch(parent, [parent.name, ...name]);
    }
    // 이 조건에 맞으면 탐색 종료인데...
    // 상위에 세션이 하나면 이름만, 완전히 없을 경우 빈 배열이 출력 됨 나는 이름이 필요하기 때문에 빈 배열일 떄 name을 출력하도록 함
    else if (breakPoint.includes(parent.type)) {
      return name.length === 1 ? name : name.slice(1);
    }
    // 조건이 안맞으면 맞을 때까지 위로
    return sectionSearch(parent, name);
  }
  // 도큐먼트와 가장 가까운 section 이름은 제거함
  // 이유는 세션 첫번째까지는 인식하기 때문인데 이 구조를..
  return [
    "error",
    "첫번째 노드를 제대로 넣었으면 ",
    "무조건 재귀 돌다가 완전 탈출 돼야한다",
  ];
};

/**
 * 키를 기반으로 컴포넌트들의 이름을 수정
 * @param components
 * @param componentSets
 */
export const sectionRename = (
  components: Record<string, Object>,
  componentSets: Record<string, Object>
) => {
  const rootComponentKey = Object.entries(components)
    .filter(([key, value]) => !("componentSetId" in value))
    .map(([key, value]) => key);

  const rootCompId = [...Object.keys(componentSets), ...rootComponentKey];

  rootCompId.map(async (key) => {
    const target = await figma.getNodeByIdAsync(key);

    if (target) {
      let name = target.name;
      const result = sectionSearch(target, name);
      target.name = result.join("/");
    }
  });
};

/**
 * 컴포넌트 최상단 세션 찾기 없으면 undefined
 * @param node
 * @param section
 * @returns
 */
export const rootSectionSearch = (
  node: BaseNode,
  section?: string
): string | undefined => {
  const parent = node.parent;

  if (parent) {
    const name = parent.name;
    if (parent.type === "SECTION") {
      return rootSectionSearch(parent, name);
    } else if (breakPoint.includes(parent.type)) {
      return section;
    }

    return rootSectionSearch(parent, section);
  }
  return section;
};
