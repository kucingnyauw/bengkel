 class CatchAsync {
  static run(fn) {
    return function (req, res, next) {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}


export default CatchAsync;