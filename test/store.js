const tap = require("tap");
const fs = require("fs");
const { StateFile } = require("..");

const { testWithTemp } = require("../lib/test/util");

tap.test(`state`, async () => {
  await testWithTemp(async (file, checkState) => {
    const sf = await StateFile.create(file, { a: { v: 1 } });

    await checkState({ a: { v: 1 } });
    const toka1 = sf.makeToken("a", state => {
      state.v = 2;
    });
    const toka2 = sf.makeToken("a", state => {
      state.v = 3;
    });
    const toka3 = sf.makeToken("a", state => {
      state.v = 4;
    });
    const toka4 = sf.makeToken("a", state => {});
    const tokb1 = sf.makeToken("b", state => {
      state.v = 1;
    });
    const tokb2 = sf.makeToken("b", state => {
      state.v = 2;
    });
    const tokb3 = sf.makeToken("b", state => {
      state.v = 3;
    });

    const toka2b = toka2.fork();
    const toka2c = toka2b.fork();

    await toka1();
    await checkState({ a: { v: 2 } });
    await toka2();
    await checkState({ a: { v: 2 } });
    await toka3();
    await checkState({ a: { v: 2 } });
    await toka2b();
    await checkState({ a: { v: 2 } });
    await toka2c();
    await checkState({ a: { v: 4 } });
    await toka4();
    await checkState({ a: { v: 4 } });

    await tokb3();
    await checkState({ a: { v: 4 } });
    await tokb2();
    await checkState({ a: { v: 4 } });
    await tokb1();
    await checkState({ a: { v: 4 }, b: { v: 3 } });
  });
});

tap.test(`negative`, async () => {
  tap.rejects(() => StateFile.create("does-not-exist.json"), /ENOENT/);
});
