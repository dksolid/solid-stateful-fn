/* eslint-disable @typescript-eslint/no-explicit-any */

import { createMutable } from 'solid-js/store';

import { addState } from '../src/addState.js';

import { ACTION_TIMEOUT } from './constants.js';

function decorateWithState(ctx: any, fn: any) {
  ctx[fn.name] = addState(fn.bind(ctx), fn.name);
}

export class ClassFunctions {
  constructor() {
    // a way with arrow methods
    this.asyncNoParams = addState(this.asyncNoParams, 'asyncNoParams');

    // a way with prototype methods
    decorateWithState(this, this.asyncParams);
    decorateWithState(this, this.asyncError);
    decorateWithState(this, this.syncNoParams);
    decorateWithState(this, this.syncParams);
    decorateWithState(this, this.syncError);

    return createMutable(this);
  }

  asyncNoParams = () => {
    // check that "this" is bound to the instance
    void this.syncNoParams();

    return new Promise<void>((resolve) => {
      setTimeout(resolve, ACTION_TIMEOUT);
    });
  };
  asyncParams(param1: string, param2: string) {
    // check that "this" is bound to the instance
    void this.syncNoParams();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // @ts-ignore
        resolve([param1, param2]);
      }, ACTION_TIMEOUT);
    });
  }
  asyncError() {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const err = new Error('error text');
        err.name = 'CUSTOM_ERROR';

        reject(err);
      }, ACTION_TIMEOUT);
    });
  }
  syncNoParams() {
    return Promise.resolve(null);
  }
  syncParams(param1: string, param2: string) {
    return Promise.resolve([param1, param2]);
  }
  syncError() {
    const err = new Error('error text');
    err.name = 'CUSTOM_ERROR';

    throw err;

    return Promise.reject(err);
  }
}
