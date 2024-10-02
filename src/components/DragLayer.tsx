import { Layer, IconTarget16 } from "@create-figma-plugin/ui";
import { SingleExtractProps } from "../../types/utilType";
import { useState } from "preact/hooks";
import styles from "./test.module.css";
import { LLog } from "../utils/console";
import { h } from "preact";

interface Props extends Omit<SingleExtractProps<typeof Layer>, "value"> {
  limit: number;

  right: () => void;
  left: () => void;
  value?: boolean;
}

const DragLayer = ({ limit, right, left, children, ...props }: Props) => {
  const [hover, setHover] = useState(false);
  const [dist, setDist] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("left");

  const normalizedDist = Math.min(Math.max(Math.abs(dist) / limit, 0), 1);
  return (
    <div className={styles.over}>
      <div
        style={{
          transform: `translateX(${dist}px)`,
          opacity: 1 - normalizedDist,
        }}
      >
        <Layer
          {...props}
          draggable
          onDragStart={(e) => {
            const startX = e.clientX; // 드래그 시작 위치
            e.currentTarget.dataset.startX = String(startX); // 시작 위치 저장
          }}
          onDrag={(e) => {
            if (e.currentTarget.dataset.startX) {
              const startX = parseInt(e.currentTarget.dataset.startX, 10);
              const currentX = e.clientX; // 현재 마우스 위치

              const distance = currentX - startX; // 이동 거리 계산
              const absDistance = Math.abs(distance);
              if (distance > 0) {
                setDirection("right");
              } else {
                setDirection("left");
              }
              // 불가능한 수준의 이동을 제거
              if (absDistance < 300) {
                setDist(distance);
              }
            }
          }}
          onDragEnd={(e) => {
            if (e.currentTarget.dataset.startX) {
              const startX = parseInt(e.currentTarget.dataset.startX, 10);
              const currentX = e.clientX; // 현재 마우스 위치
              const distance = currentX - startX; // 이동 거리 계산
              const absDistance = Math.abs(distance);
              LLog(
                "svg",
                `Distance moved: ${Math.abs(distance)}px`,
                distance > 0 ? "right" : "left"
              );
              if (distance > 0 && absDistance > limit) {
                right();
              } else if (distance < 0 && absDistance > limit) {
                left();
              }
            }
            delete e.currentTarget.dataset.startX; // 드래그 종료 시 데이터 삭제
            setDist(0);
          }}
          value={hover}
          onMouseLeave={() => setHover(false)}
        >
          {children}
        </Layer>
      </div>
    </div>
  );
};

export default DragLayer;
