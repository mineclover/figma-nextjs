type Mode = "dev" | "build";
// const mode = "build";
const mode = "dev";

export const LLog = (...args: any[]) => {
  //@ts-ignore
  if (mode === "dev") {
    return console.log(...args);
  }
  return () => {};
};
