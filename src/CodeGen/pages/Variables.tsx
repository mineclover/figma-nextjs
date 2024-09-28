import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
  Code,
  TextboxMultiline,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState, useEffect } from "preact/hooks";

import {
  CloseHandler,
  SvgSymbolHandler,
  MessageHandler,
  ScanHandler,
} from "../types";
import {
  VariableGetRequestHandler,
  VariableGetResponseHandler,
} from "./variableHandlerType";

function Variables() {
  const [text, setText] = useState();

  const handleButtonClick = () =>
    emit<VariableGetRequestHandler>("VARIABLE_GET_REQUEST");

  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  useEffect(() => {
    on<VariableGetResponseHandler>("VARIABLE_GET_RESPONSE", () => {});
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleButtonClick}>
          Get Variable
        </Button>
        <Button fullWidth onClick={handleCloseButtonClick} secondary>
          Close
        </Button>
      </Columns>

      <VerticalSpace space="small" />
    </Container>
  );
}

export default Variables;
