import React from 'react';
import { NexusTodo, TodoPriority } from '@shared/types';
import {
  Check,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  MessageSquare,
  Layers,
  FileText,
} from 'lucide-react';
import { Badge, IconButton } from '../ui';

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
  const getPriorityBadge = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="accent" size="sm">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const renderDueDateBadge = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr + 'T23:59:59');
    const now = new Date();
    const isPast = due.getTime() < now.getTime();
    const isToday =
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate();

    if (isToday) {
      return (
        <Badge variant="warning" size="sm">
          <Calendar size={11} className="inline mr-1" />
          Due Today
        </Badge>
      );
    }
    if (isPast) {
      return (
        <Badge variant="danger" size="sm">
          <Calendar size={11} className="inline mr-1" />
          Overdue ({dueDateStr})
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        <Calendar size={11} className="inline mr-1" />
        {dueDateStr}
      </Badge>
    );
  };

  return (
    <article className={`todo-item-card ${todo.completed ? 'completed' : ''}`} role="listitem">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={todo.completed ? `Mark "${todo.title}" incomplete` : `Mark "${todo.title}" complete`}
        onClick={() => onToggle(todo.id)}
        className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
      >
        {todo.completed && <Check size={12} strokeWidth={3} aria-hidden="true" />}
      </button>

      <div className="todo-card-content">
        <div className="todo-card-heading">
          <h3 className={`todo-title ${todo.completed ? 'todo-title--completed' : ''}`}>
            {todo.title}
          </h3>
          {getPriorityBadge(todo.priority)}
          {todo.category && <Badge variant="neutral" size="sm">{todo.category}</Badge>}
          {todo.completed && <Badge variant="success" size="sm">Completed</Badge>}
        </div>

        {todo.description && (
          <p className={`todo-description ${todo.completed ? 'todo-description--completed' : ''}`}>
            {todo.description}
          </p>
        )}

        <div className="todo-task-metadata">
            {renderDueDateBadge(todo.dueDate)}

            {/* Linked Connect Workspace */}
            {todo.associatedWorkspaceName && (
              <button
                type="button"
                className="todo-linked-item"
                onClick={() => onNavigate && onNavigate('nexus://connect')}
                title={`Linked Workspace: ${todo.associatedWorkspaceName}`}
              >
                <Layers size={10} aria-hidden="true" />
                <span>{todo.associatedWorkspaceName}</span>
              </button>
            )}

            {/* Linked Connect App */}
            {todo.associatedConnectAppName && (
              <button
                type="button"
                className="todo-linked-item"
                onClick={() => onNavigate && onNavigate('nexus://connect')}
                title={`Linked App: ${todo.associatedConnectAppName}`}
              >
                <MessageSquare size={10} aria-hidden="true" />
                <span>{todo.associatedConnectAppName}</span>
              </button>
            )}

            {/* Linked Note */}
            {todo.associatedNoteTitle && (
              <button
                type="button"
                className="todo-linked-item"
                onClick={() => onNavigate && onNavigate('nexus://notes')}
                title={`Linked Note: ${todo.associatedNoteTitle}`}
              >
                <FileText size={10} aria-hidden="true" />
                <span>{todo.associatedNoteTitle}</span>
              </button>
            )}

            {/* Linked URL */}
            {todo.associatedUrl && (
              <button
                type="button"
                className="todo-url-link"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate(todo.associatedUrl!);
                  } else {
                    window.open(todo.associatedUrl, '_blank');
                  }
                }}
                title={todo.associatedUrl}
              >
                <ExternalLink size={11} aria-hidden="true" />
                <span>{todo.associatedTitle || todo.associatedUrl}</span>
              </button>
            )}

            {todo.completed && todo.completedAt && (
              <span className="todo-completed-date">
                <Clock size={10} aria-hidden="true" /> Completed {new Date(todo.completedAt).toLocaleDateString()}
              </span>
            )}
        </div>
      </div>

      <div className="todo-actions">
          <IconButton
            icon={<Edit2 size={13} />}
            aria-label="Edit task"
            tooltip="Edit task"
            variant="ghost"
            size="xs"
            onClick={() => onEdit(todo)}
          />
          <IconButton
            icon={<Trash2 size={13} />}
            aria-label="Delete task"
            tooltip="Delete task"
            variant="ghost"
            size="xs"
            onClick={() => onDelete(todo.id)}
          />
      </div>
    </article>
  );
};
