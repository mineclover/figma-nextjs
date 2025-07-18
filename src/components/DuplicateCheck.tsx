import { h } from 'preact';
import { SVGResult } from '../CodeGen/domain/entities/NodeInfo';
import { useState } from 'preact/hooks';
import {
  Container,
  IconLayerAnimated16,
  IconLayerImage16,
  IconLayerInstance16,
  TextColor,
} from '@create-figma-plugin/ui';

import { SelectNodeByIdZoomHandler } from '../CodeGen/types';
import { emit } from '@create-figma-plugin/utilities';
import {
  IconTarget16,
  Layer,
  Muted,
  Text,
  VerticalSpace,
} from '@create-figma-plugin/ui';
import InputSelect from './InputSelect';
import { LazyNodeData } from '../CodeGen/types';

interface Props {
  lazyNodes?: LazyNodeData[];
  generateTrigger: Function;
}

const DuplicateCheck = ({ lazyNodes, generateTrigger }: Props) => {
  const [hover, setHover] = useState(false);

  if (!lazyNodes || lazyNodes.length === 0) {
    return (
      <Container space="extraSmall">
        <Text>
          <Muted>노드가 선택되지 않았습니다</Muted>
        </Text>
      </Container>
    );
  }

  // LazyNodeData는 실제 SVG 데이터가 아니므로 간단한 정보만 표시
  return (
    <Container space="extraSmall">
      <Text>
        <Muted>선택된 노드: {lazyNodes.length}개</Muted>
      </Text>
      <VerticalSpace space="extraSmall" />
      <Text>
        <Muted>Export 시점에 실제 SVG가 생성됩니다</Muted>
      </Text>
    </Container>
  );
};

export default DuplicateCheck;
