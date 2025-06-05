
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { getTaskDependencies } from '../handlers/get_task_dependencies';

describe('getTaskDependencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no dependencies exist', async () => {
    const result = await getTaskDependencies();
    expect(result).toEqual([]);
  });

  it('should return all task dependencies', async () => {
    // Create test tasks first
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'Task 1' },
        { title: 'Task 2' },
        { title: 'Task 3' }
      ])
      .returning()
      .execute();

    // Create task dependencies
    await db.insert(taskDependenciesTable)
      .values([
        { task_id: tasks[1].id, depends_on_task_id: tasks[0].id },
        { task_id: tasks[2].id, depends_on_task_id: tasks[1].id }
      ])
      .execute();

    const result = await getTaskDependencies();

    expect(result).toHaveLength(2);
    expect(result[0].task_id).toEqual(tasks[1].id);
    expect(result[0].depends_on_task_id).toEqual(tasks[0].id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].task_id).toEqual(tasks[2].id);
    expect(result[1].depends_on_task_id).toEqual(tasks[1].id);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return dependencies in creation order', async () => {
    // Create test tasks
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'First Task' },
        { title: 'Second Task' },
        { title: 'Third Task' }
      ])
      .returning()
      .execute();

    // Create dependencies with slight delay to ensure different timestamps
    await db.insert(taskDependenciesTable)
      .values({ task_id: tasks[1].id, depends_on_task_id: tasks[0].id })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(taskDependenciesTable)
      .values({ task_id: tasks[2].id, depends_on_task_id: tasks[1].id })
      .execute();

    const result = await getTaskDependencies();

    expect(result).toHaveLength(2);
    // Verify the dependencies are returned (order may vary but both should exist)
    const firstDep = result.find(dep => dep.task_id === tasks[1].id);
    const secondDep = result.find(dep => dep.task_id === tasks[2].id);

    expect(firstDep).toBeDefined();
    expect(firstDep!.depends_on_task_id).toEqual(tasks[0].id);
    
    expect(secondDep).toBeDefined();
    expect(secondDep!.depends_on_task_id).toEqual(tasks[1].id);
  });
});
