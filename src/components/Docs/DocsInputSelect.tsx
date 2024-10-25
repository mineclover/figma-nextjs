import { Fragment, h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  IconLayerInstance16,
  IconLayerImage16,
  IconTarget16,
  Layer,
  IconPencil32,
  IconLayerAnimated16,
  IconHyperlink16,
  IconSwap16,
  IconSwap32,
  IconLayerText16,
  IconCode16,
} from "@create-figma-plugin/ui";

import { compareStringArrays, emit } from "@create-figma-plugin/utilities";
import { generateRandomText } from "../../utils/textTools";
import {
  DocsSelectData,
  MemoData,
  MemoType,
} from "../../CodeGen/pages/docsHandlerType";
import { parseGitHubCodeURL } from "../../utils/urlParser";

type Props = {
  keyName: MemoType;
  data: MemoData;
  index: number;
  generateTrigger: (data: Props["data"], index: Props["index"]) => void;
};

const typeIcon = (editLink: boolean, link: string) => {
  const github = parseGitHubCodeURL(link);
  const vscodeDeepLink = "vscode://file/Users/junwoobang/test/";
  // https://www.notion.so/sidewalkplay/1192deac83b880b1b8bcfdf2c843482f
  const arr = [
    <IconHyperlink16
      onClick={() => {
        window.open(link, "_blank");
      }}
    />,
  ];

  // 깃허브 등등 추가

  if (github)
    arr.push(
      <IconCode16
        onClick={() => {
          window.open(
            [vscodeDeepLink, github.projectName, github.filePath].join("/"),
            "_blank"
          );
        }}
      />
    );

  return arr;
};

const DocsInputSelect = ({ keyName, data, index, generateTrigger }: Props) => {
  const [hover, setHover] = useState(false);
  const [name, setTitle] = useState(data.name);
  const [link, setLink] = useState(data.link);
  const [editLinkData, setEditData] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const activeColor = "var(--figma-color-bg-brand)";
  const disabledColor = "transparent";

  const getColor = (bool: boolean) => {
    return hover ? activeColor : disabledColor;
  };

  const update = () => {
    if (editLinkData) {
      if (data.link !== link) {
        generateTrigger(
          {
            name,
            link,
          },
          index
        );
      }
    } else {
      if (data.name !== name) {
        generateTrigger(
          {
            name,
            link,
          },
          index
        );
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        border: "2px solid " + getColor(hover),
        padding: "4px 8px",
        alignItems: "center",
      }}
      onClick={(e) => {
        e.preventDefault();
      }}
      onDblClick={(e) => {
        ref.current?.focus();
      }}
    >
      {typeIcon(editLinkData, data.link)}
      <input
        ref={ref}
        value={editLinkData ? link : name}
        style={{
          backgroundColor: disabledColor,
          display: "inline-flex",
          flexGrow: 1,
        }}
        onChange={(e) => {
          if (editLinkData) {
            if (e.currentTarget.value.startsWith("/")) {
              // vscode 에 파일의 최신 브런치 해시값으로 깃허브 경로 복사하는 기능과
              // 원하는 브런치 기준으로 깃허브 경로 복사하는 기능이 있어서 상대경로가 넘어왔을 때 임의로 추가하는 기능은 필요 없을 듯 하다
              // 로컬 파일에서의 상대 경로 관리만 하면 될듯
            }
            setLink(e.currentTarget.value);
          } else setTitle(e.currentTarget.value);
        }}
        onKeyUp={async (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            setHover(false);
            update();

            // if (e.currentTarget.value === "") {
            //   return generateTrigger();
            // }
          }
        }}
        onFocus={(e) => {
          setHover(true);
        }}
        onBlur={(e) => {
          setHover(false);
          update();

          // 공백이면 다시 가져와라
          // 갱신 콜 보내라
        }}

        // onChange={(e: h.JSX.TargetedFocusEvent<HTMLInputElement>) => {
        //   console.log("in:", e.currentTarget.value);
        //   setText(e.currentTarget.value);
        // }}
      ></input>
      <IconSwap32
        onClick={() => {
          setEditData((value) => !value);
        }}
      />
    </div>
  );
};

export default DocsInputSelect;
