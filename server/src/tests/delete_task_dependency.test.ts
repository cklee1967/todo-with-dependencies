
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { type DeleteTaskDependencyInput } from '../schema';
import { deleteTaskDependency } from '../handlers/delete_task_dependency';
import { eq } from 'drizzle-orm';

describe('deleteTaskDependency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task dependency', async () => {
    // Create test tasks first
    const [task1, task2] = await db.insert(tasksTable)
      .values([
        { title: 'Task 1' },
        { title: 'Task 2' }
      ])
      .returning()
      .execute();

    // Create task dependency
    const [dependency] = await db.insert(taskDependenciesTable)
      .values({
        task_id: task1.id,
        depends_on_task_id: task2.id
      })
      .returning()
      .execute();

    const input: DeleteTaskDependencyInput = { id: dependency.id };
    const result = await deleteTaskDependency(input);

    expect(result.success).toBe(true);

    // Verify the dependency was deleted from database
    const deletedDependency = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.id, dependency.id))
      .execute();

    expect(deletedDependency).toHaveLength(0);
  });

  it('should return false for non-existent task dependency', async () => {
    const input: DeleteTaskDependencyInput = { id: 999 };
    const result = await deleteTaskDependency(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other task dependencies when deleting one', async () => {
    // Create test tasks
    const [task1, task2, task3] = await db.insert(tasksTable)
      .values([
        { title: 'Task 1' },
        { title: 'Task 2' },
        { title: 'Task 3' }
      ])
      .returning()
      .execute();

    // Create multiple task dependencies
    const [dependency1, dependency2] = await db.insert(taskDependenciesTable)
      .values([
        { task_id: task1.id, depends_on_task_id: task2.id },
        { task_id: task2.id, depends_on_task_id: task3.id }
      ])
      .returning()
      .execute();

    // Delete the first dependency
    const input: DeleteTaskDependencyInput = { id: dependency1.id };
    const result = await deleteTaskDependency(input);

    expect(result.success).toBe(true);

    // Verify only the first dependency was deleted
    const remainingDependencies = await db.select()
      .from(taskDependenciesTable)
      .execute();

    expect(remainingDependencies).toHaveLength(1);
    expect(remainingDependencies[0].id).toBe(dependency2.id);
  });
});
