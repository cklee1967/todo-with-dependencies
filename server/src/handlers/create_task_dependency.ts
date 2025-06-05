
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { type CreateTaskDependencyInput, type TaskDependency } from '../schema';
import { eq } from 'drizzle-orm';

export const createTaskDependency = async (input: CreateTaskDependencyInput): Promise<TaskDependency> => {
  try {
    // Verify both tasks exist to prevent foreign key constraint violations
    const [task, dependsOnTask] = await Promise.all([
      db.select().from(tasksTable).where(eq(tasksTable.id, input.task_id)).execute(),
      db.select().from(tasksTable).where(eq(tasksTable.id, input.depends_on_task_id)).execute()
    ]);

    if (task.length === 0) {
      throw new Error(`Task with id ${input.task_id} not found`);
    }

    if (dependsOnTask.length === 0) {
      throw new Error(`Task with id ${input.depends_on_task_id} not found`);
    }

    // Insert task dependency record
    const result = await db.insert(taskDependenciesTable)
      .values({
        task_id: input.task_id,
        depends_on_task_id: input.depends_on_task_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task dependency creation failed:', error);
    throw error;
  }
};
