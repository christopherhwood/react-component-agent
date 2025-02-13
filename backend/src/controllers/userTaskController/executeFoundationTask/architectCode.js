const { queryLlmWithJsonValidation } = require('../../../services/llm');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

async function architectCode(task, foundationCode, subtasks) {
  const res = await queryLlmWithJsonValidation([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query(task, foundationCode, subtasks) }
  ], validateCode, 0.5);
  return JSON.parse(res.content).code;
}

const query = (task, foundationCode, subtasks) => {
  let query = `# Task: ${task}`;
  query += `\n\n# Foundation Code:\n\`\`\`jsx\n${foundationCode}\n\`\`\``;
  query += `\n\n# Subtasks:\n\`\`\`json\n${JSON.stringify(subtasks)}\n\`\`\``;
  return query;
};

const validateCode = (json) => {
  if (!json.code || typeof json.code !== 'string') {
    throw new InvalidJsonError('Invalid code');
  }
  return true;
};

const systemPrompt = `You are a frontend software architect working building a UI Component for your company's SaaS app using React and TailwindCss. You will receive a task from the user along with some foundational code for the component and a list of subtasks that detail plans for future component development. You are responsible for editing the foundational code to lay the architectural foundations for the future component work. Your key goal is to create a solid architecture that keeps the code modular and maintainable.

A few techniques you might use to achieve this are:
- Container components: These are components that are responsible for managing state and data. They are often used to wrap around presentational components and pass data and functions to them. They are a good way to separate concerns and keep your code modular.
- Custom hooks: These are a way to extract component logic into reusable functions. They are a good way to keep your code DRY and make it more maintainable.
- Context: This is a way to share data between components without having to explicitly pass it through props. It is a good way to avoid prop drilling and keep your code modular.
- Higher order components: These are a way to share code between components. They are a good way to keep your code DRY and make it more maintainable.
- Render props: This is a way to share code between components. It is a good way to keep your code DRY and make it more maintainable.
- useMemo and useCallback: These are ways to optimize your code by memoizing values and functions. They are a good way to keep your code performant.
- controlled components: These are a way to manage form state in React. They are a good way to keep your code modular and maintainable.
- Error boundaries: These are a way to handle errors in your components. They are a good way to keep your code robust and maintainable.
- Suspense: This is a way to handle loading states in your components. It is a good way to keep your code robust and maintainable.

Here are the imports for React, ReactDOM, & PropTypes:
\`\`\`javascript
import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';
import PropTypes from 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1/+esm';
\`\`\`
Only use these imports and place them at the top of the file. Do NOT import other components or libraries. Do NOT use try to import from 'react' or 'react-dom' or 'prop-types' directly. Use the imports provided.

Do NOT import other components or libraries. Build with just react and tailwind css.

The team will not have time to make major refactors on this foundational code, so the foundational architecture must be sound.

The root element to attach to has the id 'root'.

When it comes to color choices, please note that your component will be displayed on a screen with a dark background of \`bg-grey-950\`. Be careful using dark colors as they may not be visible.

Remember to use all subcomponents you built when you render to the root, don't leave anything out!

Return your response in json format like so: \`{code: ''}\``;

module.exports = { architectCode };