import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import { useState } from 'react'; // Add useState import
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, Strikethrough, Code, Pilcrow, List, ListOrdered, Quote
} from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const FormattingToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-1 flex flex-wrap gap-1">
      <Button variant={editor.isActive('bold') ? 'default' : 'ghost'} size="icon" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
      <Button variant={editor.isActive('italic') ? 'default' : 'ghost'} size="icon" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
      <Button variant={editor.isActive('strike') ? 'default' : 'ghost'} size="icon" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
      <Button variant={editor.isActive('bulletList') ? 'default' : 'ghost'} size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
      <Button variant={editor.isActive('orderedList') ? 'default' : 'ghost'} size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
      <Button variant={editor.isActive('blockquote') ? 'default' : 'ghost'} size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
    </div>
  );
};

const badgeGroups = [
  {
    label: 'Cliente',
    items: [
      { value: '{{nombre_cliente}}', label: 'Nombre del Cliente' },
      { value: '{{tipo_documento_cliente}}', label: 'Tipo de Documento' },
      { value: '{{numero_documento_cliente}}', label: 'Número de Documento' },
    ]
  },
  {
    label: 'Negocio',
    items: [
      { value: '{{nombre_negocio}}', label: 'Nombre del Negocio' },
      { value: '{{nombre_sucursal}}', label: 'Nombre de la Sucursal' },
    ]
  },
  {
    label: 'Profesional',
    items: [
      { value: '{{nombre_profesional}}', label: 'Nombre del Profesional' },
    ]
  },
  {
    label: 'Otros',
    items: [
      { value: '{{fecha_actual}}', label: 'Fecha Actual' },
      { value: '{{observaciones_profesional}}', label: 'Observaciones del Profesional' },
    ]
  }
];

const BadgesToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }
  // Add state to control the select value
  const [selectedValue, setSelectedValue] = useState('');

  const handleBadgeInsert = (badge: string) => {
    if (badge) {
      editor.chain().focus().insertContent(badge).run();
      // Immediately reset the value so the same badge can be selected again
      setSelectedValue('');
    }
  };

  return (
    <Select onValueChange={handleBadgeInsert} value={selectedValue}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Insertar campo dinámico (badge)..." />
      </SelectTrigger>
      <SelectContent>
        {badgeGroups.map(group => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.items.map(badge => (
              <SelectItem key={badge.value} value={badge.value}>{badge.label}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export const ConsentEditor = ({ content, onContentChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <FormattingToolbar editor={editor} />
        <BadgesToolbar editor={editor} />
      </div>
      <EditorContent editor={editor} className="border border-input rounded-md min-h-[200px] max-h-[40vh] overflow-y-auto p-4" />
    </div>
  );
};
