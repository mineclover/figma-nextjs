import { Fragment, h } from "preact";
import { SVGResult } from "../CodeGen/main";
import { useState } from "preact/hooks";
import {
  Bold,
  Container,
  IconLayerImage16,
  IconLayerInstance16,
  Stack,
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
import FolderableError from "./FolderableError";
import { ErrorTokenData, VariableTokenData } from "../CodeGen/variableMain";

type Props = {
  data?: VariableTokenData;
  errors?: ErrorTokenData;
};

const TokenErrorCheck = ({ data, errors: errorDatas }: Props) => {
  if (!data && !errorDatas) {
    return (
      <Fragment>
        <VerticalSpace space="extraSmall" />
        <Text>생성 필요</Text>
        <VerticalSpace space="extraSmall" />
      </Fragment>
    );
  }

  if (errorDatas == null) return null;

  const sames = Object.entries(errorDatas.sameNamesObject);
  const errors = Object.entries(errorDatas.errorTokens);
  const isSuccess = sames.length === 0 && errors.length === 0 && data;

  return (
    <Container space="extraSmall">
      <VerticalSpace space="extraSmall" />
      {isSuccess ? (
        <Text>생성 됨</Text>
      ) : (
        <Text>
          <Bold>수정 필요</Bold>
        </Text>
      )}
      <VerticalSpace space="extraSmall" />
      {sames.length > 0 && (
        <Fragment>
          <Text>
            <Muted>Same Name Info</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Text>
            예시: {"<{"}collection Name{"}>{"}name{"}"}
          </Text>
          <VerticalSpace space="extraSmall" />
          <Stack space="extraSmall">
            {sames.map(([key, variables]) => {
              return (
                <FolderableError name={key}>
                  <Stack space="extraSmall">
                    {variables.map((item) => {
                      return (
                        <Text>
                          <Bold>
                            {"<"}
                            {item.collectionName}
                            {">"}{" "}
                          </Bold>
                          {item.variableName}
                        </Text>
                      );
                    })}
                  </Stack>
                </FolderableError>
              );
            })}
          </Stack>
        </Fragment>
      )}
      <VerticalSpace space="large" />

      {errors.length > 0 && (
        <Fragment>
          <Text>
            <Muted>Error Token Info</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Text>
            예시: {"{"}저장된 이름{"} | {"}피그마 이름{"} | {"}타입{"}"}
          </Text>
          <VerticalSpace space="extraSmall" />
          <Stack space="extraSmall">
            {errors.map(([name, variables]) => {
              return (
                <FolderableError name={"<" + name + ">"}>
                  <Stack space="extraSmall">
                    {variables.map((item) => {
                      return <Text>{item.join(" | ")}</Text>;
                    })}
                  </Stack>
                </FolderableError>
              );
            })}
          </Stack>
        </Fragment>
      )}
    </Container>
  );
};

export default TokenErrorCheck;

// 매핑할건데

/**
 * color
 * boolean
 * flort
 * string
 *  alias
 */
