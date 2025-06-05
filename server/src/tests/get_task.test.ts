
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a task without dependencies', async () => {
    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        due_date: new Date('2024-12-31'),
        is_completed: false
      })
      .returning()
      .execute();

    const result = await getTask(taskResult[0].id);

    expect(result.id).toEqual(taskResult[0].id);
    expect(result.title).toEqual('Test Task');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.is_completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.dependencies).toEqual([]);
    expect(result.dependents).toEqual([]);
  });

  it('should get a task with dependencies and dependents', async () => {
    // Create test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        is_completed: false
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        is_completed: false
      })
      .returning()
      .execute();

    const task3Result = await db.insert(tasksTable)
      .values({
        title: 'Task 3',
        is_completed: false
      })
      .returning()
      .execute();

    // Create dependency: Task 1 depends on Task 2
    const dependencyResult = await db.insert(taskDependenciesTable)
      .values({
        task_id: task1Result[0].id,
        depends_on_task_id: task2Result[0].id
      })
      .returning()
      .execute();

    // Create dependent: Task 3 depends on Task 1
    const dependentResult = await db.insert(taskDependenciesTable)
      .values({
        task_id: task3Result[0].id,
        depends_on_task_id: task1Result[0].id
      })
      .returning()
      .execute();

    const result = await getTask(task1Result[0].id);

    expect(result.id).toEqual(task1Result[0].id);
    expect(result.title).toEqual('Task 1');
    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0].id).toEqual(dependencyResult[0].id);
    expect(result.dependencies[0].task_id).toEqual(task1Result[0].id);
    expect(result.dependencies[0].depends_on_task_id).toEqual(task2Result[0].id);
    expect(result.dependents).toHaveLength(1);
    expect(result.dependents[0].id).toEqual(dependentResult[0].id);
    expect(result.dependents[0].task_id).toEqual(task3Result[0].id);
    expect(result.dependents[0].depends_on_task_id).toEqual(task1Result[0].id);
  });

  it('should throw error for non-existent task', async () => {
    await expect(getTask(999)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should handle null due_date correctly', async () => {
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null due date',
        due_date: null,
        is_completed: true
      })
      .returning()
      .execute();

    const result = await getTask(taskResult[0].id);

    expect(result.due_date).toBeNull();
    expect(result.is_completed).toBe(true);
  });
});
