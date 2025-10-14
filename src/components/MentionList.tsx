
import React from 'react'

interface MentionListProps {
  items: { id: string; label: string }[];
  selectedIndex: number;
  onSelect: (item: { id: string; label: string }) => void;
}

export const MentionList = ({ items, selectedIndex, onSelect }: MentionListProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-black dark:bg-gray-800 dark:text-white">
      {items.length > 0 ? (
        items.map((item, index) => (
          <button
            className={`w-full text-left p-2 rounded-md ${
              index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            key={index}
            onClick={() => onSelect(item)}
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="p-2">No results</div>
      )}
    </div>
  )
}
