// Receive {id, payload} in a Web Worker.
// Reply with {id, result} or {id, error: {message, resource}}.
// The main thread cancels a long search by terminating this worker.
import { SettlementError, SettlementResourceError, solveSettlement } from "./solver.js";

function describe(error) {
  if (error instanceof SettlementError) {
    return { message: error.message, resource: error instanceof SettlementResourceError };
  }
  if (error instanceof RangeError) {
    return { message: "The calculation ran out of memory or stack space. No conclusion about feasibility can be drawn.", resource: true };
  }
  return { message: "Unexpected error: " + (error && error.message ? error.message : String(error)), resource: false };
}

self.onmessage = (event) => {
  const { id, payload } = event.data ?? {};
  try {
    self.postMessage({ id, result: solveSettlement(payload) });
  } catch (error) {
    self.postMessage({ id, error: describe(error) });
  }
};
