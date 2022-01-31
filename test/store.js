const tap = require("tap");
const _ = require("lodash");
const { StateFile } = require("..");
const Promise = require("bluebird");

const { testWithTemp } = require("../lib/test/util");

tap.test(`basic`, async () => {
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
    const toka4 = sf.makeToken("a", () => {});
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

tap.test(`waitForChange`, async () => {
  await testWithTemp(async (file, checkState) => {
    const sf = await StateFile.create(file, { state: { v: 1 } });
    const tok = sf.makeToken("state", s => {
      s.v = 2;
    });
    let changes = 0;
    const waiter = sf.waitForChange().then(() => changes++);
    await Promise.delay(250);
    await tok();
    await waiter;
    checkState({ state: { v: 2 } });
    tap.same(changes, 1);
  });
});

tap.test(`doOnce`, async () => {
  await testWithTemp(async (file, checkState) => {
    const sf = await StateFile.create(file, { s: { v: 1 } });
    const seen = [];
    const work = await Promise.all(
      _.range(10).map(i =>
        sf.doOnce("work", async () => {
          Promise.delay(10);
          seen.push(`tag${i}`);
          return `tag${i}`;
        })
      )
    );
    tap.same(work.length, 10);
    tap.same(seen.length, 1);

    const work2 = await Promise.all(
      _.range(10).map(i =>
        sf.doOnce("work", async () => {
          Promise.delay(10);
          seen.push(`bad${i}`);
          return `bad${i}`;
        })
      )
    );

    tap.same(work2, work);
    tap.same(seen.length, 1);
  });
});

tap.test(`negative`, async () => {
  tap.rejects(() => StateFile.create("does-not-exist.json"), /ENOENT/);
});
