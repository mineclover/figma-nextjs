import { h } from "preact";
import {
  Button,
  Container,
  VerticalSpace,
  Text,
  Bold,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { useState, useEffect } from "preact/hooks";

import {
  DocsMainAllData,
  DocsOff,
  DocsOn,
  DocsSelectData,
  MemoData,
  memoTypes,
} from "./docsHandlerType";
import DocsTap from "../../components/Docs/Add";

function Docs() {
  const [plan, setPlan] = useState<MemoData[]>([]);
  const [notes, setNotes] = useState<MemoData[]>([]);
  const [resource, setResource] = useState<MemoData[]>([]);
  const [deploy, setDeploy] = useState<MemoData[]>([]);

  useEffect(() => {
    emit<DocsOn>("DOCS_ON");
    // 업데이트 감지

    // 전체 수정
    const AllListener = on<DocsMainAllData>("DOCS_MAIN_DATA", (data) => {
      setPlan(data.plan);
      setNotes(data.notes);
      setResource(data.resource);
      setDeploy(data.deploy);
      console.log("AllListener", data);
    });

    // 일부 수정
    const selectListener = on<DocsSelectData>(
      "DOCS_MAIN_SELECT_DATA",
      (key, data) => {
        if (key === "deploy") setPlan(data);
        if (key === "notes") setPlan(data);
        if (key === "plan") setPlan(data);
        if (key === "resource") setPlan(data);
      }
    );

    return () => {
      AllListener();
      selectListener();
      emit<DocsOff>("DOCS_OFF");
    };
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />

      <VerticalSpace space="extraLarge" />

      {/* /Users/junwoobang/Documents/project/preact-rectangles2/src/components/Docs/DocsInputSelect.tsx 기준으로 프로젝트 폴더의 이름이 실제 프로젝트 이름과 같아야한다 */}
      <Button fullWidth onClick={() => {}}>
        export Variable
      </Button>
      <VerticalSpace space="extraLarge" />

      <VerticalSpace space="medium" />

      <DocsTap keyName="plan" data={plan} />
      <DocsTap keyName="notes" data={notes} />
      <DocsTap keyName="resource" data={resource} />
      <DocsTap keyName="deploy" data={deploy} />

      <VerticalSpace space="medium" />
    </Container>
  );
}

export default Docs;
