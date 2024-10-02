import {
  render,
  TabsOption,
  Tabs,
  useWindowResize,
} from "@create-figma-plugin/ui";
import { h } from "preact";
import { useState } from "preact/hooks";

import Svg from "./pages/Svg";

type newFeed_Feed__Boost_Active = {
  path: "newFeed_Feed__Boost_Active";
  svgColor1: string;
  svgPercent2: number;
};

import { NonNullableComponentTypeExtract } from "../../types/utilType";
import Variables from "./pages/Variables";
import { emit } from "@create-figma-plugin/utilities";
import { ResizeWindowHandler } from "./types";
import Inspect from "./pages/Inspect";

const fn = async (files: Array<File>) => {
  const text = await files[0].text();
};

function Plugin() {
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit<ResizeWindowHandler>("RESIZE_WINDOW", windowSize);
  }
  useWindowResize(onWindowResize, {
    maxHeight: 1080,
    maxWidth: 1920,
    minHeight: 120,
    minWidth: 120,
    resizeBehaviorOnDoubleClick: "minimize",
  });
  const nav = ["SVG 생성기", "변수 추출", "SVG 정보 자동완성"];

  const options: Array<TabsOption> = [
    {
      children: <Svg />,
      value: nav[0],
    },
    {
      children: <Variables></Variables>,
      value: nav[1],
    },
    {
      children: <Inspect></Inspect>,
      value: nav[2],
    },
  ] as const;
  const [value, setValue] = useState<string>("SVG 생성기");

  function handleChange(
    //  event: NonNullableComponentTypeExtract<typeof Tabs, 'onChange'>
    event: Parameters<
      NonNullableComponentTypeExtract<typeof Tabs, "onChange">
    >[0]
  ) {
    const newValue = event.currentTarget.value;
    setValue(newValue);
  }
  return <Tabs onChange={handleChange} options={options} value={value} />;
}

export default render(Plugin);
