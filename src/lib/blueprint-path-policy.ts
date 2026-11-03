import path from "node:path";

export function isInsideDirectory(parent: string, target: string): boolean {
  const relative = path.relative(parent, target);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
