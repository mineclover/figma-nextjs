export const JSXTargetCheck = (node: BaseNode): node is ComponentNode => {
  const includeTypes = ["COMPONENT"];
  return includeTypes.includes(node.type);
};
