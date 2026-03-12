export interface TodoItem {
  id: string;
  todoId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  personId: string | null;
  relationType: string | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTodoItemInput {
  todoId: string;
  title: string;
  position?: number;
  personId?: string;
  relationType?: string;
}

export type UpdateTodoItemInput = {
  title?: string;
  position?: number;
  personId?: string | null;
  relationType?: string | null;
};
