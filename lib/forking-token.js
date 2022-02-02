const assert = require("assert");
const _ = require("lodash");

function forkingToken(tok) {
  if (tok.fork) throw new Error(`Already forking`);
  let refCount = 0;
  const allArgs = [];
  tok.fork = () => {
    let called = 0;
    const cb = async (...args) => {
      if (called++) throw new Error(`Completion token called more than once`);
      args.map((arg, i) => arg && (allArgs[i] = allArgs[i] || []).push(arg));
      assert(refCount > 0);
      if (--refCount === 0) await Promise.resolve(tok(...allArgs));
    };
    cb.fork = tok.fork;
    refCount++;
    return cb;
  };

  return tok.fork();
}

const combineTokens = (...toks) => {
  return (
    toks =>
    (...args) =>
      Promise.all(toks.map(tok => tok(...args)))
  )(_.flattenDeep(toks));
};

module.exports = { forkingToken, combineTokens };
