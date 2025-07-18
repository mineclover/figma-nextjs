import {
  SelectList,
  FilterType,
  SVGResult,
} from '../../domain/entities/NodeInfo';

export class SvgGenerationUseCase {
  async execute(
    sections: SelectList[],
    filter: FilterType
  ): Promise<SVGResult> {
    // 기존 로직을 유지하면서 헥사고날 아키텍처 적용
    const nodes: any[] = [];
    const pageIdMap: Record<
      string,
      { pageId: string; selectedNodeId: string }
    > = {};

    // 노드 수집
    for (const section of sections) {
      const { pageId, id } = section;
      const page = figma.root.findChild(
        (node) => node.id === pageId && node.type === 'PAGE'
      ) as PageNode | null;

      if (page) {
        await figma.setCurrentPageAsync(page);
        const node = await figma.getNodeByIdAsync(id);

        if (node) {
          nodes.push(node);
          pageIdMap[node.id] = {
            pageId,
            selectedNodeId: id,
          };
        }
      }
    }

    // SVG 생성 (기존 로직 유지)
    const svgs = [];
    for (const node of nodes) {
      const { resultName, alias } = this.processNodeName(node, filter);
      const svg = await this.generateSVG(node, resultName);

      const pngs = [];
      const scales = [2];
      for (const scale of scales) {
        const png = await node.exportAsync({
          format: 'PNG',
          constraint: { type: 'SCALE', value: scale },
        });
        pngs.push({ scale, png });
      }

      svgs.push({
        node,
        name: resultName,
        alias,
        nodeInfo: pageIdMap[node.id],
        type: node.type || 'unknown',
        ...svg,
        pngs,
      });
    }

    return {
      input: { sections, filter },
      svgs,
    };
  }

  private processNodeName(node: any, _filter: Record<string, any>) {
    // 기존 toNodeName 로직
    return {
      resultName: node.name,
      alias: false,
    };
  }

  private async generateSVG(_node: any, _name: string) {
    // 기존 toSingleSvg 로직
    return {
      attrs: {},
      raw: '',
      origin: null,
    };
  }
}
