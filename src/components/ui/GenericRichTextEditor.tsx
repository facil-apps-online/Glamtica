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

export class GenericRichTextEditor extends React.Component<GenericRichTextEditorProps> {
  render() {
    return (
      <ReactQuill
        theme="snow"
        value={this.props.value}
        onChange={this.props.onChange}
        placeholder={this.props.placeholder}
        modules={modules}
      />
    );
  }
}