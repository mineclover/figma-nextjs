import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  AutoCSSData,
  InspectFilterUpdate,
  InspectMainData,
  InspectOff,
  InspectOn,
} from "./variableHandlerType";
import { FilterType, pathNodeType } from "../../FigmaPluginUtils";
import { Disclosure, Checkbox, Text } from "@create-figma-plugin/ui";
import styles from "./svg.module.css";

type Props = {};

const Inspect = (props: Props) => {
  const [svgData, setSvgData] = useState<AutoCSSData>();
  const [filterOpen, setFilterOpen] = useState<boolean>(true);

  const [filter, setFilter] = useState<FilterType>({
    DOCUMENT: true,
    PAGE: true,
    SECTION: true,
    COMPONENT_SET: true,
    COMPONENT: true,
  });

  useEffect(() => {
    emit<InspectOn>("INSPECT_ON");
    const listener = on<InspectMainData>("INSPECT_MAIN_DATA", (data) => {
      console.log("아무튼 들어옴", data);
      setSvgData(data);
    });

    emit<InspectFilterUpdate>("INSPECT_FILTER", filter);

    return () => {
      listener();
      emit<InspectOff>("INSPECT_OFF");
    };
  }, []);

  const filterActionCurry = (keyName: keyof FilterType) => {
    return {
      value: filter[keyName],
      onChange: (e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
        const value = e.currentTarget.checked;
        setFilter((data) => {
          const newData = { ...data, [keyName]: value };

          emit<InspectFilterUpdate>("INSPECT_FILTER", newData);

          return newData;
        });
      },
    };
  };

  return (
    <div>
      {/* 일단 필터 옵션 넣음 */}
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

      {JSON.stringify(filter, null, 2)}
      {JSON.stringify(svgData, null, 2)}
    </div>
  );
};

export default Inspect;
