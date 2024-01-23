import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
  FileUploadButton,
  FileUploadDropzone,
  Bold,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState } from "preact/hooks";
import { EventHandler } from "@create-figma-plugin/ui";

import { CloseHandler, CreateRectanglesHandler, ScanHandler } from "./types";

const fn = async (files: Array<File>) => {
  const text = await files[0].text();
  console.log(files[0].name, JSON.parse(text));
  // console.log(files[0].name, JSON.parse(text));
};

function Plugin() {
  const [count, setCount] = useState<number | null>(5);
  const [countString, setCountString] = useState("5");
  const handleCreateRectanglesButtonClick = useCallback(
    function () {
      emit<ScanHandler>("FULL_SCAN");
    },
    [count]
  );
  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  const acceptedFileTypes = ["application/json"];
  function handleSelectedFiles(files?: Array<File>) {
    if (files) fn(files);
  }
  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      <Text>
        <Muted>Count</Muted>
      </Text>
      <VerticalSpace space="small" />
      <TextboxNumeric
        onNumericValueInput={setCount}
        onValueInput={setCountString}
        value={countString}
        variant="border"
      />
      <VerticalSpace space="extraLarge" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleCreateRectanglesButtonClick}>
          Create
        </Button>
        <Button fullWidth onClick={handleCloseButtonClick} secondary>
          Close
        </Button>
      </Columns>
      <VerticalSpace space="small" />

      <FileUploadDropzone
        acceptedFileTypes={acceptedFileTypes}
        onSelectedFiles={handleSelectedFiles}
      >
        <Text align="center">
          <Bold>Drop File here</Bold>
        </Text>
        <VerticalSpace space="small" />
        <Text align="center">
          <Muted>or</Muted>
        </Text>
        <VerticalSpace space="small" />

        <Text align="center">
          <Bold>Click and Choose</Bold>
        </Text>
      </FileUploadDropzone>
    </Container>
  );
}

export default render(Plugin);
