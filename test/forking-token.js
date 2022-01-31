const tap = require("tap");
const forkingToken = require("../lib/forking-token");

tap.test(`forkingToken`, async () => {
  let called = 0;
  let fixed = 0;
  const tok = forkingToken(() => called++);
  const toks = [tok, tok.fork(), tok.fork()];
  for (const t of toks) {
    tap.same(called, 0);
    tap.same(fixed, 0);
    await t(() => fixed++);
  }
  tap.same(called, 1);
  tap.same(fixed, 1);
});

tap.test(`negative`, async () => {
  const tok = () => true;
  const ft1 = forkingToken(tok);
  tap.throws(() => forkingToken(tok), /already forking/i);

  await ft1();
  tap.rejects(ft1, /more than once/i);
});
