export type TypewriterStep = {
  character: string;
  remainingText: string;
};

export function takeNextCharacter(text: string): TypewriterStep | null {
  if (!text) {
    return null;
  }

  return {
    character: text[0] ?? "",
    remainingText: text.slice(1),
  };
}
