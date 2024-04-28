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

import {
  CloseHandler,
  MessageHandler,
  AssetRequestHandler,
  CodeResponseHandler,
} from "./handlerTypes";

const fn = async (files: Array<File>) => {
  const text = await files[0].text();
  console.log(files[0].name, JSON.parse(text));
  // console.log(files[0].name, JSON.parse(text));
};

function Plugin() {
  const [text, setText] = useState("");
  const [duplicate, setDuplicate] = useState<string[]>([]);
  const [unsupportedKeys, setUnsupportedKeys] = useState<string[]>([]);
  const [ids, setIds] = useState<string[]>([]);

  function handleValueInput(newValue: string) {
    setText(newValue);
  }
  const AssetClick = useCallback(function () {
    emit<AssetRequestHandler>("ASSET_REQUEST");
  }, []);
  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  useEffect(() => {
    on<CodeResponseHandler>("CODE_RESPONSE", (result) => {
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
      {duplicate.map((item) => (
        <Text>{item}</Text>
      ))}
      <VerticalSpace space="extraLarge" />
      <Text>
        <Muted>unsupportedKeys name</Muted>
      </Text>
      <VerticalSpace space="small" />
      {unsupportedKeys.map((item) => (
        <Text>{item}</Text>
      ))}
      <VerticalSpace space="extraLarge" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={AssetClick}>
          Create
        </Button>
        <Button fullWidth onClick={handleCloseButtonClick} secondary>
          Close
        </Button>
      </Columns>
      <VerticalSpace space="extraLarge" />
      <Text>
        <Muted>Icon Code : {ids.length}</Muted>
      </Text>
      <VerticalSpace space="small" />
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
