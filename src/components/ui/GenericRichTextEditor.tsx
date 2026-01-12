import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface GenericRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['clean']
  ],
};

export const GenericRichTextEditor = React.forwardRef<ReactQuill, GenericRichTextEditorProps>(
  ({ value, onChange, placeholder }, ref) => {
    return (
      <ReactQuill
        ref={ref}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
      />
    );
  }
);
GenericRichTextEditor.displayName = 'GenericRichTextEditor';