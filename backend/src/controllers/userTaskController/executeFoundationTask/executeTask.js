const { queryLlmWithJsonValidation } = require('../../../services/llm');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

async function executeTask(task) {
  const res = await queryLlmWithJsonValidation([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query(task) }
  ], validateCode, 0.5);
  return JSON.parse(res.content).code;
}

const query = (task) => {
  return `# Task: ${task}`;
};

const validateCode = (json) => {
  if (!json.code || typeof json.code !== 'string') {
    throw new InvalidJsonError('Invalid code');
  }
  return true;
};

const systemPrompt = `You are a staff software engineer working building a UI Component for your company's SaaS app using React and TailwindCss. You will receive a task from the user and are responsible for returning a working component that satisfies the request. Make the component as complete and production-ready as possible.

Your team relies a lot on you and may not have through completely through all details of the component. That is okay, they trust your judgement on unspecified details. The most critical part of your work is to return a working component that can render and that satisfies the request. Your code should also be as high quality and production-level as possible. You will be evaulated on how complete and production-ready your component is.

Here are the imports for React, ReactDOM, & PropTypes:
\`\`\`javascript
import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import PropTypes from 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1/+esm';
\`\`\`
Only use these imports and place them at the top of the file. Do NOT import other components or libraries. Do NOT use try to import from 'react' or 'react-dom' or 'prop-types' directly. Use the imports provided.

Do NOT import other components or libraries. Build with just react and tailwind css.

The team will not have time to make major refactors on this foundational code, so the base elements and components should be sound choices to build on top of.

The root element to attach to has the id 'root'.

When it comes to color choices, please note that your component will be displayed on a screen with a dark background of \`bg-grey-950\`. Be careful using dark colors as they may not be visible.

A few thoughts to help you get started: 
- if the task is to build a text input, think about how much control over styling will be needed. For components that require more styling, prefer a contentEditable. For those that are just simple inputs that don't require much styling, prefer a controlled element.

Remember to use all subcomponents you built when you render to the root, don't leave anything out!

Return your response in json format like so: \`{code: ''}\``;

module.exports = { executeTask };