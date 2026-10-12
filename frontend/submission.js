/* Illustrative AI-built example. No network requests or client data. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SubmissionDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createBeforeController(save, onState = () => {}) {
    let inFlight = 0;
    return {
      get pending() { return inFlight > 0; },
      async submit(value) {
        // Bug: every click starts another save, even while a save is pending.
        inFlight += 1;
        onState({ pending: true, inFlight });
        try {
          return { skipped: false, value: await save(value) };
        } finally {
          inFlight -= 1;
          onState({ pending: inFlight > 0, inFlight });
        }
      }
    };
  }

  function createFixedController(save, onState = () => {}) {
    let pending = false;
    return {
      get pending() { return pending; },
      async submit(value) {
        // Set the guard synchronously, before the first asynchronous boundary.
        if (pending) return { skipped: true };
        pending = true;
        onState({ pending });
        try {
          return { skipped: false, value: await save(value) };
        } finally {
          // Failed saves must release the guard so the user can retry.
          pending = false;
          onState({ pending });
        }
      }
    };
  }
  return { createBeforeController, createFixedController };
});
