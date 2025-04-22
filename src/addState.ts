import { batch } from 'solid-js';
import { createMutable } from 'solid-js/store';

import { getCurrentTime } from './utils/getCurrentTime.js';
import { TypeFnState } from './types/TypeFnState.js';
import { TypeFnAsync } from './types/TypeFnAsync.js';

export function addState<TApiFn extends TypeFnAsync, TName extends string>(
  fn: TApiFn,
  name: TName
) {
  if (!name) {
    console.warn(`addState: name is empty, please provide a valid name for the stateful function`);
  }

  function beforeExecution() {
    batch(() => {
      if (wrappedAction.state.isExecuting) {
        console.warn(
          `addState: function ${name} is already running, but was called a second time. Parallel execution is not supported`
        );
      }

      wrappedAction.state.executionTime = 0;
      wrappedAction.state.isExecuting = true;
      wrappedAction.state.timeStart = getCurrentTime();
      wrappedAction.state.error = undefined;
      wrappedAction.state.errorName = undefined;
    });
  }

  function afterExecution() {
    if (wrappedAction.state.isCancelled) {
      const error = new Error(name);
      error.name = 'ACTION_CANCELED';

      throw error;
    }

    batch(() => {
      wrappedAction.state.isExecuting = false;
      wrappedAction.state.executionTime = Number(
        (getCurrentTime() - wrappedAction.state.timeStart).toFixed(1)
      );
      wrappedAction.state.timeStart = 0;
    });
  }

  function afterExecutionError(error: unknown) {
    batch(() => {
      wrappedAction.state.isExecuting = false;
      wrappedAction.state.executionTime = Number(
        (getCurrentTime() - wrappedAction.state.timeStart).toFixed(1)
      );
      wrappedAction.state.timeStart = 0;

      if (wrappedAction.state.isCancelled) {
        wrappedAction.state.isCancelled = false;

        const e = new Error(name);
        e.name = 'ACTION_CANCELED';

        wrappedAction.state.error = e.message;
        wrappedAction.state.errorName = e.name;

        throw e;
      } else {
        wrappedAction.state.error = (error as Error).message;
        wrappedAction.state.errorName = (error as Error).name;
      }
    });

    return Promise.reject(error);
  }

  const wrappedAction = Object.defineProperties(
    function wrappedActionDecorator(...args: Parameters<TApiFn>) {
      if (wrappedAction.state.mock) return wrappedAction.state.mock;

      try {
        beforeExecution();

        return (
          fn(...args)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((response: any) => {
              afterExecution();

              return response;
            })
            .catch(afterExecutionError)
        );
      } catch (error: unknown) {
        return afterExecutionError(error);
      }
    } as unknown as TApiFn & TypeFnState & { name: TName },
    {
      state: {
        value: createMutable({
          timeStart: 0,
          isExecuting: false,
          executionTime: 0,
        }),
        writable: false,
      },
      name: { value: name, writable: false },
    }
  );

  return wrappedAction;
}
