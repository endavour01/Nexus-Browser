import React, { useState } from 'react';
import { NexusTodo, TodoPriority } from '@shared/types';
import {
  Check,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
  Tag,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface TodoItemCardProps {
  todo: NexusTodo;
  onToggle: (id: string) => void;
  onEdit: (todo: NexusTodo) => void;
  onDelete: (id: string) => void;
  onNavigate?: (url: string) => void;
}

export const TodoItemCard: React.FC<TodoItemCardProps> = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onNavigate,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityBadge = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="todo-priority-badge priority-urgent" title="Urgent Priority">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="todo-priority-badge priority-high" title="High Priority">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="todo-priority-badge priority-medium" title="Medium Priority">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="todo-priority-badge priority-low" title="Low Priority">
            Low
          </span>
        );
    }
  };

  const getDueDateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr + 'T23:59:59');
    const now = new Date();
    const isPast = due.getTime() < now.getTime();
    const isToday =
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate();

    if (isToday) {
      return { text: 'Due Today', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
    if (isPast) {
      return { text: `Overdue (${dueDateStr})`, className: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    }
    return { text: dueDateStr, className: 'text-secondary bg-surface border-subtle' };
  };

  const dueStatus = getDueDateStatus(todo.dueDate);

  return (
    <div
      className={`todo-item-card ${todo.completed ? 'completed' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
    >
      <div className="flex items-start gap-3 w-full">
        {/* Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={todo.completed}
          aria-label={todo.completed ? `Mark "${todo.title}" incomplete` : `Mark "${todo.title}" complete`}
          onClick={() => onToggle(todo.id)}
          className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              onToggle(todo.id);
            }
          }}
        >
          {todo.completed && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className={`todo-title text-sm font-medium ${todo.completed ? 'line-through text-muted' : 'text-primary'}`}>
              {todo.title}
            </h4>
            {getPriorityBadge(todo.priority)}
            {todo.category && (
              <span className="todo-category-badge text-2xs">
                <Tag size={10} className="inline mr-1 opacity-70" />
                {todo.category}
              </span>
            )}
          </div>

          {todo.description && (
            <p className={`text-xs mt-0.5 leading-relaxed ${todo.completed ? 'text-muted/60' : 'text-secondary'}`}>
              {todo.description}
            </p>
          )}

          {/* Meta Line: Due Date & Linked Page URL */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-2xs">
            {dueStatus && (
              <span className={`px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${dueStatus.className}`}>
                <Calendar size={11} />
                <span>{dueStatus.text}</span>
              </span>
            )}

            {todo.associatedUrl && (
              <button
                type="button"
                className="todo-url-link flex items-center gap-1 text-accent hover:underline text-2xs font-mono max-w-xs truncate"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate(todo.associatedUrl!);
                  } else {
                    window.open(todo.associatedUrl, '_blank');
                  }
                }}
                title={todo.associatedUrl}
              >
                <ExternalLink size={11} />
                <span>{todo.associatedTitle || todo.associatedUrl}</span>
              </button>
            )}

            {todo.completed && todo.completedAt && (
              <span className="text-muted text-3xs flex items-center gap-1">
                <Clock size={10} /> Completed {new Date(todo.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Hover / Focus Actions */}
        <div className={`todo-actions flex items-center gap-1 ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-40'} transition-opacity`}>
          <button
            type="button"
            className="nexus-icon-btn p-1.5 text-secondary hover:text-primary"
            onClick={() => onEdit(todo)}
            title="Edit task"
            aria-label="Edit task"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            className="nexus-icon-btn p-1.5 text-secondary hover:text-red-400"
            onClick={() => onDelete(todo.id)}
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
