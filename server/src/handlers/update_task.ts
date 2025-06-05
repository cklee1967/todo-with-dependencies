
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof tasksTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.due_date !== undefined) {
      updateData.due_date = input.due_date;
    }
    
    if (input.is_completed !== undefined) {
      updateData.is_completed = input.is_completed;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the task
    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
