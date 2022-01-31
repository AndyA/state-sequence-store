const assert = require("assert");

module.exports = tok => {
  if (tok.fork) throw new Error(`Already forking`);
  let refCount = 0;
  const allArgs = [];
  tok.fork = () => {
    let called = 0;
    const cb = async (...args) => {
      if (called++) throw new Error(`Completion token called more than once`);
      args.map((arg, i) => (allArgs[i] = allArgs[i] || []).push(arg));
      assert(refCount > 0);
      if (--refCount === 0) await Promise.resolve(tok(...allArgs));
    };
    cb.fork = tok.fork;
    refCount++;
    return cb;
  };

  return tok.fork();
};
