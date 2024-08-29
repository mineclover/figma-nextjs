import { render, TabsOption, Tabs } from "@create-figma-plugin/ui";
import { h } from "preact";
import { useState } from "preact/hooks";

import Svg from "./pages/Svg";

import { NonNullableComponentTypeExtract } from "../../types/utilType";

const fn = async (files: Array<File>) => {
  const text = await files[0].text();
  console.log(files[0].name, JSON.parse(text));
};

function Plugin() {
  const nav = ["SVG 생성기", "2", "3"];

  const options: Array<TabsOption> = [
    {
      children: <Svg />,
      value: nav[0]
    },
    {
      children: <div>Bar</div>,
      value: nav[1]
    },
    {
      children: <div>Baz</div>,
      value: nav[2]
    }
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
