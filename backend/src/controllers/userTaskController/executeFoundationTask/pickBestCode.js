const { queryLlmWithJsonValidation } = require('../../../services/llm');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

async function pickBestCode(task, codeVersions) {
  const validateCode = (json) => {
    if (!json.index || typeof json.index !== 'number' || json.index < 1 || json.index > codeVersions.length) {
      throw new InvalidJsonError('Invalid code');
    }
    return true;
  };

  const res = await queryLlmWithJsonValidation([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query(task, codeVersions) }
  ], validateCode);
  const idx = JSON.parse(res.content).index;
  return codeVersions[idx - 1];
}

const query = (task, codeVersions) => {
  return `# Task: ${task}\n\n# Foundation Code Choices:\`\`\`json\n${JSON.stringify(codeVersions)}\n\`\`\``;
};

const systemPrompt = `You are a staff software engineer working building a UI Component for your company's SaaS app using React and TailwindCss. You will receive a task from the user and a few versions of foundational code to be used as a starting point for the component.

Your goal is to select the code that gives the best foundation to build on. That means thinking about which code is the most complete and production ready. Ideally the team will not have to make major refactors on this foundational code, so the base elements and components should be sound choices to build on top of.

The code versions will be presented in a javascript array. You will return the index of the code version that you think is the best to build on, in json format like so: {index: 1}. The index is 1-based, so the first code version is index 1, the second is index 2, and so on.`;

module.exports = { pickBestCode };