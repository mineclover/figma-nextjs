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
  IconPlus32,
  IconTarget32,
  IconLayerFrameCoverArt16,
  IconTarget16,
  SelectableItem,
  Textbox,
  Layer,
  Disclosure,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState, useEffect, useReducer } from "preact/hooks";
import { EventHandler } from "@create-figma-plugin/ui";

import {
  CloseHandler,
  SvgSymbolHandler,
  MessageHandler,
  ScanHandler,
  SectionSelectUiRequestHandler,
  SectionSelectMainResponseHandler,
  SelectList,
  SelectNodeByIdUiHandler,
} from "../types";

const fn = async (files: Array<File>) => {
  const text = await files[0].text();
  console.log(files[0].name, JSON.parse(text));
  // console.log(files[0].name, JSON.parse(text));
};

//event: h.JSX.TargetedMouseEvent<HTMLInputElement>

function Plugin() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState<boolean>(true);
  const [sections, setSections] = useState<SelectList[]>([]);
  const [x, update] = useState(0);

  console.log("sections::", x, sections);
  const handleButtonClick = () => {
    emit<SvgSymbolHandler>("SVG_SYMBOL_CODE");
  };

  function handleValueInput(newValue: string) {
    setText(newValue);
  }
  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  useEffect(() => {
    console.log("effect");
    on<ScanHandler>("FULL_SCAN", (result, dupl, unsup, id) => {
      setText(result);
      update((x) => x + 1);
    });

    on<SectionSelectMainResponseHandler>(
      "SECTION_SELECT_UI_RESPONSE",
      (data) => {
        setSections((array) =>
          [...array, data].filter(
            (item, index, self) =>
              index ===
              self.findIndex((t) => t.id === item.id && t.name === item.name)
          )
        );
      }
    );
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />
      <Text>section select</Text>
      <VerticalSpace space="medium" />
      <Textbox
        icon={<IconPlus32></IconPlus32>}
        value={"섹션 추가"}
        readOnly
        onClick={(e) => {
          emit<SectionSelectUiRequestHandler>("SECTION_SELECT_UI_REQUEST");
        }}
      ></Textbox>
      <Disclosure
        onClick={(event) => {
          setOpen(!(open === true));
        }}
        open={open}
        title="Select List"
      >
        <Container
          space="extraSmall"
          style={{ maxHeight: 150, overflow: "auto" }}
        >
          {sections.map(({ id, name, pageName, pageId }) => {
            return (
              <Layer
                key={id}
                description={pageName}
                icon={<IconTarget16 />}
                onMouseDown={() => {
                  emit<SelectNodeByIdUiHandler>(
                    "SELECT_NODE_BY_ID_UI",
                    id,
                    pageId
                  );
                }}
                value={false}
              >
                {name}
              </Layer>
            );
          })}
        </Container>
      </Disclosure>

      <div
        style={{
          display: "flex",
          direction: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 4,
          padding: 4,
        }}
      ></div>
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleButtonClick}>
          Create
        </Button>
        <Button fullWidth onClick={handleCloseButtonClick} secondary>
          {/* <Button fullWidth onClick={(handleCloseButtonClick)} secondary> */}
          Close
        </Button>
      </Columns>
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

export default Plugin;
