
import { db } from '../db';
import { taskDependenciesTable } from '../db/schema';
import { type TaskDependency } from '../schema';

export const getTaskDependencies = async (): Promise<TaskDependency[]> => {
  try {
    const result = await db.select()
      .from(taskDependenciesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get task dependencies:', error);
    throw error;
  }
};
