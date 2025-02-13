const subtaskController = require('../subtaskController');
const UserTaskModel = require('../../services/db/models/userTask');
const { executeFoundationTask, modularizeCode } = require('./executeFoundationTask');
const SubtaskModel = require('../../services/db/models/subtask');
const EditModel = require('../../services/db/models/edit');
const { generateLintFixes } = require('../subtaskController/executeSubtask/generateLintFixes');
const { lintAndFixCode } = require('../subtaskController/executeSubtask/lint');
const { generateBugFixesForContentEditableCode } = require('../subtaskController/executeSubtask/contentEditable/generateBugFixesForContentEditableCode');
const { generateBugFixesForContentEditableListUse } = require('../subtaskController/executeSubtask/contentEditable/generateBugFixesForContentEditableListUse');


/**
 * Creates a user task with the given input, including a list of subtasks.
 * @param {import('koa').Context} ctx 
 * @returns {Promise<void>}
 */
async function createUserTask(ctx) {
  const { input, category } = ctx.request.body;
  const description = `a ${category} component.\n\n${input}`;
  if (!input || typeof input !== 'string') {
    ctx.status = 400;
    ctx.body = { message: 'Invalid input' };
  }

  console.log('createUserTask input:', input);
  let userTask;
  try {
    userTask = new UserTaskModel({ title: input.length < 40 ? input : 'New Component', category: category, description: input, status: 'PENDING', userId: ctx.state.user?._id });
    userTask = await userTask.save();
  } catch (error) {
    console.error('Failed to create user task:', error);
    ctx.status = 500;
    return;
  }

  try {
    // Build code foundation and create subtasks
    const foundationCode = await executeFoundationTask(description);
    

    let tasks = await subtaskController.createTasks(description, userTask._id, foundationCode, false);

    const modularizedFoundationCode = await modularizeCode(description, foundationCode, tasks);

    let foundationTask = new SubtaskModel({ title: 'Build foundation', status: 'SUCCESS', userTaskId: userTask._id });
    let architectTask = new SubtaskModel({ title: 'Architect code', status: 'SUCCESS', userTaskId: userTask._id });
    [foundationTask, architectTask] = await Promise.all([foundationTask.save(), architectTask.save()]);

    // Revise task list with new subtasks
    tasks = await subtaskController.createTasks(description, userTask._id, modularizedFoundationCode);

    let foundationEdit = new EditModel({ originalCode: '', edit: { codeToReplace: '', newCode: foundationCode }, newCode: foundationCode, subtaskId: foundationTask._id });
    let architectEdit = new EditModel({ originalCode: foundationCode, edit: { codeToReplace: foundationCode, newCode: modularizedFoundationCode }, newCode: modularizedFoundationCode, subtaskId: architectTask._id });
    await Promise.all([foundationEdit.save(), architectEdit.save()]);

    let patchedCode = modularizedFoundationCode;
    if (patchedCode.includes('contentEditable')) {
      try {
        const edits = await generateBugFixesForContentEditableCode(architectTask, patchedCode);
        if (edits.length > 0) {
          patchedCode = edits[edits.length - 1].newCode;
        }
      } catch {
      // Do nothing
      }
    }

    if (patchedCode.includes('insertOrderedList') || patchedCode.includes('insertUnorderedList')) {
      try {
        const edits = await generateBugFixesForContentEditableListUse(architectTask, patchedCode);
        if (edits.length > 0) {
          patchedCode = edits[edits.length - 1].newCode;
        }
      } catch {
      // Do nothing
      }
    }

    const lintResults = await lintAndFixCode(patchedCode);
    patchedCode = lintResults.code;
    const lintEdits = await generateLintFixes(architectTask, patchedCode, lintResults.results);
    if (lintEdits.length > 0) {
      const lintEditPromises = lintEdits.map(edit => {
        let model = new EditModel(edit);
        return model.save();
      });
      await Promise.all(lintEditPromises);
      userTask.code = lintEdits[lintEdits.length - 1].newCode;
    } else {
      userTask.code = patchedCode;
    }    
    userTask = await userTask.save();
    
    tasks.unshift({ index: -2, id: foundationTask._id, title: foundationTask.title, status: foundationTask.status, code: foundationCode, userTaskId: userTask._id}, { index: -1, id: architectTask._id, title: architectTask.title, status: architectTask.status, code: userTask.code, userTaskId: userTask._id });

    ctx.status = 201;
    ctx.body = { 
      id: userTask._id, 
      title: userTask.title, 
      category: userTask.category,
      description: userTask.description,
      created: userTask.createdAt.getTime(), 
      tasks 
    };
  } catch (error) {
    console.error('Failed to create user task:', error);
    ctx.status = 500;
    ctx.body = { message: 'Failed to create user task' };
  }
}

async function getUserTasks(ctx) {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 404;
    return;
  }
  try {
    const userTasks = await UserTaskModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    const tasksWithSubtasks = await Promise.all(userTasks.map(async (userTask) => {
      let subtasks = await SubtaskModel.find({ userTaskId: userTask._id }).sort({ createdAt: 1 }).lean();
      for (let i = 0; i < subtasks.length; i++) {
        const edits = await EditModel.find({ subtaskId: subtasks[i]._id }).sort({ createdAt: -1 }).lean();
        if (edits.length > 0) {
          subtasks[i].code = edits[0].newCode;
        }
      }
      // Prioritize specific subtasks
      const foundationSubtaskIndex = subtasks.findIndex(subtask => subtask.title.trim() === 'Build foundation');
      const architectSubtaskIndex = subtasks.findIndex(subtask => subtask.title.trim() === 'Architect code');
      if (foundationSubtaskIndex !== -1) {
        const [foundationSubtask] = subtasks.splice(foundationSubtaskIndex, 1);
        subtasks.unshift(foundationSubtask);
      }
      if (architectSubtaskIndex !== -1) {
        const [architectSubtask] = subtasks.splice(architectSubtaskIndex, 1);
        subtasks.splice(1, 0, architectSubtask); // Insert at index 1, assuming "Build foundation" is at index 0
      }
      console.log('task title:', userTask.title);
      console.log('subtask titles:', subtasks.map(subtask => subtask.title).join(', '));
      return {
        id: userTask._id,
        title: userTask.title,
        category: userTask.category,
        description: userTask.description,
        created: userTask.createdAt.getTime(),
        tasks: subtasks.map(subtask => ({
          id: subtask._id,
          title: subtask.title,
          status: subtask.status,
          createdAt: subtask.createdAt.toDateString(),
          updatedAt: subtask.updatedAt.toDateString(),
          userTaskId: subtask.userTaskId,
          code: subtask.code
        })),
      };
    }));
    ctx.status = 200;
    ctx.body = { userTasks: tasksWithSubtasks };
  } catch (error) {
    console.error('Failed to get user tasks with subtasks:', error);
    ctx.status = 500;
    ctx.body = { message: 'Failed to get user tasks' };
  }
}

// TODO - mark user task success/failure

module.exports = {
  createUserTask,
  getUserTasks
};
