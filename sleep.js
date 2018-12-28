module.exports = {
  sleep : async (second) => {
    const time = 1 * second + 1;
    return new Promise((resolve, reject) => setTimeout(() => resolve(true), time * 1000));
  },
  sleepPromise : (second) => {
    const time = 1 * second + 1;
    return new Promise((resolve, reject) => setTimeout(() => resolve(true), time * 1000));
  }
};
