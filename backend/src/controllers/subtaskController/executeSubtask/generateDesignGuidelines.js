const { queryLlm } = require('../../../services/llm');

async function generateDesignGuidelines(task, code) {
  const res = await queryLlm([
    { role: 'system', content: SystemPrompt },
    { role: 'user', content: query(task, code) }
  ]);
  return res.content;
}

const query = (task, code) => {
  return `# Task: ${task}\n\`\`\`jsx\n${code}\n\`\`\``;
};

const SystemPrompt = `You are a frontend web design expert specialized in using tailwind css and React. Your team is working on a new web development task and needs your help to come up with some brief but thorough design guidelines.

The team has already started work on the task, as you can see in the code that's provided. Your job is to review the task at hand and the code and deliver a set of focused design guidelines to the team. 

When it comes to color choices, please note that your component will be displayed on a screen with a background of \`bg-grey-950\`.

You will return your guidelines using markdown. The highest level title you may use is ##.`;

module.exports = { generateDesignGuidelines };