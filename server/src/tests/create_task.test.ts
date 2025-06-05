
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateTaskInput = {
  title: 'Test Task',
  due_date: new Date('2024-12-25')
};

const testInputNullDate: CreateTaskInput = {
  title: 'Task without due date',
  due_date: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with due date', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date).toEqual(new Date('2024-12-25'));
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task without due date', async () => {
    const result = await createTask(testInputNullDate);

    // Basic field validation
    expect(result.title).toEqual('Task without due date');
    expect(result.due_date).toBeNull();
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].due_date).toBeInstanceOf(Date);
    expect(tasks[0].due_date).toEqual(new Date('2024-12-25'));
    expect(tasks[0].is_completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle task with null due date in database', async () => {
    const result = await createTask(testInputNullDate);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Task without due date');
    expect(tasks[0].due_date).toBeNull();
    expect(tasks[0].is_completed).toEqual(false);
  });
});
