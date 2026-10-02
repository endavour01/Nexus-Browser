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
  const [isHovered, setIsHovered] = useState(false);

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
              <Badge variant="neutral" size="sm">
                <Tag size={10} className="inline mr-1 opacity-70" />
                {todo.category}
              </Badge>
            )}
          </div>

          {todo.description && (
            <p className={`text-xs mt-0.5 leading-relaxed ${todo.completed ? 'text-muted/60' : 'text-secondary'}`}>
              {todo.description}
            </p>
          )}

          {/* Meta Line: Due Date & Linkages */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2 text-2xs">
            {dueStatus && (
              <span className={`px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${dueStatus.className}`}>
                <Calendar size={11} />
                <span>{dueStatus.text}</span>
              </span>
            )}

            {/* Linked Connect Workspace */}
            {todo.associatedWorkspaceName && (
              <button
                type="button"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-subtle text-secondary hover:text-accent hover:border-accent/40 transition-colors text-3xs font-mono"
                onClick={() => onNavigate && onNavigate('nexus://connect')}
                title={`Linked Workspace: ${todo.associatedWorkspaceName}`}
              >
                <Layers size={10} className="text-accent" />
                <span>{todo.associatedWorkspaceName}</span>
              </button>
            )}

            {/* Linked Connect App */}
            {todo.associatedConnectAppName && (
              <button
                type="button"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-3xs font-medium"
                onClick={() => onNavigate && onNavigate('nexus://connect')}
                title={`Linked App: ${todo.associatedConnectAppName}`}
              >
                <MessageSquare size={10} />
                <span>{todo.associatedConnectAppName}</span>
              </button>
            )}

            {/* Linked Note */}
            {todo.associatedNoteTitle && (
              <button
                type="button"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-3xs font-medium"
                onClick={() => onNavigate && onNavigate('nexus://notes')}
                title={`Linked Note: ${todo.associatedNoteTitle}`}
              >
                <FileText size={10} />
                <span>{todo.associatedNoteTitle}</span>
              </button>
            )}

            {/* Linked URL */}
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
      </div>
    </div>
  );
};
