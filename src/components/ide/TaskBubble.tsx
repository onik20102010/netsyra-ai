import React from 'react';

export interface TaskBubbleProps {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  children?: TaskBubbleProps[];
  onStatusChange?: (id: string, status: TaskBubbleProps['status']) => void;
}

export const TaskBubble: React.FC<TaskBubbleProps> = ({
  id,
  title,
  status,
  priority,
  description,
  onStatusChange,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-transparent flex-shrink-0 transition-all duration-300" />
        );
      case 'in_progress':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent flex-shrink-0 animate-spin transition-all duration-300" />
        );
      case 'completed':
        return (
          <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center transition-all duration-300 scale-100">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center transition-all duration-300">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'skipped':
        return (
          <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0 flex items-center justify-center transition-all duration-300 opacity-60">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18 12H6" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getBubbleStyle = () => {
    const baseStyle = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200";
    
    switch (status) {
      case 'pending':
        return `${baseStyle} bg-gray-100/50 text-gray-700 hover:bg-gray-100`;
      case 'in_progress':
        return `${baseStyle} bg-blue-50/50 text-blue-700 border border-blue-200/50 animate-pulse`;
      case 'completed':
        return `${baseStyle} bg-green-50/50 text-green-700 border border-green-200/50`;
      case 'failed':
        return `${baseStyle} bg-red-50/50 text-red-700 border border-red-200/50`;
      case 'skipped':
        return `${baseStyle} bg-gray-50/50 text-gray-500 border border-gray-200/50 opacity-60`;
      default:
        return baseStyle;
    }
  };

  return (
    <div className={getBubbleStyle()}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
};

export interface TaskBubbleListProps {
  tasks: TaskBubbleProps[];
  onStatusChange?: (id: string, status: TaskBubbleProps['status']) => void;
}

export const TaskBubbleList: React.FC<TaskBubbleListProps> = ({ tasks, onStatusChange }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {tasks.map((task) => (
        <TaskBubble
          key={task.id}
          {...task}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};
