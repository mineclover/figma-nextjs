export const toNodeName = (node: any, _filter: Record<string, any>) => {
  // 기존 toNodeName 로직을 여기에 구현
  return {
    resultName: node.name,
    alias: false,
  };
};

export const processSingleSvg = async (_node: any, _name: string) => {
  // 기존 toSingleSvg 로직을 여기에 구현
  return {
    attrs: {},
    raw: '',
    origin: null,
  };
};
