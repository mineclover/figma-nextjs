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
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useEffect } from "preact/hooks";

import { FormatHandler } from "../utils/types";

const PRINT_WIDTH = 50;

function Plugin() {
  return <Container space="medium">codegen </Container>;
}

export default render(Plugin);
