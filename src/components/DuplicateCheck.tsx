import { h } from "preact";
import { SVGResult } from "../CodeGen/main";
import { useState } from "preact/hooks";
import {
  Container,
  IconLayerAnimated16,
  IconLayerImage16,
  IconLayerInstance16,
  TextColor,
} from "@create-figma-plugin/ui";

import { SelectNodeByIdZoomHandler } from "../CodeGen/types";
import { emit } from "@create-figma-plugin/utilities";
import {
  IconTarget16,
  Layer,
  Muted,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import InputSelect from "./InputSelect";

interface Props {
  resultSvg?: SVGResult["svgs"];
  generateTrigger: Function;
}

const DuplicateCheck = ({ resultSvg, generateTrigger }: Props) => {
  const [hover, setHover] = useState(false);

  if (resultSvg) {
    const target = resultSvg
      .map((svg) => {
        const isDuplicate =
          svg.name && resultSvg.filter((s) => s.name === svg.name).length > 1;
        if (isDuplicate) return { ...svg, isDuplicate: true };

        return { ...svg, isDuplicate: false };
      })
      .sort((a, b) => (a.name < b.name ? -1 : 1));

    return (
      <Container space="extraSmall">
        <Text>
          <Muted>Icons</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        {target.map((data) => (
          <InputSelect
            data={data}
            key={data.node.id + data.name}
            generateTrigger={generateTrigger}
          />
        ))}
      </Container>
    );
  }

  return null;
};

export default DuplicateCheck;
