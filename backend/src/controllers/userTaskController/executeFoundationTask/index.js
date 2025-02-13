const { executeTask } = require('./executeTask');
const { architectCode } = require('./architectCode');
const { pickBestCode } = require('./pickBestCode');

async function executeFoundationTask(input) {
  // Generate 3 code versions using executeTask and pick the best one
  const codeVersions = await Promise.all([
    executeTask(input),
    executeTask(input),
    executeTask(input)
  ]);
  return await pickBestCode(input, codeVersions);
}

async function modularizeCode(input, foundationCode, subtasks) {
  const modularizedVersions = await Promise.all([
    architectCode(input, foundationCode, subtasks),
    architectCode(input, foundationCode, subtasks),
    architectCode(input, foundationCode, subtasks)
  ]);
  return await pickBestCode(input, modularizedVersions);
}

module.exports = { executeFoundationTask, modularizeCode };