export const COLORS = [
  "#644776",
  "#4c597a",
  "#336579",
  "#3d8375",
  "#4fa271",
  "#9ec077",
  "#c4bf69",
  "#efbc5a",
  "#f19f53",
  "#f2834c",
];

export const generateColor = (index: number) => {
  return COLORS[index % COLORS.length];
};

export const GREENS = ["#132a13", "#31572c", "#4f772d", "#90a955", "#ecf39e"];

export const generateGreen = (index: number) => {
  return GREENS[index % GREENS.length];
};

export const REDS = ["#d00000", "#dc2f02", "#e85d04", "#f48c06", "#faa307"];

export const generateRed = (index: number) => {
  return REDS[index % REDS.length];
};
