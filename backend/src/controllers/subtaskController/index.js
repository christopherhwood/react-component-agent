const SubtaskModel = require('../../services/db/models/subtask');
const EditModel = require('../../services/db/models/edit');
const UserTaskModel = require('../../services/db/models/userTask');
const { executeSubtask } = require('./executeSubtask');
const { generateSubtasks } = require('./generateSubtasks');

/**
 * Creates a list of subtasks for the given input user task.
 * @param {string} input - The input for the user task
 * @param {string} userTaskId - The ID of the user task
 * @param {string} foundationCode - The foundation code for the user task
 * @param {boolean} save - Whether to save the subtasks to the database
 * @returns {Promise<{id: string, description: string, status: string, code: string}[]>}
 * @throws {Error} If any helper functions error out
 */
async function createTasks(input, userTaskId, foundationCode, save=true) {
  // Request LLM to return a list of subtasks for the given input request.
  const subtaskTitles = await generateSubtasks(input, foundationCode);
  let subtasks = subtaskTitles.map((title, index) => ({
    index: `${index}`,
    userTaskId,
    title,
    status: 'PENDING',
    code: null,
  }));

  if (save) {
    let savePromises = [];
    for (const subtask of subtasks) {
      let model = new SubtaskModel({title: subtask.title, status: subtask.status, userTaskId: subtask.userTaskId});
      savePromises.push(model.save());
    }
    const ids = await Promise.all(savePromises);
    subtasks = subtasks.map((subtask, index) => ({...subtask, id: ids[index]._id, userTaskId}));
  }

  return subtasks;
}

async function executeTask(ctx) {
  try {
    const { taskId } = ctx.request.body;
    let subtask = await SubtaskModel.findById(taskId);
    let userTask = await UserTaskModel.findById(subtask.userTaskId);
    const edits = await executeSubtask(subtask, userTask.code);
    subtask.status = 'SUCCESS';
    // Save edits
    const editSavePromises = edits.map(async edit => {
      let model = new EditModel(edit);
      return model.save();
    });
    await Promise.all(editSavePromises);
    subtask = await subtask.save();

    // Early return if there are no edits to make.
    if (edits.length === 0) {
      ctx.status = 200;
      ctx.body = { 
        task: { 
          id: subtask._id, 
          code: userTask.code, 
          status: subtask.status, 
          title: subtask.title,
          userTaskId: subtask.userTaskId,
        } 
      };
      return;
    }

    const jsCode = edits[edits.length - 1].newCode;
    userTask.code = jsCode;
    await userTask.save();

    ctx.status = 200;
    ctx.body = { 
      task: 
      {
        id: subtask._id,
        code: jsCode,
        status: subtask.status,
        title: subtask.title,
        userTaskId: subtask.userTaskId,
      }
    };
  } catch (error) {
    console.error('Failed to execute task:', error);
    ctx.status = 500;
    ctx.body = { message: 'Failed to execute task' };
  }
}

// TODO - handleTaskFailedToRender

// TODO - markTaskRenderedSuccess

module.exports = {
  createTasks,
  executeTask,
};