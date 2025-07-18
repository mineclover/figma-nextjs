export class FigmaVariableService {
  async getLocalVariableCollections() {
    return await figma.variables.getLocalVariableCollectionsAsync();
  }

  async getLocalVariables() {
    return await figma.variables.getLocalVariablesAsync();
  }

  async getSubscribedVariables(): Promise<any[]> {
    // @ts-ignore
    return figma.variables.getSubscribedVariables() as any[];
  }

  async getLocalPaintStyles() {
    return await figma.getLocalPaintStylesAsync();
  }

  async getVariableById(id: string) {
    return await figma.variables.getVariableByIdAsync(id);
  }
}
