import { Fragment, h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { SVGResult } from "../CodeGen/main";
import {
  IconLayerInstance16,
  IconLayerImage16,
  IconTarget16,
  Layer,
  IconPencil32,
} from "@create-figma-plugin/ui";

import {
  promiseOnceSample,
  SelectNodeByIdZoomHandler,
  SelectNodeSetNameHandler,
} from "../CodeGen/types";
import { compareStringArrays, emit } from "@create-figma-plugin/utilities";
import { generateRandomText } from "../utils/textTools";

type Props = {
  data: SVGResult["svgs"][number] & {
    isDuplicate: boolean;
  };
  generateTrigger: Function;
};

const typeIcon = (type: NonNullable<Props["data"]>["type"]) => {
  if (type === "use") return <IconLayerInstance16></IconLayerInstance16>;
  if (type === "object") return <IconLayerImage16></IconLayerImage16>;
  return <IconTarget16></IconTarget16>;
};

const InputSelect = ({ data, generateTrigger }: Props) => {
  const [hover, setHover] = useState(false);
  const [text, setText] = useState(data.name);
  const ref = useRef<HTMLInputElement>(null);

  const activeColor = "var(--figma-color-bg-brand)";
  const disabledColor = "transparent";

  const getColor = (bool: boolean) => {
    return hover ? activeColor : disabledColor;
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
        if (!hover) {
          emit<SelectNodeByIdZoomHandler>(
            "SELECT_NODE_BY_ID_ZOOM",
            data.node.id,
            data.nodeInfo.pageId
          );
        }
      }}
      onDblClick={(e) => {
        ref.current?.focus();
      }}
    >
      {typeIcon(data.type)}
      <input
        ref={ref}
        defaultValue={text}
        style={{
          color: data.isDuplicate
            ? "var(--figma-color-bg-danger,red)"
            : undefined,
          backgroundColor: disabledColor,
          display: "inline-flex",
          flexGrow: 1,
        }}
        onKeyUp={async (e: h.JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            setText(e.currentTarget.value);

            const key = generateRandomText(10);
            emit<SelectNodeSetNameHandler>(
              "SELECT_NODE_SET_NAME",
              data.node.id,
              data.nodeInfo.pageId,
              e.currentTarget.value,
              key
            );
            setHover(false);
            await promiseOnceSample(key).then(() => {
              generateTrigger();
            });
            // if (e.currentTarget.value === "") {
            //   return generateTrigger();
            // }
          }
        }}
        onFocus={(e) => {
          setHover(true);
        }}
        onBlur={(e) => {
          e.currentTarget.value = text;
          setHover(false);

          // 공백이면 다시 가져와라
          // 갱신 콜 보내라
        }}

        // onChange={(e: h.JSX.TargetedFocusEvent<HTMLInputElement>) => {
        //   console.log("in:", e.currentTarget.value);
        //   setText(e.currentTarget.value);
        // }}
      ></input>
      <IconPencil32
        onClick={() => {
          ref.current?.focus();
        }}
      ></IconPencil32>
    </div>
  );
};

export default InputSelect;
