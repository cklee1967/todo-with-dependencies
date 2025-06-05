
import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  due_date: timestamp('due_date'),
  is_completed: boolean('is_completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const taskDependenciesTable = pgTable('task_dependencies', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }),
  depends_on_task_id: integer('depends_on_task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const tasksRelations = relations(tasksTable, ({ many }) => ({
  dependencies: many(taskDependenciesTable, { relationName: 'taskDependencies' }),
  dependents: many(taskDependenciesTable, { relationName: 'taskDependents' })
}));

export const taskDependenciesRelations = relations(taskDependenciesTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskDependenciesTable.task_id],
    references: [tasksTable.id],
    relationName: 'taskDependencies'
  }),
  dependsOnTask: one(tasksTable, {
    fields: [taskDependenciesTable.depends_on_task_id],
    references: [tasksTable.id],
    relationName: 'taskDependents'
  })
}));

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
export type TaskDependency = typeof taskDependenciesTable.$inferSelect;
export type NewTaskDependency = typeof taskDependenciesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  tasks: tasksTable, 
  taskDependencies: taskDependenciesTable 
};
