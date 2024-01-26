const dev = {
  capabilities: ["codegen"],

  codegenLanguages: [{ label: "JS", value: "js" }],
  codegenPreferences: [],
};
module.exports = (manifest) => {
  console.log(manifest);
  return {
    ...manifest,
    ...dev,
    // ...
  };
};
