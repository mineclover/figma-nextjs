export type SvgTypes =
  | { path: "newFeed_Feed__Boost_Active" }
  | { path: "newFeed_Feed__Like_Active" }
  | { path: "newFeed_Feed__Comments_Active" }
  | { path: "newFeed_Feed__Music" }
  | { path: "newFeed_Feed__RPDCollab"; color1: string; percent1: number }
  | { path: "newFeed_Feed__Boost_Default" }
  | { path: "newFeed_Feed__Like_Default" }
  | { path: "newFeed_Feed__Comments_Default" }
  | { path: "newFeed_Feed__Meatball" }
  | { path: "newFeed_Feed__Follow" }
  | { path: "newFeed_Feed__Profile_Confirm" }
  | { path: "newFeed_Feed__View"; color1: string };
export const useKeys = [
  "newFeed_Feed__RPDCollab",
  "newFeed_Feed__View",
] as const;
export const objectKeys = [
  "newFeed_Feed__Boost_Active",
  "newFeed_Feed__Like_Active",
  "newFeed_Feed__Comments_Active",
  "newFeed_Feed__Music",
  "newFeed_Feed__Boost_Default",
  "newFeed_Feed__Like_Default",
  "newFeed_Feed__Comments_Default",
  "newFeed_Feed__Meatball",
  "newFeed_Feed__Follow",
  "newFeed_Feed__Profile_Confirm",
] as const;
export type SvgPaths = SvgTypes["path"]; // Svg들의 path 타입을 추출
export type SvgPropsType<T extends SvgPaths> = Extract<SvgTypes, { path: T }>;
export const usePropsObject = {
  newFeed_Feed__RPDCollab: { color1: "svg-color-1", percent1: "svg-percent-1" },
  newFeed_Feed__View: { color1: "svg-color-1" },
};
