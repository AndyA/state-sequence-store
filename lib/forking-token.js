const assert = require("assert");

module.exports = tok => {
  if (tok.fork) throw new Error(`Already forking`);
  let refCount = 0;
  const mutators = [];
  const fixups = [];
  tok.fork = () => {
    let called = 0;
    const cb = async (mut, fixup) => {
      if (called++) throw new Error(`Completion token called more than once`);
      mutators.push(mut);
      fixups.push(fixup);
      assert(refCount > 0);
      if (--refCount === 0) await Promise.resolve(tok(mutators, fixups));
    };
    cb.fork = tok.fork;
    refCount++;
    return cb;
  };

  return tok.fork();
};
