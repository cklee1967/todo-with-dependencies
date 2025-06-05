
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { type TaskWithDependencies } from '../schema';
import { eq } from 'drizzle-orm';

export const getTask = async (id: number): Promise<TaskWithDependencies> => {
  try {
    // Get the main task
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();

    if (tasks.length === 0) {
      throw new Error(`Task with id ${id} not found`);
    }

    const task = tasks[0];

    // Get dependencies (tasks this task depends on)
    const dependencies = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.task_id, id))
      .execute();

    // Get dependents (tasks that depend on this task)
    const dependents = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.depends_on_task_id, id))
      .execute();

    return {
      ...task,
      dependencies,
      dependents
    };
  } catch (error) {
    console.error('Get task failed:', error);
    throw error;
  }
};
