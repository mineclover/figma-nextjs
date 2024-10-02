import { EventHandler } from "@create-figma-plugin/utilities";
import { VariableResponseData } from "../main";
import { FilterType } from "../../FigmaPluginUtils";

export interface VariableGetRequestHandler extends EventHandler {
  name: "VARIABLE_GET_REQUEST";
  handler: () => void;
}

export interface VariableGetResponseHandler extends EventHandler {
  name: "VARIABLE_GET_RESPONSE";
  handler: (data: VariableResponseData) => void;
}

export interface InspectOn extends EventHandler {
  name: "INSPECT_ON";
  handler: () => void;
}

export interface InspectFilterUpdate extends EventHandler {
  name: "INSPECT_FILTER";
  handler: (filter: FilterType) => void;
}

export interface InspectOff extends EventHandler {
  name: "INSPECT_OFF";
  handler: () => void;
}

export type AutoCSSData = {
  nodeName: string;
  css: Record<string, string>;
  width: number;
  height: number;
};

export interface InspectMainData extends EventHandler {
  name: "INSPECT_MAIN_DATA";
  handler: (data: AutoCSSData) => void;
}
