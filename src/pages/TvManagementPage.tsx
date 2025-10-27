import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import RegisterTvDialog from '@/components/RegisterTvDialog';
import MediaPlaylistDialog from '@/components/MediaPlaylistDialog';
import AssignPlaylistDialog from '@/components/AssignPlaylistDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, Trash2, Tv, Plus, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useScreenSize } from '@/hooks/useScreenSize';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// --- Interfaces ---
interface TvDisplay { id: string; branch_id: string | null; registration_code: string; is_registered: boolean; registered_at: string | null; last_heartbeat: string | null; media_playlist_id: string | null; tenant_id: string | null; created_at: string; updated_at: string; branch_name?: string | null; }
interface MediaPlaylist { id: string; name: string; description: string; }

// --- TV Section Components ---
const TvCardSkeleton = () => (
    <Card><CardContent className="p-4 space-y-3"><div className="flex justify-between items-start"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-5 w-1/4" /></div><Skeleton className="h-4 w-1/2" /><div className="flex justify-end pt-2"><Skeleton className="h-9 w-9" /></div></CardContent></Card>
);
const TvTableSkeleton = () => (
    <>{[...Array(2)].map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell className="text-right"><Skeleton className="h-9 w-9" /></TableCell></TableRow>))}</>
);
const TvCard = ({ tv, handleAssignPlaylist }: { tv: TvDisplay, handleAssignPlaylist: (tv: TvDisplay) => void }) => (
    <Card><CardContent className="p-4"><div className="flex justify-between items-start mb-2"><p className="font-medium text-primary pr-2">Código: {tv.registration_code}</p><Badge variant={tv.is_registered ? 'default' : 'secondary'}>{tv.is_registered ? 'Registrada' : 'Pendiente'}</Badge></div><div className="space-y-2 text-sm text-muted-foreground"><p><strong>Sucursal:</strong> {tv.branch_name || 'N/A'}</p><p><strong>Última Conexión:</strong> {tv.last_heartbeat ? new Date(tv.last_heartbeat).toLocaleString() : 'Nunca'}</p></div><div className="flex items-center justify-end mt-4"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleAssignPlaylist(tv)}>Asignar Playlist</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></CardContent></Card>
);

// --- Playlist Section Components ---
const PlaylistCardSkeleton = () => (
    <Card><CardContent className="p-4 space-y-3"><div className="flex justify-between items-start"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-9 w-9" /></div><Skeleton className="h-4 w-full" /></CardContent></Card>
);
const PlaylistTableSkeleton = () => (
    <>{[...Array(2)].map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-48" /></TableCell><TableCell className="text-right"><Skeleton className="h-9 w-9" /></TableCell></TableRow>))}</>
);
const PlaylistCard = ({ playlist, handleEdit, openDeleteDialog }: { playlist: MediaPlaylist, handleEdit: (p: MediaPlaylist) => void, openDeleteDialog: (p: MediaPlaylist) => void }) => (
    <Card><CardContent className="p-4 flex justify-between items-center"><div className="pr-4"><p className="font-medium">{playlist.name}</p><p className="text-sm text-muted-foreground">{playlist.description}</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEdit(playlist)}><Pencil className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem><DropdownMenuItem onClick={() => openDeleteDialog(playlist)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardContent></Card>
);


const TvManagementPage: React.FC = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';
  const [tvDisplays, setTvDisplays] = useState<TvDisplay[]>([]);
  const [mediaPlaylists, setMediaPlaylists] = useState<MediaPlaylist[]>([]);
  const [loadingTv, setLoadingTv] = useState<boolean>(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState<boolean>(true);
  const [errorTv, setErrorTv] = useState<string | null>(null);
  const [errorPlaylists, setErrorPlaylists] = useState<string | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState<boolean>(false);
  const [isMediaPlaylistDialogOpen, setIsMediaPlaylistDialogOpen] = useState<boolean>(false);
  const [isAssignPlaylistDialogOpen, setIsAssignPlaylistDialogOpen] = useState<boolean>(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MediaPlaylist | null>(null);
  const [selectedTvDisplay, setSelectedTvDisplay] = useState<TvDisplay | null>(null);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<MediaPlaylist | null>(null);

  // fetch and handler functions
  const fetchTvDisplays = useCallback(async () => { if (!tenantId) return; setLoadingTv(true); setErrorTv(null); try { const { data, error } = await supabase.rpc('get_managed_tvs', { p_tenant_id: tenantId }); if (error) { throw error; } setTvDisplays(data as TvDisplay[]); } catch (err: any) { setErrorTv(err.message); } finally { setLoadingTv(false); } }, [tenantId]);
  const fetchMediaPlaylists = useCallback(async () => { setLoadingPlaylists(true); setErrorPlaylists(null); try { const { data, error } = await supabase.from('media_playlists').select('*'); if (error) { throw error; } setMediaPlaylists(data as MediaPlaylist[]); } catch (err: any) { setErrorPlaylists(err.message); } finally { setLoadingPlaylists(false); } }, []);
  useEffect(() => { fetchTvDisplays(); fetchMediaPlaylists(); }, [fetchTvDisplays, fetchMediaPlaylists, tenantId]);
  const handleEditPlaylist = (playlist: MediaPlaylist) => { setSelectedPlaylist(playlist); setIsMediaPlaylistDialogOpen(true); };
  const openDeleteDialog = (playlist: MediaPlaylist) => { setPlaylistToDelete(playlist); setIsDeleteDialogOpen(true); };
  const confirmDeletePlaylist = async () => { if (!playlistToDelete) return; try { const { error } = await supabase.from('media_playlists').delete().eq('id', playlistToDelete.id); if (error) { throw error; } toast({ title: 'Playlist Eliminada', description: `La playlist "${playlistToDelete.name}" ha sido eliminada.`, variant: 'success', }); fetchMediaPlaylists(); } catch (err: any) { toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive', }); } finally { setIsDeleteDialogOpen(false); setPlaylistToDelete(null); } };
  const handleAssignPlaylist = (tvDisplay: TvDisplay) => { setSelectedTvDisplay(tvDisplay); setIsAssignPlaylistDialogOpen(true); };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Tv className="h-5 w-5" />
            Gestión de TV y Playlists
          </CardTitle>
          <CardDescription>Registra tus TVs y administra las playlists de medios que se mostrarán.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">TVs Registradas</CardTitle>
              <Button onClick={() => setIsRegisterDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Registrar TV</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {errorTv ? <p className="text-red-500">{errorTv}</p> : isMobile ? (
                <div className="space-y-4">
                  {loadingTv ? (
                    [...Array(2)].map((_, i) => <TvCardSkeleton key={i} />)
                  ) : tvDisplays.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No hay TVs registradas.</p>
                  ) : (
                    tvDisplays.map((tv) => <TvCard key={tv.id} tv={tv} handleAssignPlaylist={handleAssignPlaylist} />)
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTv ? <TvTableSkeleton /> : tvDisplays.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center">No hay TVs registradas.</TableCell></TableRow>
                    ) : (
                      tvDisplays.map((tv) => (
                        <TableRow key={tv.id}>
                          <TableCell><code className="text-xs">{tv.registration_code}</code></TableCell>
                          <TableCell>{tv.branch_name || 'N/A'}</TableCell>
                          <TableCell><Badge variant={tv.is_registered ? 'default' : 'secondary'}>{tv.is_registered ? 'Registrada' : 'Pendiente'}</Badge></TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleAssignPlaylist(tv)}>Asignar Playlist</DropdownMenuItem></DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Playlists de Medios</CardTitle>
              <Button onClick={() => { setSelectedPlaylist(null); setIsMediaPlaylistDialogOpen(true); }} size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Crear Playlist</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
               {errorPlaylists ? <p className="text-red-500">{errorPlaylists}</p> : isMobile ? (
                <div className="space-y-4">
                  {loadingPlaylists ? (
                    [...Array(3)].map((_, i) => <PlaylistCardSkeleton key={i} />)
                  ) : mediaPlaylists.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No hay playlists creadas.</p>
                  ) : (
                    mediaPlaylists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} handleEdit={handleEditPlaylist} openDeleteDialog={openDeleteDialog} />)
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPlaylists ? <PlaylistTableSkeleton /> : mediaPlaylists.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center">No hay playlists creadas.</TableCell></TableRow>
                    ) : (
                      mediaPlaylists.map((playlist) => (
                        <TableRow key={playlist.id}>
                          <TableCell className="font-medium">{playlist.name}</TableCell>
                          <TableCell>{playlist.description}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPlaylist(playlist)}><Pencil className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteDialog(playlist)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      {/* Dialogs */}
      <RegisterTvDialog isOpen={isRegisterDialogOpen} onClose={() => setIsRegisterDialogOpen(false)} onSuccess={() => { setIsRegisterDialogOpen(false); fetchTvDisplays(); }} />
      <MediaPlaylistDialog isOpen={isMediaPlaylistDialogOpen} onClose={() => { setIsMediaPlaylistDialogOpen(false); setSelectedPlaylist(null); }} onSuccess={() => { setIsMediaPlaylistDialogOpen(false); setSelectedPlaylist(null); fetchMediaPlaylists(); }} playlist={selectedPlaylist} />
      {selectedTvDisplay && <AssignPlaylistDialog isOpen={isAssignPlaylistDialogOpen} onClose={() => { setIsAssignPlaylistDialogOpen(false); setSelectedTvDisplay(null); }} onSuccess={() => { setIsAssignPlaylistDialogOpen(false); setSelectedTvDisplay(null); fetchTvDisplays(); }} tvDisplayId={selectedTvDisplay.id} currentPlaylistId={selectedTvDisplay.media_playlist_id} />}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la playlist <span className="font-bold"> {playlistToDelete?.name} </span> y todos sus elementos asociados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlaylist}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TvManagementPage;
