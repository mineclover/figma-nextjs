type Collection = VariableCollection;
type ModeId = string;
type Type = VariableResolvedDataType;
type Name = string;
type Value = string | number | boolean | RGB | RGBA | VariableAlias;

export function createCollection(name: Name) {
  const collection = figma.variables.createVariableCollection(name);
  const modeId = collection.modes[0].modeId;
  return { collection, modeId };
}

export function createToken(
  collection: Collection,
  modeId: ModeId,
  type: Type,
  name: Name,
  value: Value
) {
  const token = figma.variables.createVariable(name, collection, type);
  token.setValueForMode(modeId, value);
  return token;
}

export function createVariable(
  collection: Collection,
  modeId: any,
  key: any,
  valueKey: string | number,
  tokens: Record<string, any>
) {
  const token = tokens[valueKey];
  return createToken(collection, modeId, token.resolvedType, key, {
    type: "VARIABLE_ALIAS",
    id: `${token.id}`,
  });
}

export const importJSONFile = ({
  fileName,
  body,
}: {
  fileName: Name;
  body: string;
}) => {
  const json = JSON.parse(body);
  const { collection, modeId } = createCollection(fileName);
  const aliases = {} as Record<string, any>;
  const tokens = {} as Record<string, any>;
  Object.entries(json).forEach(([key, object]) => {
    traverseToken({
      collection,
      modeId,
      type: json.$type,
      key,
      object,
      tokens,
      aliases,
    });
  });
  processAliases({ collection, modeId, aliases, tokens });
};

function processAliases({
  collection,
  modeId,
  aliases,
  tokens,
}: {
  collection: Collection;
  modeId: ModeId;
  aliases: Record<string, any>;
  tokens: Record<string, Variable>;
}) {
  aliases = Object.values(aliases);
  let generations = aliases.length;
  while (aliases.length && generations > 0) {
    for (let i = 0; i < aliases.length; i++) {
      const { key, type, valueKey } = aliases[i];
      const token = tokens[valueKey];
      if (token) {
        aliases.splice(i, 1);
        tokens[key] = createVariable(collection, modeId, key, valueKey, tokens);
      }
    }
    generations--;
  }
}

function isAlias(value: { toString: () => string }) {
  return value.toString().trim().charAt(0) === "{";
}

type TokenType = "color" | "number";

function traverseToken({
  collection,
  modeId,
  type,
  key,
  object,
  tokens,
  aliases,
}: {
  collection: VariableCollection;
  modeId: ModeId;
  type: TokenType;
  key: string;
  object: unknown;
  tokens: Record<string, Variable>;
  aliases: Record<string, { key: string; type: TokenType; valueKey: string }>;
}) {
  // 전체 순회
  console.log(collection, modeId, type, key, object, tokens, aliases);
}

export const exportToJSON = async () => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const files = [];
  for (const collection of collections) {
    files.push(await processCollection(collection));
  }
  return files;
};

const valueNormalize = <T extends Exclude<VariableValue, VariableAlias>>(
  value: T
) => (typeof value === "object" ? rgbToHex(value) : value);

type VariableToken = {
  $firstAlias?: string;
  $id: string;
  $name: string;
  $resolvedAlias?: string;
  $resolvedType?: string;
  $resolvedValue?: VariableValue;
  $type: string;
  $value: VariableValue;
};
// 디자인 토큰을 export 하는 목적임
async function processCollection(variableCollection: VariableCollection) {
  console.log(variableCollection);
  const { key, id, defaultModeId, name, modes, variableIds, remote } =
    variableCollection;
  const files = { collectionName: name };
  const file = {} as Record<string, Record<string, VariableToken>>;
  // const modeName = {} as Record<string, string>;

  // modes.forEach(({ name, modeId }) => {
  //   modeName[modeId] = name;
  // });

  for (const mode of modes) {
    const currentModeId = mode.modeId;
    file[currentModeId] = {} as Record<string, VariableToken>;
    for (const variableId of variableIds) {
      const temp = await figma.variables.getVariableByIdAsync(variableId);
      if (temp) {
        const { name, resolvedType, valuesByMode, id } = temp;
        const value = valuesByMode[currentModeId];
        if (value) {
          // 참조 위치를 스플릿한 만큼 이동한다
          let obj = file[currentModeId];
          const saveKey = id;
          obj[saveKey] = {} as VariableToken;
          const target = obj[saveKey];
          target.$id = id;
          target.$name = name;

          //   value.type === "VARIABLE_ALIAS"

          if (typeof value === "object" && "type" in value) {
            const findToken = async (
              id: string
            ): Promise<Exclude<VariableValue, VariableAlias>> => {
              const currentNode =
                await figma.variables.getVariableByIdAsync(id);
              if (currentNode) {
                const value2 = currentNode.valuesByMode[currentModeId];
                target.$resolvedAlias = currentNode.name;
                target.$firstAlias = target.$firstAlias
                  ? target.$firstAlias
                  : currentNode.name;
                if (typeof value2 === "object" && "type" in value2) {
                  return findToken(value2.id);
                }
                return value2;
              }
              return "not found";
            };
            const currentVar = await findToken(value.id);
            target.$type = "VARIABLE_ALIAS";
            target.$value = value.id;
            target.$resolvedValue = valueNormalize(currentVar);
            target.$resolvedType = resolvedType;
          } else {
            target.$type = resolvedType;
            target.$value = valueNormalize(value);
          }
        }
      }
    }
  }

  return {
    ...files,
    ...file,
    key,
    id,
    defaultModeId,
    name,
    modes,
    variableIds,
    remote,
  };
}

type RGBAA = RGB & { a?: number };
function rgbToHex({ r, g, b, a }: RGBAA) {
  if (a && a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}

const parseColor = (color: string) => {
  color = color.trim();
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
  const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
  const hslaRegex =
    /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const floatRgbRegex =
    /^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*opacity:\s*[\d\.]+)?\s*\}$/;

  if (rgbRegex.test(color)) {
    const temp = color.match(rgbRegex);
    if (temp) {
      const [, r, g, b] = temp;
      return {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255,
      };
    }
  } else if (rgbaRegex.test(color)) {
    const temp = color.match(rgbRegex);
    if (temp) {
      const [, r, g, b, a] = temp;
      return {
        r: parseInt(r) / 255,
        g: parseInt(g) / 255,
        b: parseInt(b) / 255,
        a: parseFloat(a),
      };
    }
  } else if (hslRegex.test(color)) {
    const temp = color.match(hslRegex);
    if (temp) {
      const [, h, s, l] = temp;
      return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
    }
  } else if (hslaRegex.test(color)) {
    const temp = color.match(hslaRegex);
    if (temp) {
      const [, h, s, l, a] = temp;
      return Object.assign(
        hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
        { a: parseFloat(a) }
      );
    }
  } else if (hexRegex.test(color)) {
    const hexValue = color.substring(1);
    const expandedHex =
      hexValue.length === 3
        ? hexValue
            .split("")
            .map((char: any) => char + char)
            .join("")
        : hexValue;
    return {
      r: parseInt(expandedHex.slice(0, 2), 16) / 255,
      g: parseInt(expandedHex.slice(2, 4), 16) / 255,
      b: parseInt(expandedHex.slice(4, 6), 16) / 255,
    };
  } else if (floatRgbRegex.test(color)) {
    return JSON.parse(color);
  } else {
    throw new Error("Invalid color format");
  }
};

function hslToRgbFloat(h: number, s: number, l: number) {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, (h + 1 / 3) % 1);
  const g = hue2rgb(p, q, h % 1);
  const b = hue2rgb(p, q, (h - 1 / 3) % 1);

  return { r, g, b };
}
