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
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState, useEffect } from "preact/hooks";

import {
  CloseHandler,
  SvgSymbolHandler,
  MessageHandler,
  ScanHandler,
} from "../types";
import {
  VariableGetRequestHandler,
  VariableGetResponseHandler,
} from "./variableHandlerType";
import JSZip from "jszip";
import saveAs from "file-saver";
import TokenErrorCheck from "../../components/TokenErrorCheck";
import {
  VariableTokenData,
  ErrorTokenData,
  VariableResponseData,
} from "../variableMain";

function Variables() {
  const [text, setText] = useState<VariableTokenData>();
  const [errorData, setError] = useState<ErrorTokenData>();

  const handleButtonClick = () =>
    emit<VariableGetRequestHandler>("VARIABLE_GET_REQUEST");

  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);

  useEffect(() => {
    on<VariableGetResponseHandler>("VARIABLE_GET_RESPONSE", (data) => {
      setText({
        designTokens: data.designTokens,
        scssModeStyles: data.scssModeStyles,
        defaultScssStyles: data.defaultScssStyles,
        scssVariableStyles: data.scssVariableStyles,
      }),
        setError({
          errorTokens: data.errorTokens,
          sameNamesObject: data.sameNamesObject,
        });
    });
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />
      <Button fullWidth onClick={handleButtonClick}>
        Get Variable
      </Button>

      <VerticalSpace space="extraLarge" />

      <TokenErrorCheck data={text} errors={errorData}></TokenErrorCheck>
      <VerticalSpace space="extraLarge" />

      <Button
        fullWidth
        onClick={() => {
          if (text && errorData) scssExporter(text);
        }}
      >
        export Variable
      </Button>
      <VerticalSpace space="extraLarge" />
    </Container>
  );
}
// 모드와 기본 css
// default.scss
// 사용할 수 있는 토큰 값 담고 있는 scss
// useToken.scss
// figma에서 쓰는 원시 값 데이터
// figmaToken.scss

export default Variables;

function scssExporter({
  designTokens,
  scssModeStyles,
  defaultScssStyles,
  scssVariableStyles,
}: VariableTokenData) {
  const { figmaToken, defaultScss, useToken } = scssObjecttoText({
    designTokens,
    scssModeStyles,
    defaultScssStyles,
    scssVariableStyles,
  });

  const zipFile = new JSZip();
  zipFile.file("_figmaToken.scss", figmaToken);
  zipFile.file("default.scss", defaultScss);
  zipFile.file("useToken.scss", useToken);

  zipFile.generateAsync({ type: "blob" }).then(function callback(blob) {
    saveAs(blob, "scssExport.zip");
  });
}

function scssObjecttoText({
  designTokens,
  scssModeStyles,
  defaultScssStyles,
  scssVariableStyles,
}: Omit<VariableResponseData, "errorTokens" | "sameNamesObject">) {
  let defaultScss = "";
  // let figmaToken = "";
  // let useToken = "";

  /** 실제 데이터 담겨있는 토큰들 */
  const figmaToken = Object.entries(designTokens).reduce(
    (prev, [key, value]) => prev + "$" + key + ":" + value + ";\n",
    ""
  );

  //
  /**
   * defaultScssStyles에서 var를 쓸껀데
   * $로 변수호출하는 구간은 파싱해야한다 파싱 룰을 정해보자
   * $ 기준으로 파싱해서 designTokens 에서 값을 추출한다
   *
   */
  //

  defaultScss +=
    "@use './figmaToken' as *;\n\n.default {" +
    Object.entries(defaultScssStyles).reduce(
      (prev1, [key2, token2]) => prev1 + "\n--" + key2 + ":" + token2 + ";",
      ""
    ) +
    "\n}\n\n";

  //
  // var 모드 scss 생성
  defaultScss += Object.entries(scssModeStyles).reduce(
    (prev, [key, tokenArr]) => {
      // 코드 수정할 때 편하려면 코드 단축 안하는게 맞긴 한 거 같음
      prev +=
        "." +
        key +
        "{" +
        Object.entries(tokenArr).reduce(
          (prev1, [key1, token]) => prev1 + "\n--" + key1 + ":" + token + ";",
          ""
        ) +
        "\n}\n\n";

      return prev;
    },
    ""
  );

  const useToken =
    "@use './figmaToken' as *;\n\n" +
    Object.entries(scssVariableStyles).reduce(
      (prev, cur) => prev + "\n" + cur.join(":"),
      ""
    ) +
    "\n";

  // 모드와 기본 css
  // default.scss
  // 사용할 수 있는 토큰 값 담고 있는 scss
  // useToken.scss
  // figma에서 쓰는 원시 값 데이터
  // figmaToken.scss

  return {
    figmaToken,
    defaultScss,
    useToken,
  };
}
