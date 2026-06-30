import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Paperclip, Send, X } from 'lucide-react';
import { useGoogleDriveImage } from "@/hooks/useGoogleDriveImage";
import { useTenantUsers } from '@/hooks/useTenantUsers';
import { sanitizeHtml } from '@/lib/sanitize';

// TipTap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { MentionList } from '@/components/MentionList';

// --- Interfaces ---
interface ChatterAttachment {
  id: string;
  file_name: string;
  google_drive_file_id: string;
}

interface ChatterEvent {
  id: string;
  created_at: string;
  user_id: string;
  user_avatar_url?: string;
  user_full_name: string;
  event_type: 'comment' | 'field_update' | 'creation';
  payload: Record<string, any>;
  chatter_attachments: ChatterAttachment[];
}

interface ChatterBoxProps {
  resourceType: string;
  resourceId: string;
  tenantId: string;
  containerClassName?: string;
}

// --- Helper Functions ---
const getInitials = (name: string | undefined | null): string => {
    if (!name) return '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

// --- Hooks ---
const useChatterEvents = (resourceType: string, resourceId: string, tenantId: string) => {
  return useQuery<ChatterEvent[], Error>({
    queryKey: ['chatter', resourceType, resourceId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_chatter_events',
          payload: { resource_type: resourceType, resource_id: resourceId, tenant_id: tenantId },
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!resourceType && !!resourceId && !!tenantId,
  });
};

const useCreateChatterComment = (resourceType: string, resourceId: string, tenantId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'create_chatter_comment',
          payload: { resource_type: resourceType, resource_id: resourceId, text, tenant_id: tenantId },
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatter', resourceType, resourceId, tenantId] });
      toast({ title: 'Comentario añadido', variant: 'success' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al comentar', description: error.message, variant: 'destructive' });
    },
  });
};

// --- Sub-components ---
const ChatterEventItem: React.FC<{ event: ChatterEvent }> = ({ event }) => {
    const { displayUrl } = useGoogleDriveImage(event.user_avatar_url);

    const renderPayload = () => {
        if (event.event_type === 'comment') {
            return (
                <div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap prose dark:prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.payload.text) }}></div>
                    {event.chatter_attachments && event.chatter_attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {event.chatter_attachments.map(attachment => (
                                <a
                                    key={attachment.id}
                                    href={`https://drive.google.com/uc?id=${attachment.google_drive_file_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    {attachment.file_name}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        if (event.event_type === 'creation') {
            return <p className="text-sm italic text-gray-600">Creación de registro.</p>;
        }
        if (event.event_type === 'field_update') {
            const { old_record, new_record } = event.payload;
            if (!new_record) return <p className="text-sm italic text-gray-600">Edición de registro.</p>;

            const changes = Object.keys(new_record).reduce((acc: any[], key) => {
                const oldValue = old_record ? old_record[key] : undefined;
                const newValue = new_record[key];
                
                if (key === 'updated_at' || key === 'fts' || String(oldValue) === String(newValue)) {
                    return acc;
                }

                acc.push({ field: key, old_value: oldValue, new_value: newValue });
                return acc;
            }, []);

            if (changes.length === 0) {
                return <p className="text-sm italic text-gray-600">Edición de registro (sin cambios de datos detectados).</p>;
            }

            return (
                <div className="space-y-2">
                    <p className="text-sm italic text-gray-600">Edición de registro:</p>
                    {changes.map(({ field, old_value, new_value }) => (
                        <div key={field} className="text-sm text-gray-600 pl-4">
                            Campo <strong>{field}</strong> actualizado:
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">                                <span className="text-red-600 line-through bg-red-50 px-2 py-1 rounded text-xs max-w-xs truncate">{String(old_value) || 'vacío'}</span>
                                <span>→</span>
                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs max-w-xs truncate">{String(new_value) || 'vacío'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return <p className="text-sm text-gray-500">Evento de tipo: {event.event_type}</p>;
    };

    return (
        <div className="flex items-start space-x-3 py-3">
            <Avatar className="w-8 h-8">
                <AvatarImage src={displayUrl} />
                <AvatarFallback>{getInitials(event.user_full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{event.user_full_name || 'Sistema'}</p>
                    <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })}
                    </p>
                </div>
                <div className="mt-1">
                    {renderPayload()}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export const ChatterBox: React.FC<ChatterBoxProps> = ({ resourceType, resourceId, tenantId, containerClassName = 'h-96' }) => {
  const { user } = useAuth();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { data: events, isLoading, error } = useChatterEvents(resourceType, resourceId, tenantId);
  const createCommentMutation = useCreateChatterComment(resourceType, resourceId, tenantId);
  const { displayUrl: currentUserAvatar } = useGoogleDriveImage(user?.user_metadata?.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tenantUsers } = useTenantUsers(tenantId);

  // --- Manual Suggestion State ---
  const [isSuggestionActive, setIsSuggestionActive] = useState(false);
  const [suggestionItems, setSuggestionItems] = useState<{ id: string; label: string }[]>([]);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0, right: 0 });
  const [suggestionPlacement, setSuggestionPlacement] = useState<'left' | 'right'>('left');
  const [suggestionSelectedIndex, setSuggestionSelectedIndex] = useState(0);


  const usersForMentions = useMemo(() => {
    if (!tenantUsers) return [];
    const uniqueUsers = new Map();
    tenantUsers.forEach(user => {
      if (!uniqueUsers.has(user.user_id)) {
        uniqueUsers.set(user.user_id, user);
      }
    });
    return Array.from(uniqueUsers.values()).map(u => ({
      id: u.user_id,
      label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
    }));
  }, [tenantUsers]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-blue-100 text-blue-800 px-1 rounded',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none border rounded-md p-2 min-h-[80px]',
      },
    },
  });

  const handleSelectMention = useCallback((item: { id: string; label: string }) => {
    if (editor) {
        const { from, to } = editor.state.selection;

        // Get text before cursor to find the trigger
        const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from, '\n');
        const mentionMatch = textBefore.match(/@(\w*)$/);

        // Calculate the start position of the trigger
        const fromPos = mentionMatch ? from - mentionMatch[0].length : from;

        // Replace from the trigger start to the current cursor position
        editor.chain().focus().insertContentAt({ from: fromPos, to }, [
            { type: 'mention', attrs: { id: item.id, label: item.label } },
            { type: 'text', text: ' ' },
        ]).run();
    }
    setIsSuggestionActive(false);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;

      if (from !== to) {
        setIsSuggestionActive(false);
        return;
      }

      const textBeforeCursor = state.doc.textBetween(Math.max(0, from - 10), from, '\n');
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch && popupContainerRef.current) {
        const query = mentionMatch[1];
        const filteredUsers = usersForMentions.filter(user => 
          user.label.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filteredUsers.length > 0) {
            const cursorCoords = editor.view.coordsAtPos(from);
            const containerRect = popupContainerRef.current.getBoundingClientRect();
            const popupWidth = 256; // w-64 in pixels

            if (cursorCoords.left + popupWidth > containerRect.right) {
                setSuggestionPlacement('right');
                setSuggestionPosition({
                    top: cursorCoords.bottom - containerRect.top,
                    left: 0, // Not used
                    right: containerRect.right - cursorCoords.left,
                });
            } else {
                setSuggestionPlacement('left');
                setSuggestionPosition({
                    top: cursorCoords.bottom - containerRect.top,
                    left: cursorCoords.left - containerRect.left,
                    right: 0, // Not used
                });
            }
            setSuggestionItems(filteredUsers);
            setSuggestionSelectedIndex(0);
            setIsSuggestionActive(true);
        } else {
          setIsSuggestionActive(false);
        }
      } else {
        setIsSuggestionActive(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (isSuggestionActive) {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSuggestionSelectedIndex(prev => (prev + suggestionItems.length - 1) % suggestionItems.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSuggestionSelectedIndex(prev => (prev + 1) % suggestionItems.length);
                return true;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSelectMention(suggestionItems[suggestionSelectedIndex]);
                return true;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsSuggestionActive(false);
                return true;
            }
        }
        return false;
    }

    editor.on('update', handleUpdate);
    editor.view.dom.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.off('update', handleUpdate);
      if (editor && !editor.isDestroyed) {
        editor.view.dom.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [editor, usersForMentions, isSuggestionActive, suggestionItems, suggestionSelectedIndex, handleSelectMention]);

  const handleSubmit = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    if (editor.getText().trim() || filesToUpload.length > 0) {
      createCommentMutation.mutate(html, {
        onSuccess: async (newComment) => {
          // --- Start of Mention Notification Logic ---
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const mentionedUsers = Array.from(doc.querySelectorAll('span[data-type="mention"]')).map(span => span.getAttribute('data-id'));
          
          const uniqueMentionedUsers = [...new Set(mentionedUsers)];
          
          if (uniqueMentionedUsers.length > 0) {
            await supabase.functions.invoke('tenant-actions', {
              body: {
                action: 'CREATE_MENTION_NOTIFICATIONS',
                payload: {
                  mentioned_user_ids: uniqueMentionedUsers,
                  actor_name: user?.user_metadata?.full_name || 'Alguien',
                  resource_type: resourceType,
                  resource_id: resourceId,
                  comment_snippet: editor?.getText().substring(0, 100) || ''
                }
              }
            });
          }
          // --- End of Mention Notification Logic ---

          if (filesToUpload.length > 0) {
            setIsUploading(true);
            toast({ title: 'Subiendo archivos...', description: `0 de ${filesToUpload.length} completados.` });

            for (let i = 0; i < filesToUpload.length; i++) {
              const file = filesToUpload[i];
              try {
                const tenantIdForUpload = tenantId;
                const userIdForUpload = user?.id;
                const commentIdForUpload = newComment.id;

                await supabase.functions.invoke('google-drive-upload', {
                  body: {
                    tenantId: tenantIdForUpload,
                    fileBase64: await toBase64(file),
                    mimeType: file.type,
                    fileName: file.name,
                    uploadContext: 'Chatter',
                    contextId: commentIdForUpload,
                    userId: userIdForUpload,
                  },
                });
                toast({ title: 'Subiendo archivos...', description: `${i + 1} de ${filesToUpload.length} completados.` });
              } catch (error) {
                toast({ title: 'Error al subir un archivo', description: `No se pudo subir ${file.name}.`, variant: 'destructive' });
              }
            }

            setIsUploading(false);
            toast({ title: 'Carga completa', variant: 'success' });
          }

          editor.commands.clearContent();
          setFilesToUpload([]);
          queryClient.invalidateQueries({ queryKey: ['chatter', resourceType, resourceId, tenantId] });
        },
      });
    }
  };

  const currentUserName = user?.user_metadata?.full_name || 
    `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim();

  return (
    <Card className="w-full">
      <CardHeader className="p-4 border-b">
        <h3 className="text-lg font-semibold">Actividad y Comentarios</h3>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <div className={`${containerClassName} overflow-y-auto p-4 space-y-2 divide-y`}>
            {isLoading && <p className="text-center text-gray-500">Cargando actividad...</p>}
            {error && <p className="text-center text-red-500">Error: {error.message}</p>}
            {events && events.length > 0 ? (
                events.map(event => <ChatterEventItem key={event.id} event={event} />)
            ) : (
                !isLoading && <p className="text-center text-gray-500 pt-8">No hay actividad todavía.</p>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex items-start space-x-3 w-full">
            <Avatar className="w-9 h-9 mt-1">
                <AvatarImage src={currentUserAvatar} />
                <AvatarFallback>{getInitials(currentUserName || user?.email)}</AvatarFallback>
            </Avatar>
            <div ref={popupContainerRef} className="flex-1 space-y-2 relative">
                <EditorContent editor={editor} />
                {isSuggestionActive && (
                    <div 
                        style={suggestionPlacement === 'left' 
                            ? { top: suggestionPosition.top, left: suggestionPosition.left } 
                            : { top: suggestionPosition.top, right: suggestionPosition.right }
                        } 
                        className="absolute z-10 w-64"
                    >
                        <MentionList 
                            items={suggestionItems} 
                            selectedIndex={suggestionSelectedIndex} 
                            onSelect={handleSelectMention} 
                        />
                    </div>
                )}
                {filesToUpload.length > 0 && (
                    <div className="p-2 border rounded-md space-y-2">
                        <p className="text-sm font-medium">Archivos adjuntos:</p>
                        <ul className="space-y-1">
                            {filesToUpload.map((file, index) => (
                                <li key={index} className="text-sm flex items-center justify-between bg-gray-50 p-1 rounded">
                                    <span>{file.name}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilesToUpload(files => files.filter((_, i) => i !== index))}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <div>
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={(e) => setFilesToUpload(files => [...files, ...Array.from(e.target.files || [])])}
                            className="hidden"
                        />
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            <Paperclip className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button onClick={handleSubmit} disabled={createCommentMutation.isPending || (editor?.isEmpty && filesToUpload.length === 0)}>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
                    </Button>
                </div>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
};