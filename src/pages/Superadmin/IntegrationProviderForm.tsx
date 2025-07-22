import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntegrationProvider, useUpsertIntegrationProvider, IntegrationProvider, ConfigField, ApiSchemaNode, HttpHeader } from '@/hooks/useIntegrationProviders';
import { useCountries } from '@/hooks/useCountries';
import { useIntegrationCategories } from '@/hooks/useIntegrationCategories';
import { useIntegrationHttpMethods } from '@/hooks/useIntegrationHttpMethods';
import { useIntegrationBodyFormats } from '@/hooks/useIntegrationBodyFormats';
import { useIntegrationAuthMethods } from '@/hooks/useIntegrationAuthMethods';
import { PlusCircle, Trash2, ArrowUp, ArrowDown, Code, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ApiSchemaNodeEditor from '@/components/ApiSchemaNodeEditor';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { TestResultDialog } from './TestResultDialog';

const slugify = (text: string) => {
  if (!text) return '';
  return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^\w-]+/g, '').replace(/--+/g, '_').replace(/^-+/, '').replace(/-+$/, '');
};

const initialProviderState: Partial<IntegrationProvider> = {
  name: '', slug: '', logo_url: '', country_id: '', category_id: '', status: 'inactive',
  endpoints: { test: '', production: '' },
  configSchema: [], apiSchema: [],
  http_method_id: '', body_format_id: '', auth_method_id: '',
  http_headers: [], authentication_config: {}, body_template: '',
};

const ConfigFieldRow = ({ field, onChange, onRemove, onMove, isFirst, isLast }) => (
    <div className="flex items-start gap-2 p-3 border rounded-md bg-slate-50">
      <div className="flex flex-col gap-2 pt-1">
        <Button variant="ghost" size="icon" onClick={() => onMove('up')} disabled={isFirst} className="h-7 w-7"><ArrowUp className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onMove('down')} disabled={isLast} className="h-7 w-7"><ArrowDown className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <div><Label>Nombre (key)</Label><Input value={field.name} onChange={e => onChange('name', e.target.value)} placeholder="ej: apiKey" /></div>
        <div><Label>Etiqueta para Usuario</Label><Input value={field.label} onChange={e => onChange('label', e.target.value)} placeholder="ej: API Key" /></div>
        <div><Label>Tipo</Label><Select value={field.type} onValueChange={value => onChange('type', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="text">Texto</SelectItem><SelectItem value="password">Contraseña</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem></SelectContent></Select></div>
        <div><Label>Valor de Prueba</Label><Input value={field.sandboxValue} onChange={e => onChange('sandboxValue', e.target.value)} placeholder="ej: test_123" /></div>
        <div className="md:col-span-2"><Label>Texto de Ayuda</Label><Input value={field.helpText || ''} onChange={e => onChange('helpText', e.target.value)} /></div>
        <div className="flex items-center space-x-2"><Checkbox checked={field.required} onCheckedChange={checked => onChange('required', checked)} /><Label>Requerido</Label></div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-500 hover:text-red-600 mt-1"><Trash2 className="h-5 w-5" /></Button>
    </div>
);

const HttpHeaderRow = ({ header, onChange, onRemove }) => (
    <div className="flex items-center gap-4">
        <Input value={header.name} onChange={e => onChange('name', e.target.value)} placeholder="Nombre de la Cabecera (ej: Content-Type)" />
        <Input value={header.value} onChange={e => onChange('value', e.target.value)} placeholder="Valor de la Cabecera (ej: application/json)" />
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-red-500"><Trash2 className="h-5 w-5" /></Button>
    </div>
);

export default function IntegrationProviderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const { data: providerToEdit, isLoading: isLoadingProvider } = useIntegrationProvider(id);
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const { data: categories, isLoading: isLoadingCategories } = useIntegrationCategories();
  const { data: httpMethods, isLoading: isLoadingHttpMethods } = useIntegrationHttpMethods();
  const { data: bodyFormats, isLoading: isLoadingBodyFormats } = useIntegrationBodyFormats();
  const { data: authMethods, isLoading: isLoadingAuthMethods } = useIntegrationAuthMethods();

  const [provider, setProvider] = useState<Partial<IntegrationProvider>>(initialProviderState);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const mutation = useUpsertIntegrationProvider();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestResultOpen, setIsTestResultOpen] = useState(false);

  useEffect(() => { if (isEditing && providerToEdit) setProvider(providerToEdit); }, [providerToEdit, isEditing]);

  const selectedBodyFormat = useMemo(() => bodyFormats?.find(f => f.id === provider.body_format_id), [bodyFormats, provider.body_format_id]);
  const selectedAuthMethod = useMemo(() => authMethods?.find(m => m.id === provider.auth_method_id), [authMethods, provider.auth_method_id]);

  const handleFieldChange = (field: keyof IntegrationProvider, value: any) => {
    setProvider(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'name' && !slugManuallyEdited && !isEditing) newState.slug = slugify(value);
      if (field === 'slug') setSlugManuallyEdited(true);
      return newState;
    });
  };
  
  const handleEndpointChange = (env: 'test' | 'production', value: string) => setProvider(prev => ({ ...prev, endpoints: { ...prev.endpoints, [env]: value } }));
  const handleConfigSchemaChange = (index: number, field: keyof ConfigField, value: any) => { const newSchema = [...(provider.configSchema || [])]; newSchema[index] = { ...newSchema[index], [field]: value }; setProvider(prev => ({ ...prev, configSchema: newSchema })); };
  const addConfigField = () => { const newField: ConfigField = { id: `temp-${Date.now()}`, name: '', label: '', type: 'text', required: false, helpText: '', sandboxValue: '' }; setProvider(prev => ({ ...prev, configSchema: [...(prev.configSchema || []), newField] })); };
  const removeConfigField = (index: number) => { const newSchema = [...(provider.configSchema || [])]; newSchema.splice(index, 1); setProvider(prev => ({ ...prev, configSchema: newSchema })); };
  const moveConfigField = (index: number, direction: 'up' | 'down') => { const newSchema = [...(provider.configSchema || [])]; const newIndex = direction === 'up' ? index - 1 : index + 1; if (newIndex < 0 || newIndex >= newSchema.length) return; const [movedItem] = newSchema.splice(index, 1); newSchema.splice(newIndex, 0, movedItem); setProvider(prev => ({ ...prev, configSchema: newSchema })); };
  
  const handleHeaderChange = (index: number, field: keyof HttpHeader, value: any) => { const newHeaders = [...(provider.http_headers || [])]; newHeaders[index] = { ...newHeaders[index], [field]: value }; setProvider(prev => ({ ...prev, http_headers: newHeaders })); };
  const addHttpHeader = () => { const newHeader: HttpHeader = { id: `temp-${Date.now()}`, name: '', value: '' }; setProvider(prev => ({ ...prev, http_headers: [...(prev.http_headers || []), newHeader] })); };
  const removeHttpHeader = (index: number) => { const newHeaders = [...(provider.http_headers || [])]; newHeaders.splice(index, 1); setProvider(prev => ({ ...prev, http_headers: newHeaders })); };

  const handleAuthFieldChange = (key: string, value: any) => setProvider(prev => ({ ...prev, authentication_config: { ...prev.authentication_config, [key]: value } }));

  const updateNestedNode = (nodes: ApiSchemaNode[], path: number[], field: keyof ApiSchemaNode, value: any): ApiSchemaNode[] => { const index = path[0]; const newPath = path.slice(1); return nodes.map((node, i) => { if (i !== index) return node; if (newPath.length === 0) return { ...node, [field]: value }; return { ...node, children: updateNestedNode(node.children || [], newPath, field, value) }; }); };
  const addNestedNode = (nodes: ApiSchemaNode[], path: number[]): ApiSchemaNode[] => { const index = path[0]; const newPath = path.slice(1); return nodes.map((node, i) => { if (i !== index) return node; const newNode: ApiSchemaNode = { id: `temp-${Date.now()}`, key: '', type: 'string', glamticaMap: '' }; if (newPath.length === 0) return { ...node, children: [...(node.children || []), newNode] }; return { ...node, children: addNestedNode(node.children || [], newPath) }; }); };
  const removeNestedNode = (nodes: ApiSchemaNode[], path: number[]): ApiSchemaNode[] => { const index = path[0]; const newPath = path.slice(1); if (newPath.length === 0) return nodes.filter((_, i) => i !== index); return nodes.map((node, i) => { if (i !== index) return node; return { ...node, children: removeNestedNode(node.children || [], newPath) }; }); };
  const handleSchemaNodeChange = (path: number[], field: keyof ApiSchemaNode, value: any) => setProvider(prev => ({ ...prev, apiSchema: updateNestedNode(prev.apiSchema || [], path, field, value) }));
  const handleAddSchemaNode = (path: number[]) => setProvider(prev => ({ ...prev, apiSchema: addNestedNode(prev.apiSchema || [], path) }));
  const handleRemoveSchemaNode = (path: number[]) => setProvider(prev => ({ ...prev, apiSchema: removeNestedNode(prev.apiSchema || [], path) }));
  const addRootSchemaNode = () => { const newNode: ApiSchemaNode = { id: `temp-${Date.now()}`, key: '', type: 'string', glamticaMap: '' }; setProvider(prev => ({ ...prev, apiSchema: [...(prev.apiSchema || []), newNode] })); };
  
  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const enrichedProvider = {
        ...provider,
        http_method: httpMethods?.find(m => m.id === provider.http_method_id),
        body_format: bodyFormats?.find(f => f.id === provider.body_format_id),
        auth_method: authMethods?.find(m => m.id === provider.auth_method_id),
      };

      const { data, error } = await supabase.functions.invoke('integration-provider', {
        body: { action: 'test', payload: enrichedProvider },
      });

      if (error) throw new Error(error.message);
      
      setTestResult(data);
      setIsTestResultOpen(true);

    } catch (error) {
      toast({ title: 'Error en la prueba', description: error.message, variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(provider); };

  const isLoading = isLoadingProvider || isLoadingCountries || isLoadingCategories || isLoadingHttpMethods || isLoadingBodyFormats || isLoadingAuthMethods;
  if (isLoading) return <p>Cargando formulario...</p>;

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div><h1 className="text-2xl md:text-3xl font-bold">{isEditing ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}</h1></div>
        
        <Card>
          <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><Label>Nombre del Proveedor</Label><Input value={provider.name || ''} onChange={e => handleFieldChange('name', e.target.value)} placeholder="Ej: DataICO" required /></div>
            <div><Label>Identificador (Slug)</Label><Input value={provider.slug || ''} onChange={e => handleFieldChange('slug', e.target.value)} readOnly={isEditing} className={isEditing ? "bg-gray-100" : ""} /></div>
            <div><Label>URL del Logo</Label><Input value={provider.logo_url || ''} onChange={e => handleFieldChange('logo_url', e.target.value)} placeholder="https://..." /></div>
            <div><Label>País</Label><Select value={provider.country_id} onValueChange={value => handleFieldChange('country_id', value)} required><SelectTrigger><SelectValue placeholder="Selecciona un país" /></SelectTrigger><SelectContent>{countries?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Categoría</Label><Select value={provider.category_id} onValueChange={value => handleFieldChange('category_id', value)} required><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Estado</Label><Select value={provider.status} onValueChange={value => handleFieldChange('status', value)} required><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger><SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configuración de la Solicitud</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><Label>Método HTTP</Label><Select value={provider.http_method_id} onValueChange={value => handleFieldChange('http_method_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona un método" /></SelectTrigger><SelectContent>{httpMethods?.map(m => <SelectItem key={m.id} value={m.id}>{m.method}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Formato del Cuerpo</Label><Select value={provider.body_format_id} onValueChange={value => handleFieldChange('body_format_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona un formato" /></SelectTrigger><SelectContent>{bodyFormats?.map(f => <SelectItem key={f.id} value={f.id}>{f.format}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Método de Autenticación</Label><Select value={provider.auth_method_id} onValueChange={value => handleFieldChange('auth_method_id', value)}><SelectTrigger><SelectValue placeholder="Selecciona un método" /></SelectTrigger><SelectContent>{authMethods?.map(m => <SelectItem key={m.id} value={m.id}>{m.method}</SelectItem>)}</SelectContent></Select></div>
          </CardContent>
        </Card>

        {selectedAuthMethod && selectedAuthMethod.method !== 'none' && (
          <Card>
              <CardHeader>
                <CardTitle>Configuración de Autenticación ({selectedAuthMethod.method})</CardTitle>
                <CardDescription>
                  Primero, define los campos en la sección "Credenciales del Tenant". Luego, selecciona aquí qué credencial usar para cada valor.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedAuthMethod.config_schema?.fields.map(field => (
                      <div key={field.name}>
                          <Label>{field.label}</Label>
                          {field.type === 'text' && 
                            <Input 
                              value={provider.authentication_config?.[field.name] || ''} 
                              onChange={e => handleAuthFieldChange(field.name, e.target.value)} 
                            />
                          }
                          {field.type === 'credential_selector' && (
                              <Select 
                                value={provider.authentication_config?.[field.name] || ''} 
                                onValueChange={value => handleAuthFieldChange(field.name, value)}
                                disabled={!provider.configSchema || provider.configSchema.length === 0}
                              >
                                  <SelectTrigger>
                                    <SelectValue placeholder={(!provider.configSchema || provider.configSchema.length === 0) ? "Define credenciales primero" : "Selecciona una credencial"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {provider.configSchema?.filter(c => c.name).map(cred => <SelectItem key={cred.id} value={cred.name}>{cred.label} ({cred.name})</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          )}
                      </div>
                  ))}
              </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Endpoints de la API</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label>URL Entorno de Pruebas</Label><Input value={provider.endpoints?.test || ''} onChange={e => handleEndpointChange('test', e.target.value)} /></div>
            <div><Label>URL Entorno de Producción</Label><Input value={provider.endpoints?.production || ''} onChange={e => handleEndpointChange('production', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cabeceras HTTP</CardTitle><CardDescription>Define cabeceras estáticas para la solicitud.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
              {provider.http_headers?.map((header, index) => <HttpHeaderRow key={header.id} header={header} onChange={(key, value) => handleHeaderChange(index, key, value)} onRemove={() => removeHttpHeader(index)} />)}
              <Button type="button" variant="outline" onClick={addHttpHeader} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Añadir Cabecera</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Credenciales del Tenant</CardTitle><CardDescription>Define los campos de autenticación que el tenant deberá rellenar.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {provider.configSchema?.map((field, index) => (<ConfigFieldRow key={field.id} field={field} onChange={(key, value) => handleConfigSchemaChange(index, key, value)} onRemove={() => removeConfigField(index)} onMove={(dir) => moveConfigField(index, dir)} isFirst={index === 0} isLast={index === (provider.configSchema?.length || 0) - 1} />))}
            <Button type="button" variant="outline" onClick={addConfigField} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Añadir Campo de Credencial</Button>
          </CardContent>
        </Card>

        {selectedBodyFormat?.format === 'json' && (
          <Card>
              <CardHeader><CardTitle>Compositor de JSON de la API</CardTitle><CardDescription>Construye la estructura del cuerpo (body) de la solicitud a la API.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                  {provider.apiSchema?.map((node, index) => (<ApiSchemaNodeEditor key={node.id} node={node} path={[index]} onChange={handleSchemaNodeChange} onAddChild={handleAddSchemaNode} onRemove={handleRemoveSchemaNode} />))}
                  <Button type="button" variant="outline" onClick={addRootSchemaNode} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Añadir Clave Raíz</Button>
              </div>
              </CardContent>
          </Card>
        )}

        {selectedBodyFormat?.format === 'xml' && (
          <Card>
              <CardHeader><CardTitle>Plantilla de Cuerpo XML</CardTitle><CardDescription>Pega el cuerpo XML de la solicitud. Usa {'{{placeholder}}'} para los valores dinámicos definidos en las credenciales.</CardDescription></CardHeader>
              <CardContent>
                  <Textarea value={provider.body_template || ''} onChange={e => handleFieldChange('body_template', e.target.value)} rows={15} placeholder='<soap:Envelope ...>&#10;  <soap:Body>&#10;    <ns1:MyAction>&#10;      <ns1:ApiKey>{{apiKey}}</ns1:ApiKey>&#10;    </ns1:MyAction>&#10;  </soap:Body>&#10;</soap:Envelope>' />
              </CardContent>
          </Card>
        )}
        
        <Accordion type="single" collapsible>
          <AccordionItem value="json-preview"><AccordionTrigger className="text-lg font-semibold"><Code className="mr-2 h-5 w-5" />Vista Previa del JSON Completo</AccordionTrigger><AccordionContent><pre className="bg-gray-900 text-white p-4 rounded-md overflow-x-auto"><code>{JSON.stringify(provider, null, 2)}</code></pre></AccordionContent></AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/superadmin/integrations')} disabled={mutation.isPending || isTesting}>Cancelar</Button>
          <Button type="button" variant="secondary" onClick={handleTestConnection} disabled={mutation.isPending || isTesting}>
              {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Probar Conexión
          </Button>
          <Button type="submit" disabled={mutation.isPending || isTesting}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
          </Button>
        </div>
      </form>
      <TestResultDialog isOpen={isTestResultOpen} onClose={() => setIsTestResultOpen(false)} result={testResult} />
    </>
  );
}
