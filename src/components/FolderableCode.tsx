import { Button, Disclosure, TextboxMultiline } from "@create-figma-plugin/ui";

import { h } from "preact";
import { useState } from "react";
import { pathNodeType } from "../FigmaPluginUtils";
import styles from "./test.module.css";

import { MessageHandler } from "../CodeGen/types";
import { emit } from "@create-figma-plugin/utilities";
import { SVGResult } from "../CodeGen/main";
import {
  safeNumberConversion,
  typeofNumber,
  varToName,
} from "../utils/textTools";

type Props = {
  name: string;
  attrs: SVGResult["svgs"][number]["attrs"];
};
type TypeOptions = SVGResult["svgs"][number]["type"];

const typeTemplate = "type $PascalName = ({ path: $name; $types } & $kind )";

const typeMap = {
  svg: "SVGProps",
  use: "ObjectProps",
  image: "ImageProps",
} as const;

export const attrsToStyle = (
  name: string,
  attrs: Props["attrs"],
  kind: TypeOptions
) => {
  const styles = {} as Record<string, string | number>;
  let css = "." + name + " {";
  // 타입 선언은 타입 선언인데 이걸 정확한 위치로 어떻게 이동시키느냐가 문제임
  // 일단 키 이름이 다르고, 키 타입도 달라서 문제가 됨
  // Icon 컴포넌트 내부에서 path로 분기처리하면서 유효 타입도 처리하는 방법이 있긴 함
  let type = "({";

  const types = [] as string[];

  // styles
  // props에 들어가기 떄문에 json에 맞춰서 출력되는게 맞음 그래서 객체로 정의했음
  Object.keys(attrs).forEach((key) => {
    if (key === "currentColor") {
      styles["color"] = attrs[key];
    } else {
      styles["--" + key] = safeNumberConversion(attrs[key]);
    }
  });

  // css
  Object.keys(attrs).forEach((key) => {
    if (key === "currentColor") {
      css += "color :" + attrs[key] + ";";
    } else {
      css += "--" + key + " : " + safeNumberConversion(attrs[key]) + ";";
    }
  });
  css += "}";

  // type
  type += `path: '${name}';`;
  Object.keys(attrs).forEach((key) => {
    type += `\n/** ${attrs[key]} */\n`;

    type +=
      varToName(key) +
      " ?: " +
      (typeofNumber(attrs[key]) ? "number" : "string") +
      ";";
  });
  type += "}";
  type += "& " + typeMap[kind as keyof typeof typeMap] + ")";

  return {
    css,
    styles,
    type,
  };
};

const FolderableCode = ({ name, attrs }: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  // const camel = Object.entries(attrs).map(([key, value]) => {});

  return (
    <Disclosure
      onClick={(event) => {
        setOpen(!(open === true));
      }}
      open={open}
      title={name}
    >
      {/* 딸칵 이름 .. 그냥 이름만 */}
      <input
        onClick={(e) => {
          if (e.currentTarget.value.length > 0) {
            document.execCommand("selectAll");
            document.execCommand("copy");
          }
        }}
        value={name}
      ></input>
      {/* 딸칵 컴포넌트 > 리엑트 코드 말하는거임 props에 다 넣어야됨 ㅇㅇ.. */}
      <TextboxMultiline
        onClick={(e) => {
          if (e.currentTarget.value.length > 10) {
            document.execCommand("selectAll");
            document.execCommand("copy");
            emit<MessageHandler>("POST_MESSAGE", "복사 완료");
          }
        }}
        // css , styles
        value={JSON.stringify(attrsToStyle(name, attrs, "svg"))}
      ></TextboxMultiline>
      {/* 딸칵 스타일  */}
      <TextboxMultiline
        onClick={(e) => {
          if (e.currentTarget.value.length > 10) {
            document.execCommand("selectAll");
            document.execCommand("copy");
            emit<MessageHandler>("POST_MESSAGE", "복사 완료");
          }
        }}
        value={JSON.stringify(attrs)}
      ></TextboxMultiline>
    </Disclosure>
  );
};

export default FolderableCode;
