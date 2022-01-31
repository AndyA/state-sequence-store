const tap = require("tap");
const fs = require("fs");

async function testWithTemp(callback) {
  const tempy = await (await import("tempy")).default;
  await tempy.file.task(
    async file => {
      const checkState = async state => {
        const saved = JSON.parse(await fs.promises.readFile(file));
        tap.same(saved, state);
      };
      await callback(file, checkState);
    },
    { extension: "json" }
  );
}

module.exports = { testWithTemp };
