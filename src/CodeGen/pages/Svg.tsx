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
  FileUploadDropzone,
  Checkbox,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState, useEffect, useReducer } from "preact/hooks";
import { EventHandler } from "@create-figma-plugin/ui";
import styles from "./svg.module.css";

import {
  CloseHandler,
  SvgSymbolHandler,
  MessageHandler,
  ScanHandler,
  SectionSelectUiRequestHandler,
  SectionSelectMainResponseHandler,
  SelectList,
  SelectNodeByIdZoomHandler,
  SectionSelectSvgUiRequestHandler,
} from "../types";
import {
  addUniqueSectionCurry,
  downloadJsonFile,
  handleFileInput,
  JsonToArray,
} from "../../utils/jsonFile";
import DragLayer from "../../components/DragLayer";
import { LLog } from "../../utils/console";
import { FilterType, pathNodeType } from "../../FigmaPluginUtils";

/**
 *
 * @param text
 * @param fileName .json 확장자 생략가능
 */
const handleJSONExportButtonClick = (text: string) => {
  downloadJsonFile(text);
};

const addUniqueSection = addUniqueSectionCurry<SelectList>(
  (item, index, array) => {
    return (
      index === array.findIndex((t) => t.id === item.id && t.name === item.name)
    );
  }
);

//event: h.JSX.TargetedMouseEvent<HTMLInputElement>

function Plugin() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState<boolean>(true);
  const [sections, setSections] = useState<SelectList[]>([]);
  const [x, update] = useState(0);
  const [filter, setFilter] = useState<FilterType>({
    DOCUMENT: true,
    PAGE: true,
    SECTION: true,
    COMPONENT_SET: true,
    COMPONENT: true,
  });

  const handleButtonClick = () => {
    emit<SectionSelectSvgUiRequestHandler>(
      "SECTION_SELECT_SVG_UI_GENERATE_REQUEST",
      sections,
      filter
    );
  };

  function handleValueInput(newValue: string) {
    setText(newValue);
  }

  useEffect(() => {
    on<ScanHandler>("FULL_SCAN", (result, dupl, unsup, id) => {
      setText(result);
      update((x) => x + 1);
    });

    on<SectionSelectMainResponseHandler>(
      "SECTION_SELECT_UI_RESPONSE",
      (data) => {
        setSections((array) => addUniqueSection(array, data));
      }
    );
  }, []);

  const deleteSection = (id: string) => {
    const newArray = sections.filter((selectList) => {
      return !(selectList.id === id);
    });
    setSections(newArray);
  };

  const filterActionCurry = (keyName: keyof FilterType) => {
    return {
      value: filter[keyName],
      onChange: (e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
        const value = e.currentTarget.checked;
        setFilter((data) => {
          return { ...data, [keyName]: value };
        });
      },
    };
  };

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
        <Container space="extraSmall" className={styles.extra}>
          {sections.map(({ id, name, pageName, pageId }) => {
            return (
              <DragLayer
                right={() => {
                  deleteSection(id);
                }}
                left={() => {
                  deleteSection(id);
                }}
                limit={80}
                key={id}
                description={pageName}
                icon={<IconTarget16 />}
                onClick={() => {
                  emit<SelectNodeByIdZoomHandler>(
                    "SELECT_NODE_BY_ID_ZOOM",
                    id,
                    pageId
                  );
                }}
              >
                {name}
              </DragLayer>
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
        <Button
          fullWidth
          onClick={() => {
            handleButtonClick();
          }}
        >
          {/* 만드는 중 */}
          Export SVG
        </Button>
        <Button
          fullWidth
          onClick={() => {
            // export json
            handleJSONExportButtonClick(JSON.stringify(sections));
          }}
          secondary
        >
          Export JSON
        </Button>
      </Columns>
      <VerticalSpace space="extraSmall"></VerticalSpace>
      <Disclosure
        onClick={(event) => {
          setOpen(!(open === true));
        }}
        open={open}
        title="SVG Name Compose Option"
      >
        <div className={styles.svgNameWrap}>
          {pathNodeType.map((key, index) => {
            return (
              <div key={key} className={styles.svgNameFilter}>
                <Checkbox {...filterActionCurry(key)}>
                  <Text>
                    {index + 1}. {key}
                  </Text>
                </Checkbox>
              </div>
            );
          })}{" "}
        </div>
      </Disclosure>

      <FileUploadDropzone
        onSelectedFiles={async (e) => {
          // 중복 아이디 삭제하면서 여러 json 추가 가능
          const data = await JsonToArray(e);
          data.forEach((item) => {
            setSections((array) => addUniqueSection(array, item));
          });
        }}
      >
        <Text align="center">
          <Muted>import section data json</Muted>
        </Text>
      </FileUploadDropzone>

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
