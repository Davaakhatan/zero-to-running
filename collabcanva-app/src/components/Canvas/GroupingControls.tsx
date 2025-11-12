import React from 'react';
import type { Group, Shape } from '../../types';
import { canGroupShapes, canUngroupGroup } from '../../utils/groupingUtils';

interface GroupingControlsProps {
  selectedShapeIds: string[];
  shapes: Shape[];
  groups: Group[];
  onGroupShapes: () => void;
  onUngroupShapes: () => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  className?: string;
}

// TButton component to match the existing toolbar style
const TButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
  active?: boolean;
}> = ({ onClick, disabled = false, title, ariaLabel, children, active = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={ariaLabel}
    className={`
      w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200
      ${disabled 
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
        : active
          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
          : 'bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200/60 dark:border-slate-600/50'
      }
    `}
  >
    {children}
  </button>
);

export const GroupingControls: React.FC<GroupingControlsProps> = ({
  selectedShapeIds,
  shapes,
  groups,
  onGroupShapes,
  onUngroupShapes,
  onRenameGroup,
  className = ''
}) => {
  const canGroup = canGroupShapes(selectedShapeIds, shapes);
  const selectedGroup = groups.find(group => 
    selectedShapeIds.length === 1 && selectedShapeIds[0] === group.id
  );
  const canUngroup = selectedGroup ? canUngroupGroup(selectedGroup.id, groups) : false;

  // Debug logging
  console.log('🔍 [GroupingControls] Debug:', {
    selectedShapeIds,
    selectedShapeIdsLength: selectedShapeIds.length,
    shapesLength: shapes.length,
    canGroup,
    canUngroup,
    selectedGroup: selectedGroup?.name || 'none'
  });

  const handleRenameGroup = () => {
    if (!selectedGroup) return;
    
    const newName = prompt('Enter new group name:', selectedGroup.name);
    if (newName && newName.trim() && newName !== selectedGroup.name) {
      onRenameGroup(selectedGroup.id, newName.trim());
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 w-full ${className}`}>
      {/* Group Button */}
      <TButton
        onClick={onGroupShapes}
        disabled={!canGroup}
        title={canGroup ? 'Group selected shapes' : 'Select 2 or more shapes to group'}
        ariaLabel="Group selected shapes"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </TButton>

      {/* Ungroup Button */}
      <TButton
        onClick={onUngroupShapes}
        disabled={!canUngroup}
        title={canUngroup ? 'Ungroup selected group' : 'Select a group to ungroup'}
        ariaLabel="Ungroup selected group"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </TButton>

      {/* Rename Group Button - only show when a group is selected */}
      {selectedGroup && (
        <TButton
          onClick={handleRenameGroup}
          title="Rename selected group"
          ariaLabel="Rename selected group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </TButton>
      )}

      {/* Group Info - compact display */}
      {selectedGroup && (
        <div className="w-full px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-center">
          <div className="truncate" title={selectedGroup.name}>
            {selectedGroup.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ({selectedGroup.children.length})
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupingControls;
