import JSZip from "jszip";
import { saveAs } from "file-saver";
import { SelectList } from "../CodeGen/types";
import { SVGResult } from "../CodeGen/main";
import { FilterType } from "../FigmaPluginUtils";

export const svgExporter = async (
  svgData: SVGResult["svgs"],
  settings: { sections: SelectList[]; filter: FilterType }
) => {
  const a = settings;
  const useList = svgData
    .filter((item) => item.type === "use")
    .map((item) => item.raw);
  const objectList = svgData.filter((item) => item.type === "object");

  const result = `<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${useList.join("\n")}
  </defs>
</svg>`;

  const zipFile = new JSZip();
  const objectFolder = zipFile.folder("object");
  zipFile.file("asset.svg", result);

  if (objectFolder) {
    for (const svg of objectList) {
      objectFolder.file(svg.name + ".svg", svg.raw);
    }

    zipFile.generateAsync({ type: "blob" }).then(function callback(blob) {
      saveAs(blob, "export.zip");
    });
  } else {
  }
};
