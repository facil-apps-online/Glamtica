import React, { forwardRef } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import { X } from 'lucide-react';
import './FeaturesInput.css';

interface Tag {
  id: string;
  text: string;
}

interface FeaturesInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

// Envolvemos el componente con forwardRef
const FeaturesInput = forwardRef<HTMLDivElement, FeaturesInputProps>(({ value, onChange }, ref) => {
  const tags = value ? value.map((text, index) => ({ id: index.toString(), text })) : [];

  const handleDelete = (i: number) => {
    onChange(value.filter((_, index) => index !== i));
  };

  const handleAddition = (tag: Tag) => {
    onChange([...(value || []), tag.text]);
  };

  return (
    // Pasamos la ref al elemento contenedor principal
    <div className="react-tags-wrapper" ref={ref}>
      <ReactTags
        tags={tags}
        handleDelete={handleDelete}
        handleAddition={handleAddition}
        delimiters={delimiters}
        placeholder="Añadir característica y presionar Enter"
        inputFieldPosition="inline"
        allowDragDrop={false}
        removeComponent={({ onClick }) => (
          <button type="button" onClick={onClick} className="tag-remove-button">
            <X size={14} />
          </button>
        )}
      />
    </div>
  );
});

FeaturesInput.displayName = 'FeaturesInput';

export default FeaturesInput;
