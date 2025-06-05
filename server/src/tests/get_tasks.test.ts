
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, taskDependenciesTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    
    expect(result).toEqual([]);
  });

  it('should return tasks without dependencies', async () => {
    // Create test tasks
    const tasks = await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          due_date: null,
        },
        {
          title: 'Task 2',
          due_date: new Date('2024-12-31'),
        }
      ])
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].due_date).toBeNull();
    expect(result[0].dependencies).toEqual([]);
    expect(result[0].dependents).toEqual([]);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].is_completed).toBe(false);

    expect(result[1].title).toEqual('Task 2');
    expect(result[1].due_date).toBeInstanceOf(Date);
    expect(result[1].dependencies).toEqual([]);
    expect(result[1].dependents).toEqual([]);
  });

  it('should return tasks with dependencies and dependents', async () => {
    // Create test tasks
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'Task A' },
        { title: 'Task B' },
        { title: 'Task C' }
      ])
      .returning()
      .execute();

    // Create dependencies: B depends on A, C depends on B
    const deps = await db.insert(taskDependenciesTable)
      .values([
        {
          task_id: tasks[1].id, // Task B
          depends_on_task_id: tasks[0].id // depends on Task A
        },
        {
          task_id: tasks[2].id, // Task C
          depends_on_task_id: tasks[1].id // depends on Task B
        }
      ])
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);

    // Task A should have no dependencies but one dependent
    const taskA = result.find(t => t.title === 'Task A');
    expect(taskA?.dependencies).toHaveLength(0);
    expect(taskA?.dependents).toHaveLength(1);
    expect(taskA?.dependents[0].task_id).toEqual(tasks[1].id);

    // Task B should have one dependency and one dependent
    const taskB = result.find(t => t.title === 'Task B');
    expect(taskB?.dependencies).toHaveLength(1);
    expect(taskB?.dependencies[0].depends_on_task_id).toEqual(tasks[0].id);
    expect(taskB?.dependents).toHaveLength(1);
    expect(taskB?.dependents[0].task_id).toEqual(tasks[2].id);

    // Task C should have one dependency but no dependents
    const taskC = result.find(t => t.title === 'Task C');
    expect(taskC?.dependencies).toHaveLength(1);
    expect(taskC?.dependencies[0].depends_on_task_id).toEqual(tasks[1].id);
    expect(taskC?.dependents).toHaveLength(0);
  });

  it('should handle tasks with multiple dependencies', async () => {
    // Create test tasks
    const tasks = await db.insert(tasksTable)
      .values([
        { title: 'Foundation' },
        { title: 'Walls' },
        { title: 'Roof' },
        { title: 'Final Task' }
      ])
      .returning()
      .execute();

    // Final task depends on all three previous tasks
    await db.insert(taskDependenciesTable)
      .values([
        {
          task_id: tasks[3].id, // Final Task
          depends_on_task_id: tasks[0].id // depends on Foundation
        },
        {
          task_id: tasks[3].id, // Final Task
          depends_on_task_id: tasks[1].id // depends on Walls
        },
        {
          task_id: tasks[3].id, // Final Task
          depends_on_task_id: tasks[2].id // depends on Roof
        }
      ])
      .returning()
      .execute();

    const result = await getTasks();

    const finalTask = result.find(t => t.title === 'Final Task');
    expect(finalTask?.dependencies).toHaveLength(3);
    
    // Each of the first three tasks should have one dependent
    const foundation = result.find(t => t.title === 'Foundation');
    const walls = result.find(t => t.title === 'Walls');
    const roof = result.find(t => t.title === 'Roof');
    
    expect(foundation?.dependents).toHaveLength(1);
    expect(walls?.dependents).toHaveLength(1);
    expect(roof?.dependents).toHaveLength(1);
  });
});
