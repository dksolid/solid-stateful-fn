/* eslint-disable @typescript-eslint/no-explicit-any */

import { expect } from 'chai';
import { spy } from 'sinon';
import { createMutable } from 'solid-js/store';
import { createRenderEffect } from 'solid-js';

import { addState } from '../src/addState.js';
import { TypeFnState } from '../src/types/TypeFnState.js';

import { ACTION_TIMEOUT, TIMEOUT_SYNC } from './constants.js';
import { functions } from './functions.js';
import { functionsAnonymous } from './functionsAnonymous.js';
import { ClassFunctions } from './classFunctions.js';

function createStatefulFunctions(names: Array<keyof typeof functions>) {
  return [
    ...names.map((name) => {
      return {
        name,
        fn: addState(functions[name], functions[name].name),
      };
    }),
    ...names.map((name) => {
      const targetFn = functionsAnonymous.find(([n]) => n === name)![1];

      return { name, fn: addState(targetFn as any, name) };
    }),
    ...names.map((name) => {
      const classFunctions = new ClassFunctions();

      return { name, fn: classFunctions[name] as ReturnType<typeof addState> };
    }),
  ];
}

function startNoError(fn: ((...args: any) => Promise<any>) & TypeFnState) {
  expect(fn.state.timeStart).to.eq(0);
  expect(fn.state.isExecuting).to.eq(false);
  expect(fn.state.error).to.eq(undefined);
  expect(fn.state.errorName).to.eq(undefined);

  try {
    fn().catch(() => false);
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: never) {
    /* empty */
  }

  expect(fn.state.executionTime).to.be.eq(0);
  expect(fn.state.isExecuting).to.eq(true);
  expect(fn.state.timeStart).to.be.greaterThan(0);
}

function endNoError(
  fn: ((...args: any) => Promise<any>) & TypeFnState,
  timeout: number = ACTION_TIMEOUT
) {
  expect(fn.state.isExecuting).to.eq(false);
  expect(fn.state.error).to.eq(undefined);
  expect(fn.state.errorName).to.eq(undefined);
  expect(Math.ceil(Number(fn.state.executionTime))).to.be.greaterThanOrEqual(timeout);
}

async function startError(fn: ((...args: any) => Promise<any>) & TypeFnState, sync?: boolean) {
  expect(fn.state.timeStart).to.eq(0);
  expect(fn.state.isExecuting).to.eq(false);

  try {
    fn().catch(() => false);
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: never) {
    /* empty */
  }

  if (sync) {
    expect(fn.state.isExecuting).to.eq(false);
    expect(fn.state.error).to.eq('error text');
    expect(fn.state.errorName).to.eq('CUSTOM_ERROR');
  } else {
    expect(fn.state.executionTime, `HERE ${fn.state.executionTime}`).to.be.eq(0);
    expect(fn.state.isExecuting).to.eq(true);
    expect(fn.state.timeStart).to.be.greaterThan(0);
    expect(fn.state.error).to.eq(undefined);
    expect(fn.state.errorName).to.eq(undefined);
  }
}

function endError(
  fn: ((...args: any) => Promise<any>) & TypeFnState,
  timeout: number = ACTION_TIMEOUT
) {
  expect(fn.state.isExecuting).to.eq(false);
  expect(fn.state.error).to.eq('error text');
  expect(fn.state.errorName).to.eq('CUSTOM_ERROR');
  expect(Math.ceil(Number(fn.state.executionTime))).to.be.greaterThanOrEqual(timeout);
}

describe('addState', () => {
  test('adds default state & name', () => {
    const statefulFunctions = createStatefulFunctions(['asyncNoParams', 'syncNoParams']);

    statefulFunctions.forEach(({ name, fn }) => {
      expect(fn.state).to.deep.eq({
        timeStart: 0,
        isExecuting: false,
        executionTime: 0,
      });
      expect(fn.name).to.eq(name);
    });
  });

  test('works with wrapping in autoAction', () => {
    const statefulFunctions = createStatefulFunctions(['asyncNoParams', 'syncNoParams']).map(
      (item) => {
        return createMutable(item);
      }
    );

    statefulFunctions.forEach(({ name, fn }) => {
      expect(fn.state).to.deep.eq({
        timeStart: 0,
        isExecuting: false,
        executionTime: 0,
      });
      expect(fn.name).to.eq(name);
    });
  });

  test('error when no function name', () => {
    const spyLog = spy(console, 'warn');

    const fn = functionsAnonymous[0][1];
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fnStateful = addState(fn, fn.name);

    expect(
      spyLog.calledWith(
        `addState: name is empty, please provide a valid name for the stateful function`
      )
    ).to.be.eq(true);

    spyLog.restore();
  });

  test('params are typed & result is passed', () => {
    const statefulFunctions = createStatefulFunctions(['asyncParams', 'syncParams']);

    return Promise.all(statefulFunctions.map(({ fn }) => fn('foo', 'bar'))).then((data) => {
      expect(data).to.deep.eq([...new Array(statefulFunctions.length)].map(() => ['foo', 'bar']));
    });
  });

  test('(sync) successful case', () => {
    const statefulFunctions = createStatefulFunctions(['syncNoParams', 'syncNoParams']).map(
      ({ fn }) => fn
    );

    statefulFunctions.forEach((fn) => startNoError(fn));

    return new Promise((resolve) => {
      setTimeout(() => {
        statefulFunctions.forEach((fn) => endNoError(fn, TIMEOUT_SYNC));
        statefulFunctions.forEach((fn) => startNoError(fn));

        setTimeout(() => {
          // eslint-disable-next-line max-nested-callbacks
          statefulFunctions.forEach((fn) => endNoError(fn, TIMEOUT_SYNC));

          resolve(undefined);
        }, ACTION_TIMEOUT);
      }, ACTION_TIMEOUT);
    });
  });

  test('(async) successful case', () => {
    const statefulFunctions = createStatefulFunctions(['asyncNoParams', 'asyncNoParams']).map(
      ({ fn }) => fn
    );

    statefulFunctions.forEach((fn) => startNoError(fn));

    return new Promise((resolve) => {
      setTimeout(() => {
        statefulFunctions.forEach((fn) => endNoError(fn));
        statefulFunctions.forEach((fn) => startNoError(fn));

        setTimeout(() => {
          statefulFunctions.forEach((fn) => endNoError(fn));

          resolve(undefined);
        }, ACTION_TIMEOUT + 1);
      }, ACTION_TIMEOUT + 1);
    });
  });

  test('(sync) errors case', () => {
    const statefulFunctions = createStatefulFunctions(['syncError', 'syncError']).map(
      ({ fn }) => fn
    );

    statefulFunctions.forEach((fn) => startError(fn, true));

    return new Promise((resolve) => {
      setTimeout(() => {
        statefulFunctions.forEach((fn) => startError(fn, true));

        Promise.all(statefulFunctions.map((fn) => fn())).catch((error) => {
          expect(error.message).to.eq('error text');
          expect(error.name).to.eq('CUSTOM_ERROR');

          resolve(undefined);
        });
      }, ACTION_TIMEOUT + 1);
    });
  });

  test('(async) errors case', () => {
    const statefulFunctions = createStatefulFunctions(['asyncError', 'asyncError']).map(
      ({ fn }) => fn
    );

    return Promise.all([statefulFunctions.map((fn) => startError(fn))]).then(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            statefulFunctions.forEach((fn) => endError(fn));
            statefulFunctions.forEach((fn) => startError(fn));

            setTimeout(() => {
              // eslint-disable-next-line max-nested-callbacks
              statefulFunctions.forEach((fn) => endError(fn));

              // eslint-disable-next-line max-nested-callbacks
              Promise.all(statefulFunctions.map((fn) => fn())).catch((error) => {
                expect(error.message).to.eq('error text');
                expect(error.name).to.eq('CUSTOM_ERROR');

                resolve(undefined);
              });
            }, ACTION_TIMEOUT + 1);
          }, ACTION_TIMEOUT + 1);
        })
    );
  });

  test('autorun works', () => {
    const statefulFunctions = createStatefulFunctions(['asyncNoParams', 'syncNoParams']).map(
      ({ fn }) => fn
    );

    statefulFunctions.forEach((fn) => {
      void fn();

      expect(fn.state.isExecuting).to.eq(true);
    });

    return new Promise((resolve) => {
      createRenderEffect(() => {
        const allFinished = !statefulFunctions.some((statefulFn) => statefulFn.state.isExecuting);

        if (allFinished) resolve(undefined);
      });
    });
  });

  test('mocks work', () => {
    const statefulFunctions = createStatefulFunctions([
      'asyncNoParams',
      'asyncParams',
      'asyncError',
      'syncNoParams',
      'syncParams',
      'syncError',
    ]);

    return Promise.all(
      statefulFunctions.map(({ fn }) => {
        fn.state.mock = Promise.resolve(1);

        expect(fn.state.timeStart).to.eq(0);
        expect(fn.state.isExecuting).to.eq(false);
        expect(fn.state.error).to.eq(undefined);
        expect(fn.state.errorName).to.eq(undefined);

        const result = fn();

        expect(fn.state.timeStart).to.eq(0);
        expect(fn.state.isExecuting).to.eq(false);
        expect(fn.state.error).to.eq(undefined);
        expect(fn.state.errorName).to.eq(undefined);

        return result;
      })
    ).then((data) => {
      expect(data).to.deep.eq(statefulFunctions.map(() => 1));
    });
  });

  test('(async) cancelling', () => {
    const statefulFunctions = createStatefulFunctions([
      'asyncError',
      'asyncNoParams',
      'asyncParams',
    ]).map(({ fn }) => fn);

    statefulFunctions.forEach((fn) => {
      startNoError(fn);

      fn.state.isCancelled = true;

      expect(fn.state.isCancelled).to.eq(true);
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        statefulFunctions.forEach((fn) => {
          expect(fn.state.isExecuting).to.eq(false);
          expect(fn.state.isCancelled).to.eq(false);
          expect(fn.state.error).to.eq(fn.name);
          expect(fn.state.errorName).to.eq('ACTION_CANCELED');
          expect(Math.ceil(Number(fn.state.executionTime))).to.be.greaterThanOrEqual(
            ACTION_TIMEOUT
          );
        });

        void Promise.all(
          statefulFunctions.map((fn) => {
            const promise = fn();

            fn.state.isCancelled = true;

            return promise;
          })
        ).catch((error) => {
          expect(statefulFunctions.map((fn) => fn.name)).to.include(error.message);
          expect(error.name).to.eq('ACTION_CANCELED');

          resolve(undefined);
        });
      }, ACTION_TIMEOUT + 1);
    });
  });

  test('(async) parallel not working', () => {
    const fnAsync = addState(functions.asyncNoParams, 'asyncNoParams');

    startNoError(fnAsync);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const newTimeout = ACTION_TIMEOUT + 10;

    return new Promise((resolve) => {
      expect(fnAsync.state.executionTime).to.be.eq(0);
      expect(fnAsync.state.isExecuting).to.eq(true);
      expect(fnAsync.state.timeStart).to.be.greaterThan(0);

      const prevTimeStart = fnAsync.state.timeStart;

      /**
       * Start fnAsync another time when it has not been finished yet
       * and we see that "timeStart" has become a new one
       *
       */

      const spyLog = spy(console, 'warn');

      void fnAsync(newTimeout);

      expect(
        spyLog.calledWith(
          'addState: function asyncNoParams is already running, but was called a second time. Parallel execution is not supported'
        )
      ).to.be.eq(true);

      expect(fnAsync.state.executionTime).to.be.eq(0);
      expect(fnAsync.state.isExecuting).to.eq(true);
      expect(fnAsync.state.timeStart).to.be.greaterThan(prevTimeStart);

      setTimeout(() => {
        /**
         * The first call fnAsync has been finished yet
         * and we see that "isExecuting" became a false,
         * and that "executionTime" is incorrect,
         * but we surely know that the last call has not been finished!
         *
         */

        expect(fnAsync.state.executionTime).to.be.greaterThan(0);
        expect(fnAsync.state.isExecuting).to.eq(false);
        expect(fnAsync.state.timeStart).to.be.eq(0);

        const prevExecutionTime = fnAsync.state.executionTime;

        setTimeout(() => {
          /**
           * Now all calls of fnAsync have been finished
           * and we see that "executionTime" has been changed!
           * and it's also incorrect
           *
           */

          expect(fnAsync.state.executionTime).to.be.greaterThan(prevExecutionTime);
          expect(fnAsync.state.isExecuting).to.eq(false);
          expect(fnAsync.state.timeStart).to.be.eq(0);

          spyLog.restore();

          resolve(undefined);
        }, newTimeout);
      }, ACTION_TIMEOUT + 1);
    });
  });
});
