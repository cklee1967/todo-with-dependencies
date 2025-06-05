
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { type TaskWithDependencies } from '../schema';
import { eq } from 'drizzle-orm';

export const getTasks = async (): Promise<TaskWithDependencies[]> => {
  try {
    // Get all tasks
    const tasks = await db.select()
      .from(tasksTable)
      .execute();

    // Get all task dependencies
    const dependencies = await db.select()
      .from(taskDependenciesTable)
      .execute();

    // Map tasks with their dependencies and dependents
    return tasks.map(task => {
      // Find dependencies (tasks this task depends on)
      const taskDependencies = dependencies.filter(dep => dep.task_id === task.id);
      
      // Find dependents (tasks that depend on this task)
      const taskDependents = dependencies.filter(dep => dep.depends_on_task_id === task.id);

      return {
        ...task,
        dependencies: taskDependencies,
        dependents: taskDependents
      };
    });
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
};
