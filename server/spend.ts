import { env } from './env';
import type { SpendState } from '../shared/types';

// Per server process. A run's estimate is RESERVED when it is submitted, not when it
// finishes, so several runs started at once (compare mode) can't each pass the check and
// overshoot together. A failed run releases its reservation; a finished one settles it.
let spent = 0;
let reserved = 0;

export function spendState(): SpendState {
  return {
    capUsd: env.SPEND_CAP_USD,
    spentUsd: round(spent),
    reservedUsd: round(reserved),
    remainingUsd: round(env.SPEND_CAP_USD - spent - reserved)
  };
}

export interface Reservation {
  settle(): void;
  release(): void;
}

export function reserve(usdAmount: number): Reservation {
  if (spent + reserved + usdAmount > env.SPEND_CAP_USD + 1e-9) {
    const s = spendState();
    throw new Error(
      `Session spend cap reached: this run is ~$${usdAmount.toFixed(2)} and $${s.remainingUsd.toFixed(2)} of $${s.capUsd.toFixed(2)} remains. Raise SPEND_CAP_USD in .env and restart to continue.`
    );
  }
  reserved += usdAmount;
  let done = false;
  return {
    settle() {
      if (done) return;
      done = true;
      reserved -= usdAmount;
      spent += usdAmount;
    },
    release() {
      if (done) return;
      done = true;
      reserved -= usdAmount;
    }
  };
}

const round = (n: number) => Math.round(n * 10000) / 10000;
