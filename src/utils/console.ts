type Mode = "dev" | "build";
// const mode = "build";
const mode = "build";

export const LLog = (...args: any[]) => {
  //@ts-ignore
  if (mode === "dev") {
    return console.log(...args);
  }
  return () => {};
};
