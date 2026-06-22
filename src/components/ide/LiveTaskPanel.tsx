import React, { useState, useEffect } from 'react';
import { TaskBubble, TaskBubbleProps } from './TaskBubble';
import { WindsurfCascade } from '@/lib/ide/vnext/windsurf/WindsurfCascade';
import { Brain, CheckCircle2, Circle, Loader2 } from 'lucide-react';

export interface LiveTaskPanelProps {
  windsurfCascade: WindsurfCascade;
  sessionId?: string;
  agentThinking?: string;
  agentThoughts?: string[];
}

export const LiveTaskPanel: React.FC<LiveTaskPanelProps> = ({ 
  windsurfCascade, 
  sessionId,
  agentThinking = '',
  agentThoughts = []
}) => {
  const [tasks, setTasks] = useState<TaskBubbleProps[]>([]);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentStage, setCurrentStage] = useState<'thinking' | 'planning' | 'executing' | 'complete'>('thinking');

  useEffect(() => {
    if (!sessionId) return;

    const todoListSystem = windsurfCascade.getTodoListSystem();
    const currentList = todoListSystem.getCurrentTodoList();

    if (currentList) {
      const convertToTaskBubbles = (items: any[]): TaskBubbleProps[] => {
        return items.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          priority: item.priority,
          description: item.description,
          children: item.children ? convertToTaskBubbles(item.children) : undefined,
        }));
      };

      setTasks(convertToTaskBubbles(currentList.items));
      setProgress(todoListSystem.getProgress());

      // Subscribe to todo list changes
      const interval = setInterval(() => {
        const updatedList = todoListSystem.getCurrentTodoList();
        if (updatedList) {
          setTasks(convertToTaskBubbles(updatedList.items));
          setProgress(todoListSystem.getProgress());
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [windsurfCascade, sessionId]);

  const handleStatusChange = (id: string, status: TaskBubbleProps['status']) => {
    const todoListSystem = windsurfCascade.getTodoListSystem();
    todoListSystem.updateItemStatus(id, status);
  };

  const renderTask = (task: TaskBubbleProps, level: number = 0) => {
    return (
      <div key={task.id} style={{ marginLeft: level * 12 }}>
        <TaskBubble
          {...task}
          onStatusChange={handleStatusChange}
        />
        {task.children && task.children.map((child: TaskBubbleProps) => renderTask(child, level + 1))}
      </div>
    );
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;

  return (
    <div className="bg-[#1e1e1e] border-t border-[#2d2d2d]">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#252526] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Tasks
          </span>
          <span className="text-xs text-gray-500">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="text-xs text-gray-500">{progress}%</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#2d2d2d]">
        <div 
          className="h-full bg-blue-500 transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task list */}
      {isExpanded && (
        <div className="p-3 max-h-96 overflow-y-auto">
          {/* Agent Thinking Section */}
          {(agentThinking || agentThoughts.length > 0) && (
            <div className="mb-4 p-3 bg-[#252526] rounded-lg border border-[#2d2d2d]">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">Agent Thinking</span>
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              </div>
              
              {agentThinking && (
                <div className="text-[9px] text-gray-500 mb-2 leading-relaxed">
                  {agentThinking}
                </div>
              )}
              
              {agentThoughts.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Thoughts</div>
                  {agentThoughts.map((thought, index) => (
                    <div key={index} className="text-[9px] text-gray-500 leading-relaxed">
                      • {thought}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks Section */}
          {tasks.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4">
              No tasks yet
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-white">Tasks</span>
                {currentStage === 'executing' && (
                  <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                )}
                {currentStage === 'complete' && (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                )}
              </div>
              {tasks.map((task) => renderTask(task))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
