import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { GLAMTICA_VARIABLES, GlamticaVariable } from '@/lib/glamticaVariables';
import { ApiSchemaNode } from '@/hooks/useIntegrationProviders';

interface ApiSchemaNodeEditorProps {
  node: ApiSchemaNode;
  path: number[];
  // Handlers que implementaremos en el componente padre
  onChange: (path: number[], field: keyof ApiSchemaNode, value: any) => void;
  onAddChild: (path: number[]) => void;
  onRemove: (path: number[]) => void;
}

const ApiSchemaNodeEditor = ({ node, path, onChange, onAddChild, onRemove }: ApiSchemaNodeEditorProps) => {
  const level = path.length - 1;
  const canHaveChildren = node.type === 'object' || node.type === 'array';

  const groupedVariables = GLAMTICA_VARIABLES.reduce((acc, v) => {
    acc[v.group] = [...(acc[v.group] || []), v];
    return acc;
  }, {} as Record<string, GlamticaVariable[]>);

  return (
    <div style={{ marginLeft: `${level * 25}px` }} className="p-3 my-2 border-l-2 rounded-r-lg bg-white shadow-sm">
      <div className="flex items-center gap-2">
        {/* Inputs para editar el nodo actual */}
        <Input 
          value={node.key} 
          onChange={(e) => onChange(path, 'key', e.target.value)} 
          placeholder="Nombre de la Clave" 
          className="font-mono h-9"
        />
        <Select value={node.type} onValueChange={(value) => onChange(path, 'type', value)}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="object">Objeto</SelectItem>
            <SelectItem value="array">Array</SelectItem>
            <SelectItem value="string">Texto</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="boolean">Booleano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={node.glamticaMap} onValueChange={(value) => onChange(path, 'glamticaMap', value)}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Mapear a variable de Glamtica..." /></SelectTrigger>
          <SelectContent>
            {Object.entries(groupedVariables).map(([group, variables]) => (
              <React.Fragment key={group}>
                <h4 className="px-2 py-1.5 text-sm font-semibold">{group}</h4>
                {variables.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
        
        {/* Botones de Acción */}
        {canHaveChildren && (
          <Button variant="outline" size="icon" onClick={() => onAddChild(path)} className="h-9 w-9">
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onRemove(path)} className="h-9 w-9 text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Renderizado recursivo para los hijos */}
      {canHaveChildren && node.children && (
        <div className="mt-3">
          {node.children.map((child, index) => (
            <ApiSchemaNodeEditor 
              key={child.id}
              node={child}
              path={[...path, index]}
              onChange={onChange}
              onAddChild={onAddChild}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiSchemaNodeEditor;
