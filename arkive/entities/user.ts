import { createEntity } from "../deps.ts";

export interface User {
  _id: string; // address
  updatedAtTimestamp: number;
  createdAtTimestamp: number;
  createdAtBlockNumber: number;
  updatedAtBlockNumber: number;
}

export const User = createEntity<User>("User", {
  _id: "string",
  updatedAtTimestamp: {
    type: "number",
    index: true,
  },
  createdAtTimestamp: {
    type: "number",
    index: true,
  },
  createdAtBlockNumber: {
    type: "number",
    index: true,
  },
  updatedAtBlockNumber: {
    type: "number",
    index: true,
  },
});
