export function spaceToUnderscore(str: string): string {
  return str.replace(/ /g, "_");
}

export function underscoreToSpace(str: string): string {
  return str.replace(/_/g, " ");
}

