const dev = {
  capabilities: ["codegen"],

  codegenLanguages: [{ label: "JS", value: "js" }],
  codegenPreferences: [],
};

export default function (manifest) {
  console.log(manifest);
  return {
    ...manifest,
    ...dev,
    // ...
  };
}
