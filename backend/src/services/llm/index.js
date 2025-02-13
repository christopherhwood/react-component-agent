const { OpenAI } = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

/**
 * @param {string[]} messages - The messages to send to LLM, must be an array of {role, content} objects where role is 'system', 'assistant', or 'user' and content is a string.
 * @param {number} temperature - The temperature to use for the LLM query, must be between 0 and 1.
 * @returns {Promise<{role, content}>}
 * @throws {Error} If the LLM errors out
 */
async function queryLlm(messages, temperature=0) {
  console.log('queryLlm:', JSON.stringify(messages));
  const res = await openai.chat.completions.create({
    model: 'gpt-4-0125-preview',
    messages: messages,
    temperature: temperature,
    top_p: 1,
    max_tokens: 4096,
  });
  const message = res.choices[0].message;
  console.log('response:', JSON.stringify(message));
  return message;
}

/**
 * @param {string[]} messages - The messages to send to LLM, must be an array of {role, content} objects where role is 'system', 'assistant', or 'user' and content is a string.
 * @param {function} jsonValidator - Returns true if the JSON is valid. Throws an error if the JSON is invalid.
 * @param {number} temperature - The temperature to use for the LLM query, must be between 0 and 1.
 * @param {Error} err - An error from a previous run if run inside asyncRetry
 * @returns {Promise<{role, content}>}
 * @throws {Error} If the LLM errors out or if the json response is invalid
 */
async function queryLlmWithJsonValidation(messages, jsonValidator, temperature=0, err=null) {
  if (err) {
    messages = messages.concat(err.messages || []);
  }
  console.log('queryLlmWithJsonValidation:', JSON.stringify(messages));
  const res = await openai.chat.completions.create({
    model: 'gpt-4-0125-preview',
    messages: messages,
    temperature: temperature,
    top_p: 1,
    max_tokens: 4096,
    response_format: {type: 'json_object'},
  });
  const message = res.choices[0].message;
  console.log('response:', JSON.stringify(message));
  try {
    const json = JSON.parse(message.content);
    if (jsonValidator(json)) {
      return message;
    }
  } catch (err) {
    err.messages = [message, {role: 'user', content: `Error: ${err.message}`}];
    console.error(err);
    throw err;
  }
}

module.exports = {
  queryLlm,
  queryLlmWithJsonValidation,
};