import fs from "fs";
import Constants from "./constants";

export async function wait(ms: number) {
  await new Promise((res) => setTimeout(res, ms));
}

export function errorRegister(err: any) {
  fs.appendFileSync(Constants.errorFile, `${new Date().toLocaleString()}:\n${err}\n\n\n`);
}

export function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
