import { Button, Disclosure, TextboxMultiline } from "@create-figma-plugin/ui";

import { h } from "preact";
import { useState } from "react";
import { pathNodeType } from "../FigmaPluginUtils";
import styles from "./test.module.css";

import { MessageHandler } from "../CodeGen/types";
import { emit } from "@create-figma-plugin/utilities";
import { SVGResult } from "../CodeGen/main";

type Props = {
  name: string;
  attrs: SVGResult["svgs"][number]["attrs"];
};

const attrsToStyle = (name: string, attrs: Props["attrs"]) => {
  const styles = {} as Record<string, string>;
  let css = "." + name + " {";

  Object.keys(attrs).forEach((key) => {
    if (key === "currentColor") {
      styles["color"] = attrs[key];
    } else {
      styles["--" + key] = attrs[key];
    }
  });
  Object.keys(attrs).forEach((key) => {
    if (key === "currentColor") {
      css += "color :" + attrs[key];
    } else {
      css += "--" + key + " : " + attrs[key];
    }
    css += ";";
  });
  css += "}";
  return {
    css,
    styles,
  };
};

const FolderableCode = ({ name, attrs }: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  // const camel = Object.entries(attrs).map(([key, value]) => {});
  const camel = (text: string) =>
    text
      .split("-")
      .map((t, index) => {
        if (index > 0) return t.charAt(0).toUpperCase() + t.slice(1);
        return t;
      })
      .join("");

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
        value={JSON.stringify(attrsToStyle(name, attrs))}
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
