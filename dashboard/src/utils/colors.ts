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
