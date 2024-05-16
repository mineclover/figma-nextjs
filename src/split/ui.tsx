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
import { EventHandler } from "@create-figma-plugin/ui";

import { CloseHandler, SvgSymbolHandler, MessageHandler } from "./types";
import { ScanHandler } from "./types";

const fn = async (files: Array<File>) => {
  const text = await files[0].text();
  console.log(files[0].name, JSON.parse(text));
  // console.log(files[0].name, JSON.parse(text));
};

function Plugin() {
  const [text, setText] = useState("");

  const handleButtonClick = () => emit<SvgSymbolHandler>("SVG_SYMBOL_CODE");

  function handleValueInput(newValue: string) {
    setText(newValue);
  }
  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  useEffect(() => {
    on<ScanHandler>("TEXT_RESULT", (result) => {
      setText(result);
    });
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      <Text>
        <Muted>duplicate name</Muted>
      </Text>
      <VerticalSpace space="small" />

      <Text>
        <Muted>unsupportedKeys name</Muted>
      </Text>
      <VerticalSpace space="small" />

      <Columns space="extraSmall">
        <Button fullWidth onClick={handleButtonClick}>
          Create
        </Button>
        <Button fullWidth onClick={handleCloseButtonClick} secondary>
          Close
        </Button>
      </Columns>
      <VerticalSpace space="extraLarge" />

      <TextboxMultiline
        onValueInput={handleValueInput}
        onClick={(e) => {
          if (e.currentTarget.value.length > 10) {
            document.execCommand("selectAll");
            document.execCommand("copy");
            emit<MessageHandler>("POST_MESSAGE", "복사 완료");
          }
        }}
        value={text}
      ></TextboxMultiline>
    </Container>
  );
}

export default render(Plugin);
