import { h } from "preact";
import { SVGResult } from "../CodeGen/main";
import { useState } from "preact/hooks";
import {
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

interface Props {
  resultSvg?: SVGResult["svgs"];
}

const typeICon = (type: NonNullable<Props["resultSvg"]>[number]["type"]) => {
  if (type === "use") return <IconLayerInstance16></IconLayerInstance16>;
  if (type === "object") return <IconLayerImage16></IconLayerImage16>;
  return <IconTarget16></IconTarget16>;
};

const DuplicateCheck = ({ resultSvg }: Props) => {
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
      <div>
        <Text>
          <Muted>Icons</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        {target.map((data) => (
          <Layer
            value={hover}
            icon={typeICon(data.type)}
            onClick={(e) => {
              e.preventDefault();
              emit<SelectNodeByIdZoomHandler>(
                "SELECT_NODE_BY_ID_ZOOM",
                data.node.id,
                data.nodeInfo.pageId
              );
            }}
          >
            <span
              style={{
                color: data.isDuplicate
                  ? "var(--figma-color-bg-danger,red)"
                  : undefined,
              }}
            >
              {data.name}
            </span>
          </Layer>
        ))}
      </div>
    );
  }

  return null;
};

export default DuplicateCheck;
