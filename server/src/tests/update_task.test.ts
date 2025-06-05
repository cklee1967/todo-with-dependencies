
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task directly in database
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      due_date: input.due_date
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task title', async () => {
    // Create a task first
    const createInput: CreateTaskInput = {
      title: 'Original Task',
      due_date: null
    };
    const createdTask = await createTestTask(createInput);

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Task Title'
    };
    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.due_date).toEqual(createdTask.due_date);
    expect(result.is_completed).toEqual(createdTask.is_completed);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update task due date', async () => {
    // Create a task first
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      due_date: null
    };
    const createdTask = await createTestTask(createInput);

    // Update with due date
    const newDueDate = new Date('2024-12-31');
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      due_date: newDueDate
    };
    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual(createdTask.title);
    expect(result.due_date).toEqual(newDueDate);
    expect(result.is_completed).toEqual(createdTask.is_completed);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update task completion status', async () => {
    // Create a task first
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      due_date: null
    };
    const createdTask = await createTestTask(createInput);

    // Update completion status
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      is_completed: true
    };
    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual(createdTask.title);
    expect(result.due_date).toEqual(createdTask.due_date);
    expect(result.is_completed).toEqual(true);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should update multiple fields at once', async () => {
    // Create a task first
    const createInput: CreateTaskInput = {
      title: 'Original Task',
      due_date: null
    };
    const createdTask = await createTestTask(createInput);

    // Update multiple fields
    const newDueDate = new Date('2024-12-31');
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Task',
      due_date: newDueDate,
      is_completed: true
    };
    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Task');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.is_completed).toEqual(true);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should save updated task to database', async () => {
    // Create a task first
    const createInput: CreateTaskInput = {
      title: 'Test Task',
      due_date: null
    };
    const createdTask = await createTestTask(createInput);

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Database Updated Task',
      is_completed: true
    };
    await updateTask(updateInput);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Task');
    expect(tasks[0].is_completed).toEqual(true);
    expect(tasks[0].updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999,
      title: 'Non-existent Task'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update due_date to null', async () => {
    // Create a task with due date
    const createInput: CreateTaskInput = {
      title: 'Task with Due Date',
      due_date: new Date('2024-12-31')
    };
    const createdTask = await createTestTask(createInput);

    // Update due_date to null
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      due_date: null
    };
    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.due_date).toBeNull();
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });
});
