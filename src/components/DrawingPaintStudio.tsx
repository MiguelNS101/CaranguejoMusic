import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Crop,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Palette,
  Move,
  RotateCcw,
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
  Scissors,
  Layers,
  Check,
  X,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Copy,
  FolderOpen
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { DiscordChannel } from '../types';
import { safeFetchJson } from '../services/api';
import {
  moveLayerUp,
  moveLayerDown,
  moveLayerToTop,
  moveLayerToBottom
} from '../utils/layerManager';

type Tool = 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'text' | 'arrow' | 'select' | 'marquee';

export interface ImageOverlay {
  id: string;
  img: HTMLImageElement;
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  brightness: number;
  contrast: number;
  sepia: number;
  grayscale: number;
  invert: number;
  crop?: { x: number; y: number; width: number; height: number };
}

export interface LayerItem {
  id: string;
  name: string;
  type: 'canvas' | 'image';
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  canvas: HTMLCanvasElement; // offscreen layer canvas
  imageOverlay?: ImageOverlay;
}

// Module-level persistent cache so state is NEVER lost on tab changes or unmounts
interface DrawingCache {
  layers: Array<{
    id: string;
    name: string;
    type: 'canvas' | 'image';
    visible: boolean;
    locked: boolean;
    opacity: number;
    dataUrl: string;
    imageOverlay?: {
      src: string;
      name: string;
      x: number;
      y: number;
      width: number;
      height: number;
      originalWidth: number;
      originalHeight: number;
      rotation: number;
      scaleX: number;
      scaleY: number;
      opacity: number;
      brightness: number;
      contrast: number;
      sepia: number;
      grayscale: number;
      invert: number;
      crop?: { x: number; y: number; width: number; height: number };
    };
  }>;
  activeLayerId: string;
  canvasWidth: number;
  canvasHeight: number;
  currentTool: Tool;
  color: string;
  strokeWidth: number;
}

let globalDrawingCache: DrawingCache | null = null;

const PRESET_COLORS = [
  '#ef4444', // Red / Blood
  '#f97316', // Orange / Fire
  '#eab308', // Gold / Warning
  '#22c55e', // Green / Nature
  '#06b6d4', // Cyan / Water
  '#3b82f6', // Blue / Magic
  '#a855f7', // Purple / Arcane
  '#ec4899', // Pink
  '#ffffff', // White
  '#9ca3af', // Gray / Stone
  '#000000'  // Black / Shadow
];

const STROKE_WIDTHS = [2, 4, 8, 14, 24];

export const DrawingPaintStudio: React.FC = () => {
  const { botStatus, logAction } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tools & Appearance
  const [currentTool, setCurrentTool] = useState<Tool>(() => globalDrawingCache?.currentTool || 'brush');
  const [color, setColor] = useState<string>(() => globalDrawingCache?.color || '#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(() => globalDrawingCache?.strokeWidth || 4);
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(20);

  // Canvas Dimensions
  const [canvasWidth, setCanvasWidth] = useState<number>(() => globalDrawingCache?.canvasWidth || 960);
  const [canvasHeight, setCanvasHeight] = useState<number>(() => globalDrawingCache?.canvasHeight || 600);

  // Layers System
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const layersRef = useRef<LayerItem[]>([]);
  layersRef.current = layers;

  // Active Image for Floating Manipulation
  const [activeImage, setActiveImage] = useState<ImageOverlay | null>(null);
  const [isLockAspectRatio, setIsLockAspectRatio] = useState<boolean>(true);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Marquee Selection Box for Cutting on Canvas
  const [marqueeBox, setMarqueeBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Drag handles on active image
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; initialImage?: ImageOverlay }>({ mouseX: 0, mouseY: 0 });

  // Drawing state
  const isDrawing = useRef<boolean>(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);

  // History for Undo / Redo
  const [history, setHistory] = useState<string[]>([]); // dataUrls of composite
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Discord Send Modal
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState<boolean>(false);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [discordCaption, setDiscordCaption] = useState<string>('🗺️ Esboço / Desenho do Mestre');
  const [isSendingDiscord, setIsSendingDiscord] = useState<boolean>(false);
  const [discordFeedback, setDiscordFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Drag over canvas state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Helper to create an offscreen canvas
  const createOffscreenCanvas = (w: number, h: number): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };

  // Compose all visible layers onto the visible main canvas
  const composeCanvas = useCallback(() => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    const currentLayers = layersRef.current;
    for (const layer of currentLayers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      if (layer.type === 'canvas' && layer.canvas) {
        ctx.drawImage(layer.canvas, 0, 0);
      } else if (layer.type === 'image' && layer.imageOverlay) {
        const imgOver = layer.imageOverlay;
        const cx = imgOver.x + imgOver.width / 2;
        const cy = imgOver.y + imgOver.height / 2;

        ctx.translate(cx, cy);
        ctx.rotate((imgOver.rotation * Math.PI) / 180);
        ctx.scale(imgOver.scaleX, imgOver.scaleY);
        ctx.filter = `brightness(${imgOver.brightness}%) contrast(${imgOver.contrast}%) sepia(${imgOver.sepia}%) grayscale(${imgOver.grayscale}%) invert(${imgOver.invert}%)`;

        if (imgOver.crop) {
          ctx.drawImage(
            imgOver.img,
            imgOver.crop.x,
            imgOver.crop.y,
            imgOver.crop.width,
            imgOver.crop.height,
            -imgOver.width / 2,
            -imgOver.height / 2,
            imgOver.width,
            imgOver.height
          );
        } else {
          ctx.drawImage(
            imgOver.img,
            -imgOver.width / 2,
            -imgOver.height / 2,
            imgOver.width,
            imgOver.height
          );
        }
      }

      ctx.restore();
    }
  }, []);

  // Save state to module cache & localStorage for tab persistence
  const syncToCache = useCallback(() => {
    try {
      const currentLayers = layersRef.current;
      const cachedLayers = currentLayers.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity,
        dataUrl: l.canvas ? l.canvas.toDataURL() : '',
        imageOverlay: l.imageOverlay ? {
          src: l.imageOverlay.src,
          name: l.imageOverlay.name,
          x: l.imageOverlay.x,
          y: l.imageOverlay.y,
          width: l.imageOverlay.width,
          height: l.imageOverlay.height,
          originalWidth: l.imageOverlay.originalWidth,
          originalHeight: l.imageOverlay.originalHeight,
          rotation: l.imageOverlay.rotation,
          scaleX: l.imageOverlay.scaleX,
          scaleY: l.imageOverlay.scaleY,
          opacity: l.imageOverlay.opacity,
          brightness: l.imageOverlay.brightness,
          contrast: l.imageOverlay.contrast,
          sepia: l.imageOverlay.sepia,
          grayscale: l.imageOverlay.grayscale,
          invert: l.imageOverlay.invert,
          crop: l.imageOverlay.crop
        } : undefined
      }));

      const cacheObj: DrawingCache = {
        layers: cachedLayers,
        activeLayerId,
        canvasWidth,
        canvasHeight,
        currentTool,
        color,
        strokeWidth
      };

      globalDrawingCache = cacheObj;
      try {
        localStorage.setItem('caranguejo_drawing_studio_v2', JSON.stringify({
          activeLayerId,
          canvasWidth,
          canvasHeight,
          currentTool,
          color,
          strokeWidth,
          // Limit storage size if needed
          layers: cachedLayers.map(l => ({ ...l, dataUrl: l.dataUrl.length > 500000 ? '' : l.dataUrl }))
        }));
      } catch {}
    } catch {}
  }, [activeLayerId, canvasWidth, canvasHeight, currentTool, color, strokeWidth]);

  // Save current composite to history
  const pushHistorySnapshot = useCallback(() => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;
    const url = mainCanvas.toDataURL();
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, url];
    });
    setHistoryIndex(prev => prev + 1);
    syncToCache();
  }, [historyIndex, syncToCache]);

  // INITIALIZATION & RESTORATION FROM CACHE
  useEffect(() => {
    let isMounted = true;

    // Check if we have cached layers from a previous tab or local storage
    if (globalDrawingCache && globalDrawingCache.layers.length > 0) {
      const restoredLayers: LayerItem[] = [];
      const pendingLoads: Promise<void>[] = [];

      for (const cl of globalDrawingCache.layers) {
        const offscreen = createOffscreenCanvas(globalDrawingCache.canvasWidth, globalDrawingCache.canvasHeight);
        const offCtx = offscreen.getContext('2d');

        if (cl.dataUrl && offCtx) {
          const p = new Promise<void>(resolve => {
            const img = new Image();
            img.onload = () => {
              offCtx.drawImage(img, 0, 0);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = cl.dataUrl;
          });
          pendingLoads.push(p);
        }

        let imgOver: ImageOverlay | undefined = undefined;
        if (cl.imageOverlay) {
          const imgEl = new Image();
          imgEl.src = cl.imageOverlay.src;
          imgOver = {
            id: 'overlay-' + cl.id,
            img: imgEl,
            src: cl.imageOverlay.src,
            name: cl.imageOverlay.name,
            x: cl.imageOverlay.x,
            y: cl.imageOverlay.y,
            width: cl.imageOverlay.width,
            height: cl.imageOverlay.height,
            originalWidth: cl.imageOverlay.originalWidth,
            originalHeight: cl.imageOverlay.originalHeight,
            rotation: cl.imageOverlay.rotation,
            scaleX: cl.imageOverlay.scaleX,
            scaleY: cl.imageOverlay.scaleY,
            opacity: cl.imageOverlay.opacity,
            brightness: cl.imageOverlay.brightness,
            contrast: cl.imageOverlay.contrast,
            sepia: cl.imageOverlay.sepia,
            grayscale: cl.imageOverlay.grayscale,
            invert: cl.imageOverlay.invert,
            crop: cl.imageOverlay.crop
          };
        }

        restoredLayers.push({
          id: cl.id,
          name: cl.name,
          type: cl.type,
          visible: cl.visible,
          locked: cl.locked,
          opacity: cl.opacity,
          canvas: offscreen,
          imageOverlay: imgOver
        });
      }

      Promise.all(pendingLoads).then(() => {
        if (!isMounted) return;
        setLayers(restoredLayers);
        setActiveLayerId(globalDrawingCache?.activeLayerId || restoredLayers[0]?.id || '');
        setTimeout(() => {
          composeCanvas();
        }, 50);
      });
    } else {
      // Default initial layer setup: Background Layer
      const baseCanvas = createOffscreenCanvas(canvasWidth, canvasHeight);
      const bCtx = baseCanvas.getContext('2d');
      if (bCtx) {
        bCtx.fillStyle = '#181a1f';
        bCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const initialLayer: LayerItem = {
        id: 'layer-bg',
        name: 'Camada 1 (Fundo)',
        type: 'canvas',
        visible: true,
        locked: false,
        opacity: 1,
        canvas: baseCanvas
      };

      setLayers([initialLayer]);
      setActiveLayerId('layer-bg');
      setTimeout(() => {
        composeCanvas();
      }, 50);
    }

    return () => {
      isMounted = false;
      syncToCache();
    };
  }, []);

  // Sync canvas dimensions
  useEffect(() => {
    composeCanvas();
  }, [layers, canvasWidth, canvasHeight, composeCanvas]);

  // Fetch Discord channels for direct broadcast
  useEffect(() => {
    if (!botStatus.isOnline) return;
    safeFetchJson<{ success: boolean; channels: DiscordChannel[] }>('/api/bot/channels').then(res => {
      if (res.success && res.data?.channels) {
        const textChannels = res.data.channels.filter(c => c.type === 'text');
        setChannels(textChannels);
        if (textChannels.length > 0 && !selectedChannelId) {
          setSelectedChannelId(textChannels[0].id);
        }
      }
    });
  }, [botStatus.isOnline, selectedChannelId]);

  // LAYER CONTROLS (Bring to Front, Send to Back, Move Up, Move Down, Add, Duplicate, Delete)
  const handleAddLayer = (name?: string) => {
    const newId = 'layer-' + Date.now();
    const offscreen = createOffscreenCanvas(canvasWidth, canvasHeight);
    const newLayer: LayerItem = {
      id: newId,
      name: name || `Camada ${layers.length + 1}`,
      type: 'canvas',
      visible: true,
      locked: false,
      opacity: 1,
      canvas: offscreen
    };

    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newId);
    logAction(`Nova camada "${newLayer.name}" adicionada`, 'drawing');
  };

  const handleDuplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    const newId = 'layer-copy-' + Date.now();
    const offscreen = createOffscreenCanvas(canvasWidth, canvasHeight);
    const offCtx = offscreen.getContext('2d');
    if (offCtx && layer.canvas) {
      offCtx.drawImage(layer.canvas, 0, 0);
    }

    const duplicated: LayerItem = {
      ...layer,
      id: newId,
      name: `${layer.name} (Cópia)`,
      canvas: offscreen
    };

    const idx = layers.findIndex(l => l.id === id);
    const nextLayers = [...layers];
    nextLayers.splice(idx + 1, 0, duplicated);

    setLayers(nextLayers);
    setActiveLayerId(newId);
    composeCanvas();
    logAction(`Camada "${layer.name}" duplicada`, 'drawing');
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      alert('É necessário manter ao menos uma camada na tela.');
      return;
    }
    const idx = layers.findIndex(l => l.id === id);
    const nextLayers = layers.filter(l => l.id !== id);
    setLayers(nextLayers);

    if (activeLayerId === id) {
      const nextActive = nextLayers[Math.max(0, idx - 1)] || nextLayers[0];
      setActiveLayerId(nextActive.id);
    }

    setTimeout(composeCanvas, 20);
    logAction('Camada excluída', 'drawing');
  };

  const handleToggleLayerVisible = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    setTimeout(composeCanvas, 20);
  };

  const handleToggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const handleLayerOpacityChange = (id: string, val: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: val } : l));
    setTimeout(composeCanvas, 20);
  };

  // Bring layer 1 step forward (closer to top)
  const handleMoveLayerUp = (id: string) => {
    setLayers(prev => moveLayerUp(prev, id));
    setTimeout(composeCanvas, 20);
    logAction('Camada movida para frente', 'drawing');
  };

  // Send layer 1 step backward (closer to bottom)
  const handleMoveLayerDown = (id: string) => {
    setLayers(prev => moveLayerDown(prev, id));
    setTimeout(composeCanvas, 20);
    logAction('Camada movida para trás', 'drawing');
  };

  // Bring to Front (topmost z-index)
  const handleMoveLayerToTop = (id: string) => {
    setLayers(prev => moveLayerToTop(prev, id));
    setTimeout(composeCanvas, 20);
    logAction('Camada trazida para o topo', 'drawing');
  };

  // Send to Back (bottommost z-index)
  const handleMoveLayerToBottom = (id: string) => {
    setLayers(prev => moveLayerToBottom(prev, id));
    setTimeout(composeCanvas, 20);
    logAction('Camada enviada para o fundo', 'drawing');
  };

  // Convert mouse event to canvas coordinate
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Get current active target layer
  const getActiveLayer = (): LayerItem | undefined => {
    return layers.find(l => l.id === activeLayerId) || layers[layers.length - 1];
  };

  // INSERT IMAGE / TOKEN (can be used as floating overlay or added as dedicated Layer)
  const insertImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxInitialW = canvasWidth * 0.75;
        const maxInitialH = canvasHeight * 0.75;
        const scale = Math.min(maxInitialW / img.width, maxInitialH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvasWidth - w) / 2;
        const y = (canvasHeight - h) / 2;

        const newOverlay: ImageOverlay = {
          id: 'img-' + Date.now(),
          img,
          src: e.target?.result as string,
          name: file.name,
          x,
          y,
          width: w,
          height: h,
          originalWidth: img.width,
          originalHeight: img.height,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          brightness: 100,
          contrast: 100,
          sepia: 0,
          grayscale: 0,
          invert: 0
        };

        setActiveImage(newOverlay);
        setCurrentTool('select');
        setCropBox(null);
        logAction(`Imagem "${file.name}" carregada para manipulação`, 'drawing');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Bake active floating image directly onto current active layer or new layer
  const handleBakeActiveImage = (asNewLayer: boolean = false) => {
    if (!activeImage) return;

    if (asNewLayer) {
      const newId = 'layer-img-' + Date.now();
      const offscreen = createOffscreenCanvas(canvasWidth, canvasHeight);
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.save();
        const cx = activeImage.x + activeImage.width / 2;
        const cy = activeImage.y + activeImage.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((activeImage.rotation * Math.PI) / 180);
        ctx.scale(activeImage.scaleX, activeImage.scaleY);
        ctx.globalAlpha = activeImage.opacity;
        ctx.filter = `brightness(${activeImage.brightness}%) contrast(${activeImage.contrast}%) sepia(${activeImage.sepia}%) grayscale(${activeImage.grayscale}%) invert(${activeImage.invert}%)`;

        if (activeImage.crop) {
          ctx.drawImage(
            activeImage.img,
            activeImage.crop.x,
            activeImage.crop.y,
            activeImage.crop.width,
            activeImage.crop.height,
            -activeImage.width / 2,
            -activeImage.height / 2,
            activeImage.width,
            activeImage.height
          );
        } else {
          ctx.drawImage(
            activeImage.img,
            -activeImage.width / 2,
            -activeImage.height / 2,
            activeImage.width,
            activeImage.height
          );
        }
        ctx.restore();
      }

      const newLayer: LayerItem = {
        id: newId,
        name: `Token: ${activeImage.name.replace(/\.[^/.]+$/, '').slice(0, 15)}`,
        type: 'canvas',
        visible: true,
        locked: false,
        opacity: 1,
        canvas: offscreen
      };

      setLayers(prev => [...prev, newLayer]);
      setActiveLayerId(newId);
    } else {
      const targetLayer = getActiveLayer();
      if (!targetLayer || targetLayer.locked) {
        alert('A camada ativa está bloqueada ou inacessível.');
        return;
      }
      const ctx = targetLayer.canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        const cx = activeImage.x + activeImage.width / 2;
        const cy = activeImage.y + activeImage.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((activeImage.rotation * Math.PI) / 180);
        ctx.scale(activeImage.scaleX, activeImage.scaleY);
        ctx.globalAlpha = activeImage.opacity;
        ctx.filter = `brightness(${activeImage.brightness}%) contrast(${activeImage.contrast}%) sepia(${activeImage.sepia}%) grayscale(${activeImage.grayscale}%) invert(${activeImage.invert}%)`;

        if (activeImage.crop) {
          ctx.drawImage(
            activeImage.img,
            activeImage.crop.x,
            activeImage.crop.y,
            activeImage.crop.width,
            activeImage.crop.height,
            -activeImage.width / 2,
            -activeImage.height / 2,
            activeImage.width,
            activeImage.height
          );
        } else {
          ctx.drawImage(
            activeImage.img,
            -activeImage.width / 2,
            -activeImage.height / 2,
            activeImage.width,
            activeImage.height
          );
        }
        ctx.restore();
      }
    }

    setActiveImage(null);
    setCropBox(null);
    composeCanvas();
    pushHistorySnapshot();
    logAction('Imagem fixada no mapa', 'drawing');
  };

  // MARQUEE CUTTING ON ACTIVE LAYER
  const handleCutCanvasMarquee = (action: 'move' | 'delete' | 'copy') => {
    if (!marqueeBox) return;
    const targetLayer = getActiveLayer();
    if (!targetLayer || targetLayer.locked) return;

    const ctx = targetLayer.canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, width, height } = marqueeBox;
    if (width <= 2 || height <= 2) return;

    const imgData = ctx.getImageData(x, y, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imgData, 0, 0);
      const dataUrl = tempCanvas.toDataURL();
      const img = new Image();
      img.onload = () => {
        if (action === 'delete') {
          ctx.clearRect(x, y, width, height);
          setMarqueeBox(null);
          composeCanvas();
          pushHistorySnapshot();
          logAction('Área cortada da camada ativa', 'drawing');
        } else if (action === 'move') {
          ctx.clearRect(x, y, width, height);
          composeCanvas();
          setActiveImage({
            id: 'cut-' + Date.now(),
            img,
            src: dataUrl,
            name: 'Recorte',
            x,
            y,
            width,
            height,
            originalWidth: width,
            originalHeight: height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            brightness: 100,
            contrast: 100,
            sepia: 0,
            grayscale: 0,
            invert: 0
          });
          setCurrentTool('select');
          setMarqueeBox(null);
          logAction('Área destacada para movimentação', 'drawing');
        } else if (action === 'copy') {
          setActiveImage({
            id: 'copy-' + Date.now(),
            img,
            src: dataUrl,
            name: 'Cópia',
            x: x + 20,
            y: y + 20,
            width,
            height,
            originalWidth: width,
            originalHeight: height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            brightness: 100,
            contrast: 100,
            sepia: 0,
            grayscale: 0,
            invert: 0
          });
          setCurrentTool('select');
          setMarqueeBox(null);
          logAction('Área duplicada', 'drawing');
        }
      };
      img.src = dataUrl;
    }
  };

  // MOUSE & DRAWING HANDLERS
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCoordinates(e);
    startPos.current = pos;

    // 1. Floating image manipulation
    if (activeImage && currentTool === 'select') {
      const isInsideImage =
        pos.x >= activeImage.x &&
        pos.x <= activeImage.x + activeImage.width &&
        pos.y >= activeImage.y &&
        pos.y <= activeImage.y + activeImage.height;

      if (isInsideImage) {
        setDragHandle('move');
        dragStart.current = {
          mouseX: pos.x,
          mouseY: pos.y,
          initialImage: { ...activeImage }
        };
        return;
      }
    }

    // 2. Marquee Selection
    if (currentTool === 'marquee') {
      isDrawing.current = true;
      setMarqueeBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }

    // 3. Regular Drawing on Active Layer
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) {
      if (activeLayer?.locked) alert('Esta camada está bloqueada para edição.');
      return;
    }

    const layerCtx = activeLayer.canvas.getContext('2d');
    if (!layerCtx) return;

    isDrawing.current = true;
    snapshot.current = layerCtx.getImageData(0, 0, canvasWidth, canvasHeight);

    if (currentTool === 'brush' || currentTool === 'eraser') {
      layerCtx.beginPath();
      layerCtx.moveTo(pos.x, pos.y);
      layerCtx.lineCap = 'round';
      layerCtx.lineJoin = 'round';
      layerCtx.lineWidth = strokeWidth;

      if (currentTool === 'eraser') {
        layerCtx.globalCompositeOperation = 'destination-out';
      } else {
        layerCtx.globalCompositeOperation = 'source-over';
        layerCtx.strokeStyle = color;
      }
    } else if (currentTool === 'text') {
      const textToPlace = textInput.trim() || window.prompt('Texto para o mapa/camada:', 'Entrada');
      if (textToPlace) {
        layerCtx.font = `bold ${fontSize}px sans-serif`;
        layerCtx.fillStyle = color;
        layerCtx.fillText(textToPlace, pos.x, pos.y);
        composeCanvas();
        pushHistorySnapshot();
      }
      isDrawing.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentCoord = getCoordinates(e);

    // Active image dragging
    if (activeImage && dragHandle === 'move' && dragStart.current.initialImage) {
      const dx = currentCoord.x - dragStart.current.mouseX;
      const dy = currentCoord.y - dragStart.current.mouseY;
      setActiveImage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          x: dragStart.current.initialImage!.x + dx,
          y: dragStart.current.initialImage!.y + dy
        };
      });
      return;
    }

    // Marquee tool dragging
    if (isDrawing.current && currentTool === 'marquee') {
      const x = Math.min(startPos.current.x, currentCoord.x);
      const y = Math.min(startPos.current.y, currentCoord.y);
      const w = Math.abs(currentCoord.x - startPos.current.x);
      const h = Math.abs(currentCoord.y - startPos.current.y);
      setMarqueeBox({ x, y, width: w, height: h });
      return;
    }

    if (!isDrawing.current) return;
    const activeLayer = getActiveLayer();
    if (!activeLayer || activeLayer.locked) return;
    const layerCtx = activeLayer.canvas.getContext('2d');
    if (!layerCtx) return;

    if (currentTool === 'brush' || currentTool === 'eraser') {
      layerCtx.lineTo(currentCoord.x, currentCoord.y);
      layerCtx.stroke();
      composeCanvas();
    } else if (snapshot.current) {
      layerCtx.putImageData(snapshot.current, 0, 0);
      layerCtx.lineWidth = strokeWidth;
      layerCtx.strokeStyle = color;
      layerCtx.fillStyle = color;

      if (currentTool === 'line') {
        layerCtx.beginPath();
        layerCtx.moveTo(startPos.current.x, startPos.current.y);
        layerCtx.lineTo(currentCoord.x, currentCoord.y);
        layerCtx.stroke();
      } else if (currentTool === 'arrow') {
        const fromX = startPos.current.x;
        const fromY = startPos.current.y;
        const toX = currentCoord.x;
        const toY = currentCoord.y;
        const headlen = Math.max(12, strokeWidth * 3);
        const angle = Math.atan2(toY - fromY, toX - fromX);

        layerCtx.beginPath();
        layerCtx.moveTo(fromX, fromY);
        layerCtx.lineTo(toX, toY);
        layerCtx.stroke();

        layerCtx.beginPath();
        layerCtx.moveTo(toX, toY);
        layerCtx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        layerCtx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        layerCtx.closePath();
        layerCtx.fill();
      } else if (currentTool === 'rectangle') {
        const x = Math.min(startPos.current.x, currentCoord.x);
        const y = Math.min(startPos.current.y, currentCoord.y);
        const w = Math.abs(currentCoord.x - startPos.current.x);
        const h = Math.abs(currentCoord.y - startPos.current.y);
        if (fillShape) layerCtx.fillRect(x, y, w, h);
        else layerCtx.strokeRect(x, y, w, h);
      } else if (currentTool === 'circle') {
        const radiusX = Math.abs(currentCoord.x - startPos.current.x);
        const radiusY = Math.abs(currentCoord.y - startPos.current.y);
        layerCtx.beginPath();
        layerCtx.ellipse(startPos.current.x, startPos.current.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
        if (fillShape) layerCtx.fill();
        else layerCtx.stroke();
      }

      composeCanvas();
    }
  };

  const handleMouseUp = () => {
    if (dragHandle) {
      setDragHandle(null);
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      const activeLayer = getActiveLayer();
      if (activeLayer) {
        const ctx = activeLayer.canvas.getContext('2d');
        if (ctx) ctx.globalCompositeOperation = 'source-over';
      }
      composeCanvas();
      if (currentTool !== 'marquee') {
        pushHistorySnapshot();
      }
    }
  };

  // Render secondary overlay canvas (floating image handles, marquee box)
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Active floating image
    if (activeImage) {
      ctx.save();
      const cx = activeImage.x + activeImage.width / 2;
      const cy = activeImage.y + activeImage.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((activeImage.rotation * Math.PI) / 180);
      ctx.scale(activeImage.scaleX, activeImage.scaleY);
      ctx.globalAlpha = activeImage.opacity;
      ctx.filter = `brightness(${activeImage.brightness}%) contrast(${activeImage.contrast}%) sepia(${activeImage.sepia}%) grayscale(${activeImage.grayscale}%) invert(${activeImage.invert}%)`;

      if (activeImage.crop) {
        ctx.drawImage(
          activeImage.img,
          activeImage.crop.x,
          activeImage.crop.y,
          activeImage.crop.width,
          activeImage.crop.height,
          -activeImage.width / 2,
          -activeImage.height / 2,
          activeImage.width,
          activeImage.height
        );
      } else {
        ctx.drawImage(
          activeImage.img,
          -activeImage.width / 2,
          -activeImage.height / 2,
          activeImage.width,
          activeImage.height
        );
      }
      ctx.restore();

      // Draw bounding box
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(activeImage.x, activeImage.y, activeImage.width, activeImage.height);
      ctx.restore();
    }

    // Marquee Box
    if (marqueeBox && (marqueeBox.width > 2 || marqueeBox.height > 2)) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(marqueeBox.x, marqueeBox.y, marqueeBox.width, marqueeBox.height);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(marqueeBox.x, marqueeBox.y, marqueeBox.width, marqueeBox.height);
      ctx.restore();
    }
  }, [activeImage, marqueeBox]);

  // SEND TO DISCORD
  const handleSendToDiscord = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSendingDiscord(true);
    setDiscordFeedback({ status: 'idle' });

    try {
      const dataUrl = canvas.toDataURL('image/png');
      let res = await safeFetchJson<{ success: boolean; error?: string }>('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannelId || undefined,
          type: 'narrative',
          content: discordCaption.trim() || '🎨 Esboço de Cena enviado pelo Mestre',
          base64Image: dataUrl,
          attachmentName: 'desenho_mestre.png'
        })
      });

      if (!res.success) {
        res = await safeFetchJson<{ success: boolean; error?: string }>('/api/bot/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: selectedChannelId || undefined,
            type: 'narrative',
            content: discordCaption.trim() || '🎨 Esboço de Cena enviado pelo Mestre',
            base64Image: dataUrl,
            attachmentName: 'desenho_mestre.png'
          })
        });
      }

      if (res.success && res.data?.success) {
        logAction('Desenho enviado para o canal do Discord', 'drawing');
        setDiscordFeedback({ status: 'success', msg: 'Desenho transmitido com sucesso aos jogadores no Discord!' });
        setTimeout(() => {
          setIsDiscordModalOpen(false);
          setDiscordFeedback({ status: 'idle' });
        }, 2500);
      } else {
        setDiscordFeedback({ status: 'error', msg: res.data?.error || res.error || 'Falha ao enviar desenho.' });
      }
    } catch (err: any) {
      setDiscordFeedback({ status: 'error', msg: err?.message || 'Erro ao conectar ao Discord.' });
    } finally {
      setIsSendingDiscord(false);
    }
  };

  // DOWNLOAD CANVAS PNG
  const handleDownload = () => {
    if (activeImage) handleBakeActiveImage();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mapa-mestre-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    logAction('Download do desenho realizado', 'drawing');
  };

  // CLEAR ACTIVE LAYER OR ALL
  const handleClearActiveLayer = () => {
    const active = getActiveLayer();
    if (!active || active.locked) return;
    const ctx = active.canvas.getContext('2d');
    if (!ctx) return;

    if (active.id === 'layer-bg') {
      ctx.fillStyle = '#181a1f';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
    setActiveImage(null);
    setMarqueeBox(null);
    composeCanvas();
    pushHistorySnapshot();
    logAction(`Camada "${active.name}" limpa`, 'drawing');
  };

  const activeLayer = getActiveLayer();

  return (
    <div id="caranguejo-drawing-studio" className="space-y-4">
      {/* Primary Toolbar (All buttons styled in cohesive Dark Fantasy RPG Theme) */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Tools Selection */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#141619] p-1.5 rounded-xl border border-[#2D3139]">
          <button
            type="button"
            id="tool-btn-brush"
            onClick={() => setCurrentTool('brush')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'brush'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Pincel / Traço Livre"
          >
            <Paintbrush className="w-4 h-4" />
            <span>Pincel</span>
          </button>

          <button
            type="button"
            id="tool-btn-eraser"
            onClick={() => setCurrentTool('eraser')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'eraser'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Borracha"
          >
            <Eraser className="w-4 h-4" />
            <span>Borracha</span>
          </button>

          <button
            type="button"
            id="tool-btn-line"
            onClick={() => setCurrentTool('line')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'line'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Linha Reta"
          >
            <Minus className="w-4 h-4" />
            <span>Linha</span>
          </button>

          <button
            type="button"
            id="tool-btn-arrow"
            onClick={() => setCurrentTool('arrow')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'arrow'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Seta Direcional"
          >
            <Move className="w-4 h-4" />
            <span>Seta</span>
          </button>

          <button
            type="button"
            id="tool-btn-rectangle"
            onClick={() => setCurrentTool('rectangle')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'rectangle'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Retângulo"
          >
            <Square className="w-4 h-4" />
            <span>Retângulo</span>
          </button>

          <button
            type="button"
            id="tool-btn-circle"
            onClick={() => setCurrentTool('circle')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'circle'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Círculo"
          >
            <Circle className="w-4 h-4" />
            <span>Círculo</span>
          </button>

          <button
            type="button"
            id="tool-btn-text"
            onClick={() => setCurrentTool('text')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'text'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Inserir Texto"
          >
            <Type className="w-4 h-4" />
            <span>Texto</span>
          </button>

          {/* Marquee Selection / Cut Tool */}
          <button
            type="button"
            id="tool-btn-marquee"
            onClick={() => {
              setCurrentTool('marquee');
              setActiveImage(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'marquee'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Ferramenta de Seleção / Cortar Área do Canvas"
          >
            <Scissors className="w-4 h-4" />
            <span>Cortar / Seleção</span>
          </button>

          {/* Image Manipulate Tool */}
          <button
            type="button"
            id="tool-btn-manipulate"
            onClick={() => setCurrentTool('select')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTool === 'select'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
            }`}
            title="Manipular Imagem Flutuante (Mover, Esticar, Rotacionar)"
          >
            <Layers className="w-4 h-4" />
            <span>Manipular Imagem</span>
          </button>
        </div>

        {/* Middle: Color Palette & Thickness */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#141619] p-1.5 rounded-xl border border-[#2D3139]">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                  color.toLowerCase() === c.toLowerCase()
                    ? 'scale-125 border-white shadow-sm ring-2 ring-indigo-500/50'
                    : 'border-black/40 hover:scale-110'
                }`}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer ml-1"
              title="Cor Personalizada"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#141619] p-1.5 rounded-xl border border-[#2D3139]">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => setStrokeWidth(w)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                  strokeWidth === w
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-[#22262B]'
                }`}
                title={`Espessura ${w}px`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* + Imagem Button */}
          <button
            type="button"
            id="tool-btn-upload-image"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-sm active:scale-95"
            title="Carregar Imagem / Token / Mapa"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>+ Imagem</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) insertImageFile(f);
            }}
            accept="image/*"
            className="hidden"
          />

          {/* Limpar Camada Ativa */}
          <button
            type="button"
            onClick={handleClearActiveLayer}
            className="p-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-zinc-400 hover:text-rose-400 border border-[#3A3F4A] transition-all shadow-sm cursor-pointer"
            title="Limpar Camada Ativa"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Salvar Button */}
          <button
            type="button"
            id="tool-btn-save-png"
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95"
            title="Baixar Imagem Composta em PNG"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Salvar</span>
          </button>

          {/* Enviar ao Discord Button */}
          <button
            type="button"
            id="tool-btn-send-discord"
            onClick={() => setIsDiscordModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            title="Enviar Desenho das Camadas para o Discord dos Jogadores"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            <span>Enviar ao Discord</span>
          </button>
        </div>
      </div>

      {/* SISTEMA DE CAMADAS (LAYERS PANEL & CONTROLS) */}
      <div className="bg-[#181A1F] border border-[#2D3139] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282C34] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#141619] border border-[#2D3139] flex items-center justify-center text-indigo-400 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Sistema de Camadas da Mesa</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {layers.length} {layers.length === 1 ? 'Camada' : 'Camadas'}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Organize elementos visuais, tokens e desenhos. Use os controles para trazer para frente ou para trás.
              </p>
            </div>
          </div>

          {/* Quick Layer Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddLayer()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Criar nova camada de pintura"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>+ Nova Camada</span>
            </button>

            {/* Trazer para Frente (Move Up) */}
            <button
              type="button"
              onClick={() => handleMoveLayerUp(activeLayerId)}
              disabled={layers.findIndex(l => l.id === activeLayerId) >= layers.length - 1}
              className="px-3 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              title="Trazer Camada Selecionada para Frente (1 posição acima)"
            >
              <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trazer para Frente</span>
            </button>

            {/* Trazer para Trás (Move Down) */}
            <button
              type="button"
              onClick={() => handleMoveLayerDown(activeLayerId)}
              disabled={layers.findIndex(l => l.id === activeLayerId) <= 0}
              className="px-3 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              title="Trazer Camada Selecionada para Trás (1 posição abaixo)"
            >
              <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trazer para Trás</span>
            </button>

            {/* Topo / Fundo Direct Jumps */}
            <button
              type="button"
              onClick={() => handleMoveLayerToTop(activeLayerId)}
              disabled={layers.findIndex(l => l.id === activeLayerId) >= layers.length - 1}
              className="p-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-zinc-300 hover:text-white border border-[#3A3F4A] disabled:opacity-40 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              title="Trazer para o Topo Máximo"
            >
              <ChevronsUp className="w-4 h-4 text-indigo-400" />
            </button>

            <button
              type="button"
              onClick={() => handleMoveLayerToBottom(activeLayerId)}
              disabled={layers.findIndex(l => l.id === activeLayerId) <= 0}
              className="p-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-zinc-300 hover:text-white border border-[#3A3F4A] disabled:opacity-40 text-xs font-bold cursor-pointer transition-colors shadow-sm"
              title="Enviar para o Fundo Máximo"
            >
              <ChevronsDown className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Layer Stack Items Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {/* Render in reverse order so topmost visual layer is displayed first/on top */}
          {[...layers].reverse().map((layer, reverseIdx) => {
            const originalIdx = layers.findIndex(l => l.id === layer.id);
            const isSelected = layer.id === activeLayerId;

            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-600/10 border-indigo-500/80 shadow-md shadow-indigo-950/30 ring-1 ring-indigo-400/30'
                    : 'bg-[#141619] border-[#2D3139] hover:border-zinc-500 hover:bg-[#1A1D21]'
                }`}
              >
                {/* Layer Top row: Index, Name, Visibility & Lock */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 shrink-0">
                      #{originalIdx + 1}
                    </span>
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-300' : 'text-zinc-200'}`}>
                      {layer.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggleLayerVisible(layer.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        layer.visible ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title={layer.visible ? 'Ocultar camada' : 'Exibir camada'}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLayerLock(layer.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        layer.locked ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title={layer.locked ? 'Camada travada' : 'Travar camada contra edições'}
                    >
                      {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Layer Bottom row: Opacity Slider & Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#252932]" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] text-zinc-500 shrink-0">Opac:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => handleLayerOpacityChange(layer.id, parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono w-7 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicateLayer(layer.id)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      title="Duplicar Camada"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {layers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLayer(layer.id)}
                        className="p-1 rounded hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400"
                        title="Excluir Camada"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MARQUEE SELECTION ACTION BAR */}
      {marqueeBox && (marqueeBox.width > 5 || marqueeBox.height > 5) && (
        <div className="bg-[#181A1F] border border-[#2D3139] rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">
              Área Selecionada: {Math.round(marqueeBox.width)}x{Math.round(marqueeBox.height)} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCutCanvasMarquee('move')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
              title="Cortar área e transformar em imagem flutuante para mover e esticar"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Mover Seleção</span>
            </button>

            <button
              type="button"
              onClick={() => handleCutCanvasMarquee('copy')}
              className="px-3 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
              title="Duplicar área selecionada"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Duplicar</span>
            </button>

            <button
              type="button"
              onClick={() => handleCutCanvasMarquee('delete')}
              className="px-3 py-1.5 rounded-xl bg-[#22262B] hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-[#3A3F4A] text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
              title="Apagar pixels dentro da seleção"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Apagar Área</span>
            </button>

            <button
              type="button"
              onClick={() => setMarqueeBox(null)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              title="Cancelar Seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED IMAGE MANIPULATION CONTROLS (STRETCH, ROTATE, CUT, MOVE, FILTERS) */}
      {activeImage && (
        <div className="bg-[#181A1F] border border-[#2D3139] rounded-2xl p-4 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282C34] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#141619] border border-[#2D3139] flex items-center justify-center text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Controles de Imagem / Token:</span>
                  <span className="text-indigo-300 truncate max-w-xs">{activeImage.name}</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Arraste para mover na tela. Use os controles de esticar, corte, rotação e camadas abaixo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveImage(null)}
                className="px-3 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Descartar</span>
              </button>

              <button
                type="button"
                onClick={() => handleBakeActiveImage(true)}
                className="px-3 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Criar uma nova camada independente para esta imagem"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fixar como Nova Camada</span>
              </button>

              <button
                type="button"
                onClick={() => handleBakeActiveImage(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                title="Pintar permanentemente na camada ativa atual"
              >
                <Check className="w-4 h-4" />
                <span>Fixar na Camada Atual</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Mover & Posição */}
            <div className="bg-[#141619] p-3 rounded-xl border border-[#2D3139] space-y-2">
              <div className="flex items-center justify-between text-zinc-300 font-bold font-rpg">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Move className="w-3.5 h-3.5" />
                  Mover / Posição
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  X:{Math.round(activeImage.x)} Y:{Math.round(activeImage.y)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-rpg">
                <button
                  type="button"
                  onClick={() => {
                    setActiveImage(prev => prev ? ({
                      ...prev,
                      x: (canvasWidth - prev.width) / 2,
                      y: (canvasHeight - prev.height) / 2
                    }) : null);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-[#20242A] hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold"
                >
                  Centralizar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImage(prev => prev ? ({
                      ...prev,
                      x: 0,
                      y: 0,
                      width: canvasWidth,
                      height: canvasHeight
                    }) : null);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-[#20242A] hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold"
                >
                  Preencher Tela
                </button>
              </div>
            </div>

            {/* 2. Esticar / Dimensões */}
            <div className="bg-[#141619] p-3 rounded-xl border border-[#2D3139] space-y-2">
              <div className="flex items-center justify-between text-zinc-300 font-bold font-rpg">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Esticar / Dimensões
                </span>
                <button
                  type="button"
                  onClick={() => setIsLockAspectRatio(prev => !prev)}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {isLockAspectRatio ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                  <span>{isLockAspectRatio ? 'Travado' : 'Livre'}</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Largura:</span>
                  <span className="text-white font-mono">{Math.round(activeImage.width)}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max={canvasWidth * 1.5}
                  value={activeImage.width}
                  onChange={(e) => {
                    const newW = Number(e.target.value);
                    setActiveImage(prev => {
                      if (!prev) return null;
                      const ratio = prev.originalHeight / prev.originalWidth;
                      return {
                        ...prev,
                        width: newW,
                        height: isLockAspectRatio ? newW * ratio : prev.height
                      };
                    });
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#252932] rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Altura:</span>
                  <span className="text-white font-mono">{Math.round(activeImage.height)}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max={canvasHeight * 1.5}
                  value={activeImage.height}
                  onChange={(e) => {
                    const newH = Number(e.target.value);
                    setActiveImage(prev => {
                      if (!prev) return null;
                      const ratio = prev.originalWidth / prev.originalHeight;
                      return {
                        ...prev,
                        height: newH,
                        width: isLockAspectRatio ? newH * ratio : prev.width
                      };
                    });
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#252932] rounded-lg"
                />
              </div>
            </div>

            {/* 3. Girar & Opacidade */}
            <div className="bg-[#141619] p-3 rounded-xl border border-[#2D3139] space-y-2">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold font-rpg">
                <RotateCw className="w-3.5 h-3.5" />
                Manipular / Girar
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }) : null)}
                  className="flex-1 py-1 rounded bg-[#20242A] hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold"
                >
                  -90°
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, rotation: (prev.rotation + 90) % 360 }) : null)}
                  className="flex-1 py-1 rounded bg-[#20242A] hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold"
                >
                  +90°
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, scaleX: prev.scaleX * -1 }) : null)}
                  className="p-1 rounded bg-[#20242A] hover:bg-zinc-700 text-zinc-200"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, scaleY: prev.scaleY * -1 }) : null)}
                  className="p-1 rounded bg-[#20242A] hover:bg-zinc-700 text-zinc-200"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Opacidade:</span>
                  <span className="text-white font-mono">{Math.round(activeImage.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={activeImage.opacity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setActiveImage(prev => prev ? ({ ...prev, opacity: val }) : null);
                  }}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[#252932] rounded-lg"
                />
              </div>
            </div>

            {/* 4. Filtros RPG */}
            <div className="bg-[#141619] p-3 rounded-xl border border-[#2D3139] space-y-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-rpg">
                <Sparkles className="w-3.5 h-3.5" />
                Filtros Temáticos
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, sepia: 80, contrast: 120, brightness: 95, grayscale: 0, invert: 0 }) : null)}
                  className="px-2 py-1 rounded bg-[#20242A] hover:bg-amber-950/50 text-amber-300 text-[10px] font-bold"
                >
                  📜 Pergaminho
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, grayscale: 100, contrast: 130, brightness: 90, sepia: 0, invert: 0 }) : null)}
                  className="px-2 py-1 rounded bg-[#20242A] hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold"
                >
                  🌑 Grimdark
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, invert: 80, opacity: 0.65, contrast: 140 }) : null)}
                  className="px-2 py-1 rounded bg-[#20242A] hover:bg-indigo-950/50 text-indigo-300 text-[10px] font-bold"
                >
                  👻 Fantasma
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(prev => prev ? ({ ...prev, sepia: 0, grayscale: 0, invert: 0, contrast: 100, brightness: 100, opacity: 1 }) : null)}
                  className="px-2 py-1 rounded bg-[#20242A] hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold"
                >
                  Normal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANVAS STACK WORKSPACE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) insertImageFile(file);
        }}
        className={`relative bg-[#121417] border rounded-2xl p-3 flex flex-col items-center justify-center overflow-auto shadow-inner transition-colors min-h-[500px] ${
          isDragOver ? 'border-amber-500 bg-amber-950/20' : 'border-[#2D3139]'
        }`}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none z-30">
            <div className="bg-[#1A1D21] border border-amber-500 text-amber-300 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl font-rpg">
              <Upload className="w-6 h-6 animate-bounce" />
              <span className="text-sm font-bold">Solte a imagem para carregar no estúdio de desenho!</span>
            </div>
          </div>
        )}

        <div className="relative overflow-auto max-w-full max-h-[75vh] rounded-xl border border-[#2D3139] shadow-2xl">
          {/* Main composited canvas */}
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="block bg-[#181a1f]"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {/* Interactive overlay canvas for selection and image controls */}
          <canvas
            ref={overlayCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`absolute inset-0 z-10 ${
              currentTool === 'select'
                ? 'cursor-move'
                : currentTool === 'marquee'
                ? 'cursor-crosshair'
                : 'cursor-crosshair'
            }`}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Canvas Info Bar */}
        <div className="w-full flex flex-wrap items-center justify-between pt-2 px-2 text-[11px] text-[#9E9E9E] gap-2 font-rpg">
          <span>
            Resolução: {canvasWidth}x{canvasHeight} px • Ferramenta: <strong className="text-amber-400 capitalize">{currentTool}</strong>
            {activeLayer && (
              <span className="ml-2 text-zinc-300">
                • Camada Ativa: <strong className="text-amber-300">{activeLayer.name}</strong> {activeLayer.locked ? '(Travada)' : ''}
              </span>
            )}
          </span>
          <span className="text-zinc-500">
            Arraste imagens na tela para manipular. O desenho é mantido automaticamente ao alternar entre abas.
          </span>
        </div>
      </div>

      {/* Discord Broadcast Modal */}
      {isDiscordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Transmitir Desenho ao Discord
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscordModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {discordFeedback.status === 'success' ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold">{discordFeedback.msg}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {discordFeedback.status === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{discordFeedback.msg}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Canal do Discord
                  </label>
                  <select
                    value={selectedChannelId}
                    onChange={(e) => setSelectedChannelId(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500"
                  >
                    {channels.length > 0 ? (
                      channels.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.type === 'voice' ? '🎙️ ' : '# '}{c.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Canal Padrão do Servidor</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Legenda / Mensagem
                  </label>
                  <input
                    type="text"
                    value={discordCaption}
                    onChange={(e) => setDiscordCaption(e.target.value)}
                    placeholder="Ex: Mapa da masmorra revelado..."
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3139]">
                  <button
                    type="button"
                    onClick={() => setIsDiscordModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer hover:bg-[#22262B] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendToDiscord}
                    disabled={isSendingDiscord}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingDiscord ? 'Transmitindo...' : 'Enviar Agora'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
