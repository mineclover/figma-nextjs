import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SelectList } from "../CodeGen/types";
import { SVGResult } from "../CodeGen/main";
import { FilterType } from "../FigmaPluginUtils";
import { camel, varToName } from "./textTools";
import { attrsToStyle } from "../components/FolderableCode";

// 텍스트 대체 기능 수행하는 함수
// object의 키가 전환될 $key로 사용되고 그 내용으로 대체하는 구조
const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  return Object.keys(variables).reduce((result, key) => {
    const regex = new RegExp(`\\$${key}`, "g");
    return result.replace(regex, variables[key]);
  }, template);
};

const IconComp = `import { CSSProperties } from "react";

type IconProps = {
  alt?: string;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
};

type NullableString = string | boolean | undefined;

/**
 * safety class Composer util
 * @example clc(styles.a,styles.b,'c')
 * @param classNames
 * @returns {string}
 */
const clc = (...classNames: NullableString[]) => {
  return classNames
    .filter((text): text is string => typeof text === "string")
    .map((txt) => txt.trim())
    .join(" ");
};

const fillStyles = (isFill?: boolean) => {
  if (isFill)
    return {
      objectFit: "cover",
    } as const;
  return {};
};

/**
 * svg를 저장하는 위치에 따라 다르게 정의해야함
 *
 * public/~
 */
const objectPath = "/object/";
const Icon = <T extends SvgPaths>(props: SvgPropsType<T> & IconProps) => {
  // use 랑 object 분기 처리
  // 그냥 리스트에서 이름 있는 쪽으로 분기 처리
  const isUse = (useKeys as unknown as string[]).includes(props.path);
  const isObject = (objectKeys as unknown as string[]).includes(props.path);

  const alt = props.alt == null ? props.path : props.alt;

  if (isUse) {
    // asset 저장 방식에 맞춰서 호출
    // 만약 코드에 인라인으로 넣게 되면 바로 # 만 쓰면 된다
    // 외부 경로에서 오는 것은 고려하지 않아도 되는게 CORS 에러 나서 외부 리소스를 SVGUSE로 쓸 수 없다
    const assetPath = "/asset.svg#";
    const path = props.path as (typeof useKeys)[number];
    const src = assetPath + path;

    // var props 추출해서 스타일에 넣는 코드,
    // use에만 적용하면 됨 > object에는 해당 코드를 제거했기 때문

    // 대충 propsKey : cssKey 임
    const varNames = Object.entries(usePropsObject[path]);

    const varStyles = {} as Record<string, string>;

    for (const [pk, cssKey] of varNames) {
      //@ts-ignore
      const pkValue = props[pk];
      varStyles["--" + cssKey] = pkValue;
    }

    return (
      <svg
        style={{ ...fillStyles(props.fill), ...varStyles, ...props.style }}
        className={clc(props.className)}
        aria-label={alt}
      >
        <use href={src} xlinkHref={src} />
      </svg>
    );
  }

  if (isObject) {
    // Object 저장 방식에 맞춰서 처리
    const assetPath = objectPath;
    const path = props.path as (typeof objectKeys)[number];
    const src = assetPath + path + ".svg";

    return (
      <object
        type={"image/svg+xml"}
        data={src}
        aria-label={alt}
        className={clc(props.className)}
        role="img"
        style={{
          ...fillStyles(props.fill),
          pointerEvents: "none",
          ...props.style,
        }}
      ></object>
    );
  }

  return <div>{props.path}가 존재하지 않습니다</div>;
};

export default Icon;`;

// 사용 예시

export const svgExporter = async (
  svgData: SVGResult["svgs"],
  settings: { sections: SelectList[]; filter: FilterType }
) => {
  const zipFile = new JSZip();
  const useList = svgData.filter((item) => item.type === "use");
  const objectList = svgData.filter((item) => item.type === "object");
  const useSvgList = useList.map((item) => item.raw);

  // .ts 파일 생성

  // use 인지 object 든 조건 분기에 필요한 것
  const typeSuffix = "Type";
  const listSuffix = "KeyList";

  let tsTemplate = `export type $name${typeSuffix} = $union`;
  let constTemplate = `export const $name${listSuffix} = [$array]`;

  const useUnion = useList.map((node) => `"${node.name}"`);

  const USE_NAME = "use";
  const useNameType = replaceTemplateVariables(tsTemplate, {
    name: USE_NAME,
    union: useUnion.join(" | "),
  });
  const useNameList = replaceTemplateVariables(constTemplate, {
    name: USE_NAME,
    array: useUnion.join(", "),
  });

  console.log("useNameType::", useNameType, "useNameList::", useNameList);

  const OBJECT_NAME = "object";
  const objectUnion = objectList.map((node) => `"${node.name}"`);

  const objectNameType = replaceTemplateVariables(tsTemplate, {
    name: OBJECT_NAME,
    union: useUnion.join(" | "),
  });

  const objectNameList = replaceTemplateVariables(constTemplate, {
    name: OBJECT_NAME,
    array: objectUnion.join(", "),
  });

  console.log(
    "objectNameType::",
    objectNameType,
    "objectNameList::",
    objectNameList
  );

  // props 읽어서 styles 로 추출할 때 읽어야하는 default style set
  // path 기준으로 attrs 저장
  const defaultStyles = svgData.reduce(
    (acc, node) => {
      const path = node.name;

      // props 는 camelcase 로 통일
      const temp = Object.entries(node.attrs).map(([key, value]) => {
        return [camel(key), value];
      });
      const attrs = Object.fromEntries(temp);

      acc[path] = attrs; // object에 속성 추가
      return acc; // 누적된 객체 반환
    },
    {} as Record<string, SVGResult["svgs"][number]["attrs"]>
  );

  // console;

  // 사용할 코드 구현해놓고, 그거 그대로 복붙해서 생성하게해야함 ㅇㅇ..

  // asset.svg 생성
  const result = `<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${useSvgList.join("\n")}
  </defs>
</svg>`;
  zipFile.file("asset.svg", result);

  // 아이콘 메타데이터 리스트 정리
  const all = svgData.map((item) => ({
    name: item.name,
    attrs: item.attrs,
    node: item.node,
    type: item.type,
    nodeInfo: item.nodeInfo,
  }));
  zipFile.file("settings.json", JSON.stringify({ ...settings, all }));

  // 타입 일괄 추출

  const types = svgData.map((item) => {
    const spec = attrsToStyle(item.name, item.attrs);
    return spec.type;
  });

  const useKeys = useList.map((item) => '"' + item.name + '"');
  const objectKeys = objectList.map((item) => '"' + item.name + '"');

  let tsFile = "export type SvgTypes = " + types.join(" | ") + ";\n";

  tsFile += "export const useKeys = [" + useKeys.join(", ") + "] as const;";
  tsFile +=
    "export const objectKeys = [" + objectKeys.join(", ") + "] as const;";

  tsFile +=
    "export type SvgPaths = SvgTypes['path']; // Svg들의 path 타입을 추출\n";
  tsFile +=
    "export type SvgPropsType<T extends SvgPaths> = Extract<SvgTypes, { path: T }>;\n";
  // useProps 객체 추출

  const usePropsObject = useList.reduce((pre, cur) => {
    const key = cur.name;
    const decode = Object.entries(cur.attrs).map(([key, value]) => {
      return [varToName(key), key];
    });
    const encode = Object.fromEntries(decode);
    return Object.assign(pre, {
      [key]: encode,
    });
  }, {});

  tsFile +=
    "export const usePropsObject = " + JSON.stringify(usePropsObject) + ";";

  // 유틸 코드
  tsFile += IconComp;

  zipFile.file("Icon.tsx", tsFile);

  // object/~.svg 생성
  const objectFolder = zipFile.folder("object");
  if (objectFolder) {
    for (const svg of objectList) {
      objectFolder.file(svg.name + ".svg", svg.raw);
    }
  }

  zipFile.generateAsync({ type: "blob" }).then(function callback(blob) {
    saveAs(blob, "export.zip");
  });
};

// type Color = string;
// type Percent = number;

type SvgType =
  | {
      path: "newFeed_Feed__View1";

      /** #FDFDFE */
      color1: string;
      /** 0.1 */
      percent1: number;
    }
  | {
      path: "newFeed_Feed__View2";
      /** #FDFDFE */
      color1: string;
      /** 0.1 */
      percent1: number;
      /** #FDFDFE */
      color2: string;
    }
  | {
      path: "newFeed_Feed__View3";
    }
  | {
      path: "newFeed_Feed__View4";
    };

type UsePath = SvgType["path"]; // Use의 path 타입을 추출

type UseType<T extends UsePath> = Extract<SvgType, { path: T }>;

// 사용 예시
const example1: UseType<"newFeed_Feed__View1"> = {
  path: "newFeed_Feed__View1",
  color1: "#FDFDFE",
  percent1: 0.1,
};
