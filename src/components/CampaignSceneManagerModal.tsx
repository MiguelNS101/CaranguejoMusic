import React, { useState } from 'react';
import {
  Compass,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Music,
  CloudRain,
  Volume2,
  Users,
  FileText,
  Sparkles,
  X,
  Swords,
  Beer,
  Trees,
  Ghost,
  Flame,
  Shield,
  Skull,
  LayoutGrid,
  Check,
  ChevronRight,
  FolderOpen,
  Clapperboard,
  BookOpen
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Campaign, Scene } from '../types';

interface CampaignSceneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCENE_ICONS: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'Beer', label: 'Taverna', icon: Beer },
  { id: 'Swords', label: 'Combate', icon: Swords },
  { id: 'Compass', label: 'Exploração', icon: Compass },
  { id: 'Trees', label: 'Natureza', icon: Trees },
  { id: 'Ghost', label: 'Terror / Mistério', icon: Ghost },
  { id: 'Flame', label: 'Perigo / Fogo', icon: Flame },
  { id: 'Shield', label: 'Fortaleza / Cidade', icon: Shield },
  { id: 'Skull', label: 'Masmorra / Morte', icon: Skull },
  { id: 'Sparkles', label: 'Arcano / Magia', icon: Sparkles }
];

const SCENE_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#ef4444', // Rose / Red
  '#10b981', // Emerald
  '#0ea5e9', // Sky Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6'  // Teal
];

export const CampaignSceneManagerModal: React.FC<CampaignSceneManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    campaigns,
    activeCampaignId,
    activeCampaign,
    activeScene,
    setActiveCampaignId,
    activateScene,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createScene,
    updateScene,
    deleteScene,
    musicTracks,
    ambienceTracks,
    soundboardLayouts,
    npcs,
    folders
  } = useAudio();

  // Mode: 'list' | 'create_campaign' | 'edit_campaign' | 'create_scene' | 'edit_scene'
  const [viewMode, setViewMode] = useState<'list' | 'create_campaign' | 'edit_campaign' | 'create_scene' | 'edit_scene'>('list');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  // Campaign Form State
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campGenre, setCampGenre] = useState<Campaign['genre']>('fantasy');
  const [campSystem, setCampSystem] = useState('D&D 5e / Fantasia Épica');
  const [campColor, setCampColor] = useState('#6366f1');

  // Scene Form State
  const [sceneName, setSceneName] = useState('');
  const [sceneDesc, setSceneDesc] = useState('');
  const [sceneIcon, setSceneIcon] = useState('Compass');
  const [sceneColor, setSceneColor] = useState('#6366f1');
  const [sceneMusicTrackId, setSceneMusicTrackId] = useState('');
  const [sceneMusicFolderId, setSceneMusicFolderId] = useState('');
  const [sceneAmbienceTrackId, setSceneAmbienceTrackId] = useState('');
  const [sceneAmbienceFolderId, setSceneAmbienceFolderId] = useState('');
  const [sceneSoundboardLayoutId, setSceneSoundboardLayoutId] = useState('');
  const [sceneAssignedNpcIds, setSceneAssignedNpcIds] = useState<string[]>([]);
  const [sceneNotes, setSceneNotes] = useState('');

  if (!isOpen) return null;

  const currentCampaign = activeCampaign || campaigns[0] || null;

  const handleOpenCreateCampaign = () => {
    setCampName('');
    setCampDesc('');
    setCampGenre('fantasy');
    setCampSystem('D&D 5e / Fantasia Épica');
    setCampColor('#6366f1');
    setViewMode('create_campaign');
  };

  const handleOpenEditCampaign = () => {
    if (!currentCampaign) return;
    setCampName(currentCampaign.name);
    setCampDesc(currentCampaign.description || '');
    setCampGenre(currentCampaign.genre || 'fantasy');
    setCampSystem(currentCampaign.system || 'D&D 5e / Fantasia Épica');
    setCampColor(currentCampaign.bannerColor || '#6366f1');
    setViewMode('edit_campaign');
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;

    if (viewMode === 'create_campaign') {
      await createCampaign({
        name: campName.trim(),
        description: campDesc.trim(),
        genre: campGenre,
        system: campSystem.trim(),
        bannerColor: campColor
      });
    } else if (viewMode === 'edit_campaign' && currentCampaign) {
      await updateCampaign(currentCampaign.id, {
        name: campName.trim(),
        description: campDesc.trim(),
        genre: campGenre,
        system: campSystem.trim(),
        bannerColor: campColor
      });
    }
    setViewMode('list');
  };

  const handleOpenCreateScene = () => {
    setSceneName('');
    setSceneDesc('');
    setSceneIcon('Compass');
    setSceneColor('#6366f1');
    setSceneMusicTrackId('');
    setSceneMusicFolderId('');
    setSceneAmbienceTrackId('');
    setSceneAmbienceFolderId('');
    setSceneSoundboardLayoutId('');
    setSceneAssignedNpcIds([]);
    setSceneNotes('');
    setEditingSceneId(null);
    setViewMode('create_scene');
  };

  const handleOpenEditScene = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setSceneName(scene.name);
    setSceneDesc(scene.description || '');
    setSceneIcon(scene.icon || 'Compass');
    setSceneColor(scene.themeColor || '#6366f1');
    setSceneMusicTrackId(scene.musicTrackId || '');
    setSceneMusicFolderId(scene.musicPlaylistFolderId || '');
    setSceneAmbienceTrackId(scene.ambienceTrackId || '');
    setSceneAmbienceFolderId(scene.ambienceFolderId || '');
    setSceneSoundboardLayoutId(scene.soundboardLayoutId || '');
    setSceneAssignedNpcIds(scene.assignedNpcIds || []);
    setSceneNotes(scene.notes || '');
    setViewMode('edit_scene');
  };

  const handleSaveScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCampaign || !sceneName.trim()) return;

    const payload: Partial<Scene> = {
      name: sceneName.trim(),
      description: sceneDesc.trim(),
      icon: sceneIcon,
      themeColor: sceneColor,
      musicTrackId: sceneMusicTrackId || undefined,
      musicPlaylistFolderId: sceneMusicFolderId || undefined,
      ambienceTrackId: sceneAmbienceTrackId || undefined,
      ambienceFolderId: sceneAmbienceFolderId || undefined,
      soundboardLayoutId: sceneSoundboardLayoutId || undefined,
      assignedNpcIds: sceneAssignedNpcIds,
      notes: sceneNotes.trim() || undefined
    };

    if (viewMode === 'create_scene') {
      await createScene(currentCampaign.id, payload);
    } else if (viewMode === 'edit_scene' && editingSceneId) {
      await updateScene(currentCampaign.id, editingSceneId, payload);
    }
    setViewMode('list');
  };

  const toggleNpcAssignment = (npcId: string) => {
    setSceneAssignedNpcIds(prev =>
      prev.includes(npcId) ? prev.filter(id => id !== npcId) : [...prev, npcId]
    );
  };

  const renderIconComponent = (iconName: string, className = 'w-4 h-4') => {
    const item = SCENE_ICONS.find(i => i.id === iconName);
    const Comp = item ? item.icon : Compass;
    return <Comp className={className} />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2D3139] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-rpg flex items-center gap-2">
                Sistema de Gerenciamento de Campanhas & Cenas
              </h3>
              <p className="text-xs text-[#9E9E9E]">
                Crie campanhas, organize cenas e vincule trilhas, ambientes e NPCs para transições instantâneas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9E9E9E] hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode: List Scenes & Campaign selector */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Campaign Navigation & Selector Bar */}
            <div className="bg-[#141619] border border-[#2D3139] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs text-[#9E9E9E] font-medium whitespace-nowrap">Campanha Ativa:</span>
                <select
                  value={currentCampaign?.id || ''}
                  onChange={(e) => setActiveCampaignId(e.target.value)}
                  className="bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.system || 'RPG'})
                    </option>
                  ))}
                </select>

                {currentCampaign && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={handleOpenEditCampaign}
                      className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#252830] transition-colors cursor-pointer"
                      title="Editar Campanha"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {campaigns.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza de que deseja excluir a campanha "${currentCampaign.name}"?`)) {
                            deleteCampaign(currentCampaign.id);
                          }
                        }}
                        className="p-1.5 text-[#9E9E9E] hover:text-rose-400 rounded-lg hover:bg-[#252830] transition-colors cursor-pointer"
                        title="Excluir Campanha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateCampaign}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-zinc-300 text-xs font-semibold border border-[#3D434E] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Campanha
                </button>

                <button
                  onClick={handleOpenCreateScene}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Nova Cena
                </button>
              </div>
            </div>

            {/* Current Campaign Info Banner */}
            {currentCampaign && (
              <div className="px-4 py-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white font-rpg text-sm">{currentCampaign.name}</span>
                  <span className="text-[#9E9E9E]">•</span>
                  <span className="text-zinc-400">{currentCampaign.system}</span>
                  {currentCampaign.description && (
                    <>
                      <span className="text-[#9E9E9E]">•</span>
                      <span className="text-zinc-400 italic truncate max-w-md">{currentCampaign.description}</span>
                    </>
                  )}
                </div>
                <span className="shrink-0 font-medium text-indigo-400">
                  {currentCampaign.scenes?.length || 0} cenas cadastradas
                </span>
              </div>
            )}

            {/* Scenes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(!currentCampaign?.scenes || currentCampaign.scenes.length === 0) ? (
                <div className="col-span-full p-12 text-center text-[#9E9E9E] text-xs bg-[#141619] border border-[#2D3139] rounded-2xl space-y-3">
                  <Clapperboard className="w-8 h-8 text-indigo-400 opacity-60 mx-auto" />
                  <p>Nenhuma cena cadastrada nesta campanha ainda.</p>
                  <button
                    onClick={handleOpenCreateScene}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Criar a Primeira Cena
                  </button>
                </div>
              ) : (
                currentCampaign.scenes.map((scene) => {
                  const isCurrentActive = currentCampaign.activeSceneId === scene.id;
                  const musicTrack = musicTracks.find(t => t.id === scene.musicTrackId);
                  const musicFolder = folders.find(f => f.id === scene.musicPlaylistFolderId);
                  const ambTrack = ambienceTracks.find(t => t.id === scene.ambienceTrackId);
                  const ambFolder = folders.find(f => f.id === scene.ambienceFolderId);
                  const sbLayout = soundboardLayouts.find(l => l.id === scene.soundboardLayoutId);
                  const assignedNpcList = npcs.filter(n => scene.assignedNpcIds?.includes(n.id));

                  return (
                    <div
                      key={scene.id}
                      className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all relative overflow-hidden ${
                        isCurrentActive
                          ? 'bg-[#181B20] border-indigo-500 shadow-xl shadow-indigo-600/20'
                          : 'bg-[#141619] border-[#2D3139] hover:border-[#3D434E]'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Icon, Name, Active Badge & Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                              style={{ backgroundColor: `${scene.themeColor || '#6366f1'}20`, color: scene.themeColor || '#6366f1' }}
                            >
                              {renderIconComponent(scene.icon || 'Compass', 'w-5 h-5')}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm font-rpg truncate">
                                  {scene.name}
                                </h4>
                                {isCurrentActive && (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-extrabold text-white uppercase tracking-wider shrink-0 shadow-sm">
                                    Cena Ativa
                                  </span>
                                )}
                              </div>
                              {scene.description && (
                                <p className="text-[11px] text-[#9E9E9E] line-clamp-1 mt-0.5">
                                  {scene.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditScene(scene)}
                              className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#252830] transition-colors cursor-pointer"
                              title="Editar Cena"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Excluir a cena "${scene.name}"?`)) {
                                  deleteScene(currentCampaign.id, scene.id);
                                }
                              }}
                              className="p-1.5 text-[#9E9E9E] hover:text-rose-400 rounded-lg hover:bg-[#252830] transition-colors cursor-pointer"
                              title="Excluir Cena"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Associated Elements Badges */}
                        <div className="space-y-1.5 text-xs bg-[#1A1D21] p-3 rounded-xl border border-[#2D3139]/80">
                          {/* Music */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <Music className="w-3.5 h-3.5 text-indigo-400" />
                              Música:
                            </span>
                            <span className="text-zinc-200 font-medium truncate max-w-[200px]">
                              {musicTrack?.title || musicFolder?.name || 'Nenhuma'}
                            </span>
                          </div>

                          {/* Ambience */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                              Ambiente:
                            </span>
                            <span className="text-zinc-200 font-medium truncate max-w-[200px]">
                              {ambTrack?.title || ambFolder?.name || 'Nenhum'}
                            </span>
                          </div>

                          {/* Soundboard Layout */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                              Soundboard:
                            </span>
                            <span className="text-zinc-200 font-medium truncate max-w-[200px]">
                              {sbLayout?.name || 'Layout Padrão'}
                            </span>
                          </div>

                          {/* NPCs */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#2D3139]/50">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <Users className="w-3.5 h-3.5 text-emerald-400" />
                              NPCs Vinculados:
                            </span>
                            <span className="text-zinc-200 font-medium">
                              {assignedNpcList.length} personagem(ns)
                            </span>
                          </div>

                          {assignedNpcList.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {assignedNpcList.slice(0, 4).map(npc => (
                                <span
                                  key={npc.id}
                                  className="px-2 py-0.5 rounded bg-[#141619] border border-[#2D3139] text-[10px] text-zinc-300 truncate max-w-[120px]"
                                >
                                  {npc.name}
                                </span>
                              ))}
                              {assignedNpcList.length > 4 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#141619] text-[10px] text-zinc-500">
                                  +{assignedNpcList.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* GM Notes preview */}
                          {scene.notes && (
                            <div className="pt-1.5 border-t border-[#2D3139]/50 text-[10px] text-amber-300/90 italic truncate">
                              📝 {scene.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Activate Button */}
                      <div className="pt-3">
                        <button
                          onClick={() => activateScene(currentCampaign.id, scene.id)}
                          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                            isCurrentActive
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isCurrentActive ? 'Carregar Cena Novamente' : '▶️ Ativar Esta Cena Agora'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* View Mode: Create / Edit Campaign */}
        {(viewMode === 'create_campaign' || viewMode === 'edit_campaign') && (
          <form onSubmit={handleSaveCampaign} className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="bg-[#141619] p-4 rounded-2xl border border-[#2D3139] space-y-3">
              <h4 className="text-sm font-bold text-white font-rpg">
                {viewMode === 'create_campaign' ? 'Criar Nova Campanha' : 'Editar Dados da Campanha'}
              </h4>

              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: A Maldição de Strahd, Crônicas de Neo-Santos..."
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Sistema de RPG
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: D&D 5e, Mundo das Trevas, Tormenta20..."
                    value={campSystem}
                    onChange={(e) => setCampSystem(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Gênero / Ambientação
                  </label>
                  <select
                    value={campGenre}
                    onChange={(e) => setCampGenre(e.target.value as any)}
                    className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="fantasy">Fantasia Medieval</option>
                    <option value="scifi">Ficção Científica</option>
                    <option value="modern">Moderno / Investigação</option>
                    <option value="gothic">Gótico / Mundo das Trevas</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="general">Geral / Multiverso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Descrição da Campanha (Visão Geral)
                </label>
                <textarea
                  rows={3}
                  placeholder="Resumo do cenário, premissa da aventura e objetivos do grupo..."
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Salvar Campanha
              </button>
            </div>
          </form>
        )}

        {/* View Mode: Create / Edit Scene */}
        {(viewMode === 'create_scene' || viewMode === 'edit_scene') && (
          <form onSubmit={handleSaveScene} className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="bg-[#141619] p-4 rounded-2xl border border-[#2D3139] space-y-4">
              <h4 className="text-sm font-bold text-white font-rpg">
                {viewMode === 'create_scene' ? 'Criar Nova Cena' : 'Editar Dados da Cena'}
              </h4>

              {/* Basic Scene Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Nome da Cena *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Taverna do Siri, Emboscada na Floresta, Cripta Antiga..."
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Ícone Temático
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {SCENE_ICONS.map(i => {
                      const IconComp = i.icon;
                      const isSelected = sceneIcon === i.id;
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setSceneIcon(i.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-[#1A1D21] text-zinc-400 border-[#2D3139] hover:text-white'
                          }`}
                          title={i.label}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Descrição Curta da Cena
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ambiente aconchegante e ruidoso com marinheiros contando vantagens..."
                  value={sceneDesc}
                  onChange={(e) => setSceneDesc(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Audio Associations */}
              <div className="bg-[#1A1D21] p-3.5 rounded-xl border border-[#2D3139] space-y-3">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-indigo-400" />
                  Vinculação de Áudio & Trilha Sonora
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#9E9E9E] block mb-1">
                      Música Principal
                    </label>
                    <select
                      value={sceneMusicTrackId}
                      onChange={(e) => setSceneMusicTrackId(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Nenhuma música específica</option>
                      {musicTracks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#9E9E9E] block mb-1">
                      Ou Pasta de Músicas (Playlist)
                    </label>
                    <select
                      value={sceneMusicFolderId}
                      onChange={(e) => setSceneMusicFolderId(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Nenhuma pasta</option>
                      {folders.filter(f => f.type === 'music').map(f => (
                        <option key={f.id} value={f.id}>
                          📁 {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#9E9E9E] block mb-1">
                      Som de Ambiente (Chuva, Taverna, Vento...)
                    </label>
                    <select
                      value={sceneAmbienceTrackId}
                      onChange={(e) => setSceneAmbienceTrackId(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Nenhum ambiente específico</option>
                      {ambienceTracks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#9E9E9E] block mb-1">
                      Soundboard Layout Associado
                    </label>
                    <select
                      value={sceneSoundboardLayoutId}
                      onChange={(e) => setSceneSoundboardLayoutId(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Manter layout atual</option>
                      {soundboardLayouts.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* NPC Association */}
              <div className="bg-[#1A1D21] p-3.5 rounded-xl border border-[#2D3139] space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    NPCs & Criaturas Presentes Nesta Cena ({sceneAssignedNpcIds.length})
                  </h5>
                  <span className="text-[10px] text-[#9E9E9E]">
                    Marque os personagens ativos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {npcs.length === 0 ? (
                    <p className="col-span-full text-[11px] text-[#9E9E9E] italic py-2">
                      Nenhum NPC cadastrado. Crie NPCs na aba de Personagens.
                    </p>
                  ) : (
                    npcs.map(npc => {
                      const isChecked = sceneAssignedNpcIds.includes(npc.id);
                      return (
                        <label
                          key={npc.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                              : 'bg-[#141619] border-[#2D3139] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleNpcAssignment(npc.id)}
                            className="rounded border-[#2D3139] text-emerald-600 focus:ring-0 bg-[#1A1D21]"
                          />
                          <span className="truncate">{npc.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* GM Notes & Narration */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Notas do Mestre / Narração de Entrada
                </label>
                <textarea
                  rows={3}
                  placeholder="Texto para ler em voz alta ao entrar na cena, CDs de testes de perícia, gatilhos de monstros..."
                  value={sceneNotes}
                  onChange={(e) => setSceneNotes(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Salvar Cena
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
