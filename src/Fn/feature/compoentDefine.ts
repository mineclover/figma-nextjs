import { emit } from "@create-figma-plugin/utilities";
import { CodeResponseHandler } from "../handlerTypes";
import { JSXNode } from "../type";
import { deepTraverseDefine } from "./ast";
import { FileMetaSearch, rootSectionSearch } from "./section";

export const componentDefine = async (target: ComponentNode) => {
  // document 내부는 노드를 파싱한 것과 크게 다르지 않다

  const isExportJSON = false;

  console.log(target);

  /**
   * 컴포넌트 이름
   */
  let name;
  /**
   * 컴포넌트 생성 조건 (보통 컴포넌트 셋에 부여 됨 )
   * 이걸 사용할지는 잘 모르겠음
   */
  let variables;
  /**
   * props 컴포넌트
   */
  let props;
  /**
   * 노드
   */
  let node;
  /**
   * 절대 경로
   */
  let path;

  /**
   *  이름에선 생략된 이름
   */
  let rootSection;

  if (isExportJSON) {
    const temp = await target.exportAsync({
      format: "JSON_REST_V1",
    });
    //@ts-ignore
    node = temp.document;
  } else {
    node = target;
  }

  const file = FileMetaSearch(target);
  const { page, document } = file;

  if (target.type === "COMPONENT") {
    // 컴포넌트 셋이 있을 경우
    if (target.parent && target.parent.type === "COMPONENT_SET") {
      name = target.parent.name;
      variables = target.name;
      rootSection = rootSectionSearch(target.parent);
    } else {
      name = target.name;
    }
  }
  console.log("이름 페이지 도큐먼트", name, page, document);

  const meta = {
    /**
     * 컴포넌트 이름
     */
    name,
    /**
     * 컴포넌트 생성 조건 (보통 컴포넌트 셋에 부여 됨 )
     * 이걸 사용할지는 잘 모르겠음
     */
    variables,
    /**
     * props 컴포넌트
     */
    props,
    /**
     * 절대 경로
     */
    path,
  };

  const iter = deepTraverseDefine(node, path);

  console.log("이터러블", [...iter]);
};

export const componentJSXDefine = async (
  target: ComponentNode | InstanceNode
) => {
  // document 내부는 노드를 파싱한 것과 크게 다르지 않다
  console.log(
    target,
    await target.exportAsync({
      format: "JSON_REST_V1",
    })
  );
  let name;
  let variables;
  // 컴포넌트면서 부모가 있을 경우
  if (target.type === "COMPONENT") {
    if (target.parent && target.parent.type === "COMPONENT_SET") {
      name = target.parent.name;
      variables = target.name;
    } else {
      name = target.name;
    }
  } else if (target.type === "INSTANCE") {
    // INSTANCE 인스턴스일 경우 ? 이 경우가 있을까 작업을 분리해야한다
  }

  const codeSnippet = `$import

interface $componentTagName_Props extends HTMLAttributes<HTMLDivElement> {
$variableTypes
children?: React.ReactNode
}


/**
* $description
* $folderPath+ComponentTagName
*/
const $componentTagName = ({ $properties , $variables , ...props }:Props) => {
$usePropertiesStates
$variantsCase {
<div className={classComposer($folderPath+ComponentTagName,props.className)} {...props}>
$jsx($action, $className , $properties)
</div>
}
}

export default $componentTagName
`;

  const $0 = "";
  const $1 = "icon";

  const result = codeSnippet.replace(/\$0/g, $0).replace(/\$1/g, $1);

  emit<CodeResponseHandler>("CODE_RESPONSE", result);
};
