const tap = require("tap");
const { StateFile } = require("..");

const { testWithTemp } = require("../lib/test/util");

tap.test(`state`, async () => {
  const fixups = [];

  const makePair = name => [
    state => {
      state.mut.push(name);
    },
    () => fixups.push(name)
  ];

  await testWithTemp(async (file, checkState) => {
    const sf = await StateFile.create(file, { a: { mut: [] }, b: { mut: [] } });
    const sa = sf.getSection("a");
    const sb = sf.getSection("b");
    tap.same(sa.current, { mut: [] });
    tap.same(sb.current, { mut: [] });

    const toka = ["A", "B", "C"].map(name =>
      sa.makeToken(...makePair(`early${name}`))
    );
    const tokb = ["D", "E", "F"].map(name =>
      sb.makeToken(...makePair(`early${name}`))
    );

    await toka[0].fork()(...makePair(`lateA1`));
    checkState({ a: { mut: [] }, b: { mut: [] } });
    tap.same(fixups, []);

    await toka[0](...makePair(`lateA2`));
    checkState({ a: { mut: ["earlyA", "lateA1", "lateA2"] }, b: { mut: [] } });
    tap.same(fixups, ["earlyA", "lateA1", "lateA2"]);

    await tokb[2](...makePair(`lateF`));
    checkState({ a: { mut: ["earlyA", "lateA1", "lateA2"] }, b: { mut: [] } });
    tap.same(fixups, ["earlyA", "lateA1", "lateA2"]);

    await tokb[0](...makePair(`lateD`));
    checkState({
      a: { mut: ["earlyA", "lateA1", "lateA2"] },
      b: { mut: ["earlyD", "lateD"] }
    });
    tap.same(fixups, ["earlyA", "lateA1", "lateA2", "earlyD", "lateD"]);

    await tokb[1](...makePair(`lateE`));
    checkState({
      a: { mut: ["earlyA", "lateA1", "lateA2"] },
      b: { mut: ["earlyD", "lateD", "earlyE", "lateE", "earlyF", "lateF"] }
    });
    tap.same(fixups, [
      "earlyA",
      "lateA1",
      "lateA2",
      "earlyD",
      "lateD",
      "earlyE",
      "lateE",
      "earlyF",
      "lateF"
    ]);
  });
});

tap.test(`negative`, async () => {
  await testWithTemp(async file => {
    const sf = await StateFile.create(file, {});
    tap.throws(() => {
      for (let i = 0; i < 100; i++) sf.makeToken(state => {});
    });
  });
  tap.test(`too many tokens`, async () => {});
});
