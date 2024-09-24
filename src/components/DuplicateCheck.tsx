import { h } from "preact";
import { SVGResult } from "../CodeGen/main";
import { useState } from "preact/hooks";

import { SelectNodeByIdZoomHandler } from "../CodeGen/types";
import { emit } from "@create-figma-plugin/utilities";
import {
  IconTarget16,
  Layer,
  Muted,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";

interface Props {
  resultSvg?: SVGResult["svgs"];
}

const DuplicateCheck = ({ resultSvg }: Props) => {
  const [hover, setHover] = useState(false);
  const target = resultSvg?.filter(
    (svg) => svg.name && resultSvg.filter((s) => s.name === svg.name).length > 1
  );

  if (target && target.length > 0)
    return (
      <div>
        <Text>
          <Muted>이름 중복 리스트</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        {target.map((data) => (
          <Layer
            value={hover}
            icon={<IconTarget16 />}
            onClick={(e) => {
              e.preventDefault();
              emit<SelectNodeByIdZoomHandler>(
                "SELECT_NODE_BY_ID_ZOOM",
                data.node.id,
                data.nodeInfo.pageId
              );
            }}
          >
            <span>{data.name}</span>
          </Layer>
        ))}
      </div>
    );

  return null;
};

export default DuplicateCheck;
