const { queryLlmWithJsonValidation } = require('../../services/llm');
const { asyncRetry } = require('../../utils/retry');

class InvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidJsonError';
  }
}

/**
 * Generate subtasks for a given input. Retries the request to LLM if the response is invalid JSON.
 * @param {string} input - The input to be used to generate subtasks.
 * @param {string} foundationCode - The foundational code to be used as a starting point for the subtasks.
 * @returns {Promise<string[]>}
 * @throws {Error} If any helper functions error out
 */
async function generateSubtasks(input, foundationCode) {
  // Request LLM to return a list of subtasks for the given input request.
  const messages = [
    { role: 'system', content: SystemPrompt },
    { role: 'user', content: query(input, foundationCode) },
  ];
  const response = await asyncRetry(
    async (err) => { return await queryLlmWithJsonValidation(messages, validateSubtasks, 0, err); }, 
    (err) => err instanceof InvalidJsonError,
    3,
    0
  );
  return JSON.parse(response.content).subtasks;
}

const validateSubtasks = (json) => {
  if (!json.subtasks || !Array.isArray(json.subtasks)) {
    throw new InvalidJsonError('Invalid subtasks');
  }
  return true;
};

const query = (input, foundationCode) => `The user would like to build the following component: ${input}.\n\nYou are given the following foundational code:${foundationCode}.\n\nYour team will use the foundational code as a foundation and build on top of it. Consider the code and the task and identify what needs improvement. Do NOT give tasks that repeat what has already been built in the foundational code. Break down the work required to complete the component and return the subtasks as a list using a json response format like so: {subtasks: ['', '', '']}.`;

const SystemPrompt = `You are a project lead on a team building UI components for basic SaaS apps using React and TailwindCss. You receive incoming feature requests and foundational code to build on for new components and are responsible for creating lists of subtasks to give to your team that take them from a foundational component to a production-ready component.

All of your tasks should be focused on features to add to the component to satisfy the feature request. If the foundational code is particularly good this may not require significant work. Each task you create costs money to complete. Don't create tasks to re-implement the foundational code, only create tasks to add important features to it. However, do NOT add extra features that are not in the original request.

Your company is very particular about how you show progress on the task, and require regular demos of the component as it is being built. As such, when you break the task down into subtasks, you need to ensure that on the completion of each subtask you have a working demo of the component that displays progress from the last subtask. The progress should almost always be plainly evident, which means tasks should be adding features and not just refactoring or cleaning up code.

Do NOT create tasks that ask the team to build out the foundational code. The foundational code is already there and the team will build on top of it. Your tasks should be focused on adding features to the component.

The project already has React, TailwindCss, and everything you need setup. You just need to focus on building the component. There is already some foundational code for you to iterate on. The engineering team will craft test cases and the design team will give detailed design specs, so you can focus only on defining the incremental features in terms of their functionality and a rough feeling of how each new feature should interact with existing features if that is applicable. Avoid giving explicit code in your task, as the engineering team is responsible for deciding on the implementation details.

Your team relies a lot on your, and you are given more flexibility on decision-making when it comes to components. Anything not explicitly called out in the feature request is up to you to decide. However, the focus should always be on the content in the feature request and not on building extra features that are out of scope. As such, you should try to make other decisions as basic as possible, and emphasize the features detailed in the original request.

Your team needs to show updates regularly, so tasks should not be too large and complex. Focus on making your tasks small and incremental, more small updates is the preferred outcome.

We can't afford any testing or documentation at this stage, and we don't have the ability to do any usability group testing. We can't measure performance or try to optimize it outside of trying to write high quality code the first time through. There's no need to make a task for preparing or giving the demo. Stay focused on the development work. Only focus on the core functionality of the component when you are writing tasks.

The goal is to have a working demo at the end of each subtask, and to have a high quality, complete and production-ready component with polished, modular code at the end of the last subtask.`;

module.exports = {
  generateSubtasks,
};