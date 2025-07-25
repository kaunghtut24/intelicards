
import React from 'react';
import { IconFolder, IconUsers } from './icons';

interface GroupListProps {
  groups: string[];
  groupCounts: Record<string, number>;
  selectedGroup: string | null;
  onSelectGroup: (group: string | null) => void;
  totalContacts: number;
}

const GroupListItem: React.FC<{
    label: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ label, count, isSelected, onClick, icon }) => (
    <li
        onClick={onClick}
        className={`flex items-center justify-between p-3 mx-2 rounded-lg cursor-pointer transition-colors duration-200 text-sm ${
            isSelected ? 'bg-blue-600/30 text-white font-semibold' : 'hover:bg-gray-700/50 text-gray-300'
        }`}
    >
        <div className="flex items-center truncate">
            {icon}
            <span className="ml-3 truncate">{label}</span>
        </div>
        <span className="bg-gray-700 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
    </li>
);

const GroupList: React.FC<GroupListProps> = ({ groups, groupCounts, selectedGroup, onSelectGroup, totalContacts }) => {
  return (
    <div className="p-2 border-b border-gray-700 flex-shrink-0">
        <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Groups</h3>
        <ul>
            <GroupListItem
                label="All Contacts"
                count={totalContacts}
                isSelected={selectedGroup === null}
                onClick={() => onSelectGroup(null)}
                icon={<IconUsers className="w-5 h-5" />}
            />
            {groups.map(group => (
                <GroupListItem
                    key={group}
                    label={group}
                    count={groupCounts[group] || 0}
                    isSelected={selectedGroup === group}
                    onClick={() => onSelectGroup(group)}
                    icon={<IconFolder className="w-5 h-5" />}
                />
            ))}
        </ul>
    </div>
  );
};

export default GroupList;
