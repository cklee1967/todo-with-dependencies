
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test helper to create a task
const createTestTask = async (title: string = 'Test Task'): Promise<number> => {
  const result = await db.insert(tasksTable)
    .values({
      title,
      due_date: null,
      is_completed: false
    })
    .returning()
    .execute();
  
  return result[0].id;
};

// Test helper to create a task dependency
const createTestDependency = async (taskId: number, dependsOnTaskId: number): Promise<void> => {
  await db.insert(taskDependenciesTable)
    .values({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId
    })
    .execute();
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create test task
    const taskId = await createTestTask('Task to Delete');

    // Delete the task
    const result = await deleteTask({ id: taskId });

    // Verify success response
    expect(result.success).toBe(true);

    // Verify task was actually deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false for non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const result = await deleteTask({ id: 999999 });

    // Should return success: false
    expect(result.success).toBe(false);
  });

  it('should cascade delete associated dependencies', async () => {
    // Create two test tasks
    const taskId1 = await createTestTask('Task 1');
    const taskId2 = await createTestTask('Task 2');

    // Create dependency between tasks
    await createTestDependency(taskId1, taskId2);

    // Verify dependency was created
    const dependenciesBefore = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.task_id, taskId1))
      .execute();
    expect(dependenciesBefore).toHaveLength(1);

    // Delete the main task
    const result = await deleteTask({ id: taskId1 });

    // Verify task deletion succeeded
    expect(result.success).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId1))
      .execute();
    expect(tasks).toHaveLength(0);

    // Verify associated dependencies were cascade deleted
    const dependenciesAfter = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.task_id, taskId1))
      .execute();
    expect(dependenciesAfter).toHaveLength(0);

    // Verify the other task still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId2))
      .execute();
    expect(remainingTasks).toHaveLength(1);
  });

  it('should handle deleting task that is a dependency of others', async () => {
    // Create two test tasks
    const taskId1 = await createTestTask('Dependent Task');
    const taskId2 = await createTestTask('Dependency Task');

    // Create dependency (task1 depends on task2)
    await createTestDependency(taskId1, taskId2);

    // Delete the dependency task (task2)
    const result = await deleteTask({ id: taskId2 });

    // Verify deletion succeeded
    expect(result.success).toBe(true);

    // Verify the dependency task was deleted
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId2))
      .execute();
    expect(deletedTasks).toHaveLength(0);

    // Verify the dependency relationship was cascade deleted
    const dependencies = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.depends_on_task_id, taskId2))
      .execute();
    expect(dependencies).toHaveLength(0);

    // Verify the dependent task still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId1))
      .execute();
    expect(remainingTasks).toHaveLength(1);
  });
});
