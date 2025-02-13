/**
 * Retry an async function
 * @param {function} fn - The async function to retry
 * @param {function} isErrorRetryable - Returns true if the error is retryable
 * @param {number} retries - The number of times to retry the function
 * @param {number} delay - The delay in milliseconds between retries
 * @param {Error} err - An error from a previous run if run inside asyncRetry
 * @returns {Promise<any>}
 * @throws {Error} If the function fails after all retries
 */
async function asyncRetry(fn, isErrorRetryable, retries=3, delay=1000, err=null) {
  try {
    if (err) {
      return await fn(err);
    }
    return await fn();
  } catch (error) {
    if (retries > 0 && isErrorRetryable(error)) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      return await asyncRetry(fn, isErrorRetryable, retries - 1, delay * 2, error);
    }
    throw err;
  }
}

module.exports = {
  asyncRetry,
};