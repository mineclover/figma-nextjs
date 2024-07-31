const dev = {
  capabilities: ["codegen"],
  documentAccess: "dynamic-page",

  codegenLanguages: [{ label: "JS", value: "js" }],
  codegenPreferences: [],
};
module.exports = (manifest) => {
  console.log("manifest:", manifest);
  return {
    ...manifest,
    ...dev,
    // ...
    menu: [...manifest.menu, ...dev.menu],
  };
};
