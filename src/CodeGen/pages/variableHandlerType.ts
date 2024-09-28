import { EventHandler } from "@create-figma-plugin/utilities";

export interface VariableGetRequestHandler extends EventHandler {
  name: "VARIABLE_GET_REQUEST";
  handler: () => void;
}

export interface VariableGetResponseHandler extends EventHandler {
  name: "VARIABLE_GET_RESPONSE";
  handler: () => void;
}
