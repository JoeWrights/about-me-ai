export type ChatRequest = {
  question: string;
};

export type ChatEvent =
  | {
      message: string;
      type: "status";
    }
  | {
      text: string;
      type: "delta";
    }
  | {
      type: "done";
    };
