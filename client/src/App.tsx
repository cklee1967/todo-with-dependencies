
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, CalendarDays, CheckCircle2, Circle, Plus, Trash2, Link, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { TaskWithDependencies, CreateTaskInput, CreateTaskDependencyInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<TaskWithDependencies[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);

  // Form state for creating tasks
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    due_date: null
  });

  // Form state for creating dependencies
  const [dependencyData, setDependencyData] = useState<CreateTaskDependencyInput>({
    task_id: 0,
    depends_on_task_id: 0
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      await trpc.createTask.mutate(formData);
      // Reload tasks to get updated dependencies structure
      await loadTasks();
      setFormData({ title: '', due_date: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: boolean) => {
    try {
      await trpc.updateTask.mutate({
        id: taskId,
        is_completed: !currentStatus
      });
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dependencyData.task_id === 0 || dependencyData.depends_on_task_id === 0) return;
    if (dependencyData.task_id === dependencyData.depends_on_task_id) return;

    try {
      await trpc.createTaskDependency.mutate(dependencyData);
      await loadTasks();
      setDependencyData({ task_id: 0, depends_on_task_id: 0 });
      setIsDependencyDialogOpen(false);
    } catch (error) {
      console.error('Failed to create dependency:', error);
    }
  };

  const handleDeleteDependency = async (dependencyId: number) => {
    try {
      await trpc.deleteTaskDependency.mutate({ id: dependencyId });
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete dependency:', error);
    }
  };

  const filteredTasks = tasks.filter((task: TaskWithDependencies) => {
    if (filter === 'completed') return task.is_completed;
    if (filter === 'pending') return !task.is_completed;
    return true;
  });

  const getTaskStatus = (task: TaskWithDependencies) => {
    if (task.is_completed) return 'completed';
    
    // Check if any dependencies are not completed
    const hasUncompletedDependencies = task.dependencies.some((dep) => {
      const dependentTask = tasks.find((t: TaskWithDependencies) => t.id === dep.depends_on_task_id);
      return dependentTask && !dependentTask.is_completed;
    });

    if (hasUncompletedDependencies) return 'blocked';
    
    // Check if overdue
    if (task.due_date && new Date(task.due_date) < new Date()) return 'overdue';
    
    return 'ready';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'overdue': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'blocked': return <AlertCircle className="w-4 h-4" />;
      case 'overdue': return <Calendar className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const incompleteTasks = tasks.filter((task: TaskWithDependencies) => !task.is_completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">✅ Task Manager</h1>
          <p className="text-slate-600">Organize your tasks with dependencies and due dates</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <Input
                  type="date"
                  placeholder="Due date (optional)"
                  value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      due_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link className="w-4 h-4 mr-2" />
                Add Dependency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task Dependency</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDependency} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Task that depends on another:</label>
                  <Select
                    value={dependencyData.task_id === 0 ? '' : dependencyData.task_id.toString()}
                    onValueChange={(value: string) =>
                      setDependencyData((prev: CreateTaskDependencyInput) => ({
                        ...prev,
                        task_id: parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {incompleteTasks.map((task: TaskWithDependencies) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Must be completed first:</label>
                  <Select
                    value={dependencyData.depends_on_task_id === 0 ? '' : dependencyData.depends_on_task_id.toString()}
                    onValueChange={(value: string) =>
                      setDependencyData((prev: CreateTaskDependencyInput) => ({
                        ...prev,
                        depends_on_task_id: parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dependency" />
                    </SelectTrigger>
                    <SelectContent>
                      {incompleteTasks
                        .filter((task: TaskWithDependencies) => task.id !== dependencyData.task_id)
                        .map((task: TaskWithDependencies) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Create Dependency
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDependencyDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Select value={filter} onValueChange={(value: 'all' | 'pending' | 'completed') => setFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{tasks.length}</div>
              <div className="text-sm text-slate-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {tasks.filter((task: TaskWithDependencies) => task.is_completed).length}
              </div>
              <div className="text-sm text-slate-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter((task: TaskWithDependencies) => !task.is_completed && getTaskStatus(task) === 'ready').length}
              </div>
              <div className="text-sm text-slate-600">Ready</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter((task: TaskWithDependencies) => getTaskStatus(task) === 'blocked').length}
              </div>
              <div className="text-sm text-slate-600">Blocked</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-slate-600">
                {filter === 'all' 
                  ? "No tasks yet. Create your first task to get started!" 
                  : `No ${filter} tasks found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task: TaskWithDependencies) => {
              const status = getTaskStatus(task);
              return (
                <Card key={task.id} className={`transition-all hover:shadow-md ${task.is_completed ? 'opacity-75' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => handleToggleTask(task.id, task.is_completed)}
                        disabled={status === 'blocked'}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {task.title}
                          </h3>
                          <Badge className={`${getStatusColor(status)} text-xs`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </Badge>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Created: {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Dependencies */}
                        {task.dependencies.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-slate-700 mb-2">Depends on:</div>
                            <div className="flex flex-wrap gap-2">
                              {task.dependencies.map((dep) => {
                                const dependentTask = tasks.find((t: TaskWithDependencies) => t.id === dep.depends_on_task_id);
                                return dependentTask ? (
                                  <div key={dep.id} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1">
                                    <span className={`text-sm ${dependentTask.is_completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                                      {dependentTask.title}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteDependency(dep.id)}
                                      className="text-red-500 hover:text-red-700 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Dependents */}
                        {task.dependents.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-slate-700 mb-2">Blocks:</div>
                            <div className="flex flex-wrap gap-2">
                              {task.dependents.map((dep) => {
                                const dependentTask = tasks.find((t: TaskWithDependencies) => t.id === dep.task_id);
                                return dependentTask ? (
                                  <div key={dep.id} className="bg-amber-100 rounded-lg px-3 py-1 text-sm text-amber-800">
                                    {dependentTask.title}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{task.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
