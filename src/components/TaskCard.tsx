import React from 'react';
import { Calendar, Trash2, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface Props {
  task: Task;
  onToggleStatus: (task: Task, nextStatus: TaskStatus) => void;
  onDelete: (taskId: number) => void;
}

export const TaskCard: React.FC<Props> = ({ task, onToggleStatus, onDelete }) => {
  const getNextStatus = (curr: TaskStatus): TaskStatus => {
    if (curr === 'todo') return 'in_progress';
    if (curr === 'in_progress') return 'done';
    return 'todo';
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return {
          className: 'badge-done',
          label: 'DONE',
          icon: <CheckCircle2 size={13} />,
        };
      case 'in_progress':
        return {
          className: 'badge-progress',
          label: 'IN PROGRESS',
          icon: <Clock size={13} />,
        };
      default:
        return {
          className: 'badge-todo',
          label: 'TO DO',
          icon: <CircleDot size={13} />,
        };
    }
  };

  const badge = getStatusBadge(task.status);

  return (
    <div className="task-card">
      <div className="task-card-header">
        <div className="task-meta">
          <span className="task-id">#{task.id}</span>
          <button
            type="button"
            className={`status-toggle ${badge.className}`}
            onClick={() => onToggleStatus(task, getNextStatus(task.status))}
            title="Click to cycle status: todo -> in_progress -> done"
          >
            {badge.icon}
            <span>{badge.label}</span>
          </button>
        </div>
        <button
          type="button"
          className="btn-delete"
          onClick={() => onDelete(task.id)}
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-footer">
        <div className="due-date">
          <Calendar size={14} />
          <span>Due: {task.due_date}</span>
        </div>
        <span className="status-hint">Click status badge to toggle</span>
      </div>
    </div>
  );
};
