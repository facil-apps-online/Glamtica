// src/components/ui/RichTextEditor.tsx
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

// El componente se envuelve directamente en forwardRef
const RichTextEditor = React.forwardRef<ReactQuill, RichTextEditorProps>(
  (props, ref) => {
    return (
      <div className="bg-white">
        <ReactQuill
          ref={ref} // La ref del formulario se pasa aquí
          theme="snow"
          {...props} // Se pasan el resto de las props (value, onChange, etc.)
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;