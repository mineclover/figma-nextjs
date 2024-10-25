import { EventHandler } from "@create-figma-plugin/utilities";

export type MemoData = {
  name: string;
  link: string;
};

export const memoTypes = ["plan", "notes", "resource", "deploy"] as const;
export type MemoType = (typeof memoTypes)[number];

export type AllMemo = Record<MemoType, MemoData[]>;
// export type AllMemo = Record<MemoType, MemoData[]>
const data = {
  plan: [{ name: "a", link: "b" }],
  notes: [{ name: "a", link: "b" }],
  resource: [{ name: "a", link: "b" }],
} as AllMemo;

export interface DocsOn extends EventHandler {
  name: "DOCS_ON";
  handler: () => void;
}

/** UI에서 Main으로 업데이트 요청 */
export interface DocsUIUpdate extends EventHandler {
  name: "DOCS_UI_UPDATE";
  handler: (key: MemoType, memos: MemoData[]) => void;
}

/** 전체 데이터를 UI에 전송 */
export interface DocsMainAllData extends EventHandler {
  name: "DOCS_MAIN_DATA";
  handler: (memos: AllMemo) => void;
}

/** 요청 데이터만 UI에 전송 */
export interface DocsSelectData extends EventHandler {
  name: "DOCS_MAIN_SELECT_DATA";
  handler: (key: MemoType, memos: MemoData[]) => void;
}

export interface DocsOff extends EventHandler {
  name: "DOCS_OFF";
  handler: () => void;
}
