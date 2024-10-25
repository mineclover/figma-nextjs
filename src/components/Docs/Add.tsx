import {
  Button,
  Disclosure,
  TextboxMultiline,
  Text,
  Bold,
  VerticalSpace,
} from "@create-figma-plugin/ui";

import { h } from "preact";
import { useState } from "react";
import { emit } from "@create-figma-plugin/utilities";
import {
  DocsUIUpdate,
  MemoData,
  MemoType,
} from "../../CodeGen/pages/docsHandlerType";
import DocsInputSelect from "./DocsInputSelect";
import DragLayer from "./DragLayer";

type Props = {
  keyName: MemoType;
  data: MemoData[];
};

const DocsTap = ({ keyName, data }: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  const keyUpdate = (nextData: MemoData, index: number) => {
    return data.map((d, i) => {
      if (i === index) return nextData;
      return d;
    });
  };

  const keyDataAdd = (nextData: MemoData) => {
    return [...data, nextData];
  };

  const keyDelete = (index: number) => {
    return data.filter((d, i) => {
      if (i === index) return false;
      return true;
    });
  };

  return (
    <Disclosure
      onClick={(event) => {
        setOpen(!(open === true));
      }}
      open={open}
      title={keyName.toUpperCase() + " LINK"}
    >
      {data.map((memo, index) => {
        return (
          <DragLayer
            limit={80}
            right={() => {
              emit<DocsUIUpdate>("DOCS_UI_UPDATE", keyName, keyDelete(index));
            }}
            left={() => {
              emit<DocsUIUpdate>("DOCS_UI_UPDATE", keyName, keyDelete(index));
            }}
          >
            <DocsInputSelect
              key={keyName + memo.link + index}
              keyName={keyName}
              data={memo}
              index={index}
              generateTrigger={(data, index) => {
                emit<DocsUIUpdate>(
                  "DOCS_UI_UPDATE",
                  keyName,
                  keyUpdate(data, index)
                );
              }}
            ></DocsInputSelect>
          </DragLayer>
        );
      })}

      <Button
        onClick={() => {
          emit<DocsUIUpdate>(
            "DOCS_UI_UPDATE",
            keyName,
            keyDataAdd({
              name: "hello",
              link: "world",
            })
          );
        }}
      >
        <Bold>Add Link</Bold>
      </Button>
      <VerticalSpace space="extraLarge" />
    </Disclosure>
  );
};

export default DocsTap;
