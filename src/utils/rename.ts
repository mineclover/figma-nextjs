import _ from "lodash";

export const rename = (name: string) => {
  const text = _.camelCase(name);
  return text;
};
