export type TypeFnState = {
  state: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock?: Promise<any>;
    error?: string;
    timeStart: number;
    errorName?: string;
    isExecuting: boolean;
    isCancelled?: boolean;
    executionTime: number;
  };
};
