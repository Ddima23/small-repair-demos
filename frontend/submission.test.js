const test = require('node:test');
const assert = require('node:assert/strict');
const { createBeforeController, createFixedController } = require('./submission.js');

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test('baseline reproduces duplicate saves from three rapid submissions', async () => {
  const gate = deferred();
  let calls = 0;
  const controller = createBeforeController(() => { calls += 1; return gate.promise; });
  const submissions = [controller.submit('demo'), controller.submit('demo'), controller.submit('demo')];
  assert.equal(calls, 3);
  assert.equal(controller.pending, true);
  gate.resolve('saved');
  await Promise.all(submissions);
  assert.equal(controller.pending, false);
});

test('fix accepts one save and skips duplicate clicks while the first is pending', async () => {
  const gate = deferred();
  let calls = 0;
  const controller = createFixedController(() => { calls += 1; return gate.promise; });
  const first = controller.submit('demo');
  assert.deepEqual(await controller.submit('demo'), { skipped: true });
  assert.deepEqual(await controller.submit('demo'), { skipped: true });
  assert.equal(calls, 1);
  assert.equal(controller.pending, true);
  gate.resolve('saved');
  assert.deepEqual(await first, { skipped: false, value: 'saved' });
  assert.equal(controller.pending, false);
});

test('successful completion permits the next intentional submission', async () => {
  const values = [];
  const controller = createFixedController(async value => { values.push(value); return value; });
  await controller.submit('first');
  await controller.submit('second');
  assert.deepEqual(values, ['first', 'second']);
  assert.equal(controller.pending, false);
});

test('rejected save releases the guard and permits a successful retry', async () => {
  const gate = deferred();
  let calls = 0;
  const controller = createFixedController(() => {
    calls += 1;
    return calls === 1 ? gate.promise : Promise.resolve('retry saved');
  });
  const attempt = controller.submit('demo');
  const rejection = assert.rejects(attempt, /Mock save failed/);
  assert.deepEqual(await controller.submit('demo'), { skipped: true });
  gate.reject(new Error('Mock save failed'));
  await rejection;
  assert.equal(controller.pending, false);
  assert.deepEqual(await controller.submit('demo'), { skipped: false, value: 'retry saved' });
  assert.equal(calls, 2);
});

test('synchronous save failure also releases the guard', async () => {
  const controller = createFixedController(() => { throw new Error('Invalid mock input'); });
  await assert.rejects(controller.submit(null), /Invalid mock input/);
  assert.equal(controller.pending, false);
});
