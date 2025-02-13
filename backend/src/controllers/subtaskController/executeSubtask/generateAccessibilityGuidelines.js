const { queryLlm } = require('../../../services/llm');

async function generateAccessibilityGuidelines(task) {
  const res = await queryLlm([
    { role: 'system', content: SystemPrompt },
    { role: 'user', content: query(task) }
  ]);
  return res.content;
}

const query = (task) => {
  return `Task: ${task}`;
};

const SystemPrompt = 'You are a frontend web accessibility expert specialized in using React and Tailwind css. Your team is working on a new web development task and needs your help to come up with some brief but thorough accessibility guidelines. You will receive a task and reply with a list of guidelines in markdown. The highest level title you may use is ##.';

module.exports = { generateAccessibilityGuidelines };