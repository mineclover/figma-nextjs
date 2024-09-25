import { h } from "preact";
import { Prettify } from "../../types/utilType";

import {
  objectKeys,
  SvgPaths,
  SvgPropsType,
  useKeys,
  usePropsObject,
} from "./tsFile";
import { CSSProperties } from "react";

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

export default Icon;

const Test = () => {
  return <Icon path="newFeed_Feed__Boost_Active"></Icon>;
};

type Test = Prettify<IconProps>;