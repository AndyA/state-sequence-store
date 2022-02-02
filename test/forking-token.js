const tap = require("tap");
const { StateStore } = require("..");

tap.test(`forkingToken`, async () => {
  let called = 0;
  let fixed = 0;
  const tok = StateStore.forkingToken((muts, fixes) => {
    called++;
    fixes.map(f => f());
  });
  const toks = [tok, tok.fork(), tok.fork()];
  for (const t of toks) {
    tap.same(called, 0);
    tap.same(fixed, 0);
    await t(null, () => fixed++);
  }
  tap.same(called, 1);
  tap.same(fixed, 3);
});

tap.test(`combineTokens`, async () => {
  const args = [];

  const [tok1, tok2] = ["tok1", "tok2"].map(name =>
    StateStore.forkingToken((...arg) => args.push([name, ...arg]))
  );

  const tok1b = tok1.fork();
  const tokAll = StateStore.combineTokens(tok1, [[tok2], tok1b]);
  await tokAll(1, 2);
  const want = [
    ["tok2", [1], [2]],
    ["tok1", [1, 1], [2, 2]]
  ];
  tap.same(args, want);
});

tap.test(`negative`, async () => {
  const tok = () => true;
  const ft1 = StateStore.forkingToken(tok);
  tap.throws(() => StateStore.forkingToken(tok), /already forking/i);

  await ft1();
  tap.rejects(ft1, /more than once/i);
});
