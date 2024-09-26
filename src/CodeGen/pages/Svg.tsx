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

import JSZip from "jszip";
import { saveAs } from "file-saver";

import {
  CloseHandler,
  SvgSymbolHandler,
  MessageHandler,
  ScanHandler,
  SectionSelectUiRequestHandler,
  FigmaSelectMainResponseHandler,
  SelectList,
  SelectNodeByIdZoomHandler,
  SectionSelectSvgUiRequestHandler,
  SectionSelectSvgMainResponseHandler,
} from "../types";
import {
  addArrayFilterCurry,
  addValueFilterCurry,
  handleFileInput,
  JsonToObject,
} from "../../utils/jsonFile";
import DragLayer from "../../components/DragLayer";
import { LLog } from "../../utils/console";
import { FilterType, pathNodeType } from "../../FigmaPluginUtils";
import { svgExporter } from "../../utils/svgComposer";
import { SVGResult } from "../main";
import FolderableCode from "../../components/FolderableCode";
import DuplicateCheck from "../../components/DuplicateCheck";

/**
 *
 * @param text
 * @param fileName .json 확장자 생략가능
 */

const addUniqueSection = addValueFilterCurry<SelectList>(
  (item, index, array) => {
    return (
      index === array.findIndex((t) => t.id === item.id && t.name === item.name)
    );
  }
);

const addUniqueArraySection = addArrayFilterCurry<SelectList>(
  (item, index, array) => {
    return (
      index === array.findIndex((t) => t.id === item.id && t.name === item.name)
    );
  }
);

//event: h.JSX.TargetedMouseEvent<HTMLInputElement>

function Plugin() {
  const [text, setText] = useState("");
  const [selectOpen, setSelectOpen] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(true);
  const [sections, setSections] = useState<SelectList[]>([]);
  const [x, update] = useState(0);
  const [filter, setFilter] = useState<FilterType>({
    DOCUMENT: true,
    PAGE: true,
    SECTION: true,
    COMPONENT_SET: true,
    COMPONENT: true,
  });
  useEffect(() => {
    generateTrigger();
  }, [filter, sections]);

  const [resultSvg, setResultSvg] = useState<SVGResult["svgs"]>();

  const generateTrigger = () => {
    emit<SectionSelectSvgUiRequestHandler>(
      "SECTION_SELECT_SVG_UI_GENERATE_REQUEST",
      sections,
      filter
    );
  };

  useEffect(() => {
    on<ScanHandler>("FULL_SCAN", (result, dupl, unsup, id) => {
      setText(result);
      update((x) => x + 1);
    });
    on<SectionSelectSvgMainResponseHandler>(
      "SECTION_SELECT_SVG_MAIN_GENERATE_RESPONSE",
      (result) => {
        setResultSvg(result);
      }
    );

    on<FigmaSelectMainResponseHandler>("SECTION_SELECT_UI_RESPONSE", (data) => {
      setSections((array) => addUniqueSection(array, data));
    });
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
          setSelectOpen(!(selectOpen === true));
        }}
        open={selectOpen}
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
                onClick={(e) => {
                  e.preventDefault();
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
        {/* <Button
          fullWidth
          onClick={() => {
            // export json
            saveAs(
              new Blob([JSON.stringify(sections)], {
                type: "application/json",
              }),
              "export.json"
            );
          }}
          secondary
        >
          Export JSON
        </Button> */}
        <Button
          fullWidth
          onClick={() => {
            if (resultSvg)
              svgExporter(resultSvg, {
                sections,
                filter,
              });
          }}
        >
          {/* 만드는 중 */}
          Export SVG
        </Button>
      </Columns>

      <VerticalSpace space="extraSmall"></VerticalSpace>
      <Disclosure
        onClick={(event) => {
          setFilterOpen(!(filterOpen === true));
        }}
        open={filterOpen}
        title="Naming Option"
      >
        <div className={styles.svgNameWrap}>
          {pathNodeType
            .filter((t) => t !== "COMPONENT")
            .map((key, index) => {
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
          const data = await JsonToObject(e);
          // 읽은 json 들에서 sections만 읽어서 array로 궈성
          const jsonSections = data.flatMap((i) => i.sections);
          setSections((array) => addUniqueArraySection(array, jsonSections));
        }}
      >
        <Text align="center">
          <Muted>import section data json</Muted>
        </Text>
      </FileUploadDropzone>
      <VerticalSpace space="small" />
      <DuplicateCheck resultSvg={resultSvg}></DuplicateCheck>

      <VerticalSpace space="small" />
    </Container>
  );
}

export default Plugin;
