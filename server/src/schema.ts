
import { z } from 'zod';

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  due_date: z.coerce.date().nullable(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Task dependency schema
export const taskDependencySchema = z.object({
  id: z.number(),
  task_id: z.number(),
  depends_on_task_id: z.number(),
  created_at: z.coerce.date()
});

export type TaskDependency = z.infer<typeof taskDependencySchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  due_date: z.coerce.date().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  due_date: z.coerce.date().nullable().optional(),
  is_completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for creating task dependencies
export const createTaskDependencyInputSchema = z.object({
  task_id: z.number(),
  depends_on_task_id: z.number()
});

export type CreateTaskDependencyInput = z.infer<typeof createTaskDependencyInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Input schema for deleting task dependencies
export const deleteTaskDependencyInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskDependencyInput = z.infer<typeof deleteTaskDependencyInputSchema>;

// Enhanced task schema with dependencies for queries
export const taskWithDependenciesSchema = z.object({
  id: z.number(),
  title: z.string(),
  due_date: z.coerce.date().nullable(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  dependencies: z.array(taskDependencySchema),
  dependents: z.array(taskDependencySchema)
});

export type TaskWithDependencies = z.infer<typeof taskWithDependenciesSchema>;
