
import { db } from '../db';
import { taskDependenciesTable } from '../db/schema';
import { type DeleteTaskDependencyInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTaskDependency = async (input: DeleteTaskDependencyInput): Promise<{ success: boolean }> => {
  try {
    // Delete the task dependency record
    const result = await db.delete(taskDependenciesTable)
      .where(eq(taskDependenciesTable.id, input.id))
      .execute();

    // Return success status based on whether a record was deleted
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Task dependency deletion failed:', error);
    throw error;
  }
};
