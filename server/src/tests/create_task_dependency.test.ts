
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { type CreateTaskDependencyInput } from '../schema';
import { createTaskDependency } from '../handlers/create_task_dependency';
import { eq } from 'drizzle-orm';

describe('createTaskDependency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task dependency', async () => {
    // Create prerequisite tasks
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'First Task' },
        { title: 'Second Task' }
      ])
      .returning()
      .execute();

    const testInput: CreateTaskDependencyInput = {
      task_id: tasks[0].id,
      depends_on_task_id: tasks[1].id
    };

    const result = await createTaskDependency(testInput);

    // Basic field validation
    expect(result.task_id).toEqual(tasks[0].id);
    expect(result.depends_on_task_id).toEqual(tasks[1].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task dependency to database', async () => {
    // Create prerequisite tasks
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'Task A' },
        { title: 'Task B' }
      ])
      .returning()
      .execute();

    const testInput: CreateTaskDependencyInput = {
      task_id: tasks[0].id,
      depends_on_task_id: tasks[1].id
    };

    const result = await createTaskDependency(testInput);

    // Query using proper drizzle syntax
    const dependencies = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.id, result.id))
      .execute();

    expect(dependencies).toHaveLength(1);
    expect(dependencies[0].task_id).toEqual(tasks[0].id);
    expect(dependencies[0].depends_on_task_id).toEqual(tasks[1].id);
    expect(dependencies[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when task_id does not exist', async () => {
    // Create only one task
    const tasks = await db.insert(tasksTable)
      .values([{ title: 'Existing Task' }])
      .returning()
      .execute();

    const testInput: CreateTaskDependencyInput = {
      task_id: 999, // Non-existent task
      depends_on_task_id: tasks[0].id
    };

    await expect(createTaskDependency(testInput)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should throw error when depends_on_task_id does not exist', async () => {
    // Create only one task
    const tasks = await db.insert(tasksTable)
      .values([{ title: 'Existing Task' }])
      .returning()
      .execute();

    const testInput: CreateTaskDependencyInput = {
      task_id: tasks[0].id,
      depends_on_task_id: 999 // Non-existent task
    };

    await expect(createTaskDependency(testInput)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should allow multiple dependencies for the same task', async () => {
    // Create three tasks
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'Main Task' },
        { title: 'Dependency 1' },
        { title: 'Dependency 2' }
      ])
      .returning()
      .execute();

    // Create two dependencies for the main task
    const dependency1 = await createTaskDependency({
      task_id: tasks[0].id,
      depends_on_task_id: tasks[1].id
    });

    const dependency2 = await createTaskDependency({
      task_id: tasks[0].id,
      depends_on_task_id: tasks[2].id
    });

    // Verify both dependencies exist
    const dependencies = await db.select()
      .from(taskDependenciesTable)
      .where(eq(taskDependenciesTable.task_id, tasks[0].id))
      .execute();

    expect(dependencies).toHaveLength(2);
    expect(dependencies.map(d => d.depends_on_task_id)).toContain(tasks[1].id);
    expect(dependencies.map(d => d.depends_on_task_id)).toContain(tasks[2].id);
  });
});
