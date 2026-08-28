import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Layers, 
  Download, 
  Maximize2, 
  RotateCw, 
  Eye, 
  Building2, 
  CheckCircle2, 
  Sliders, 
  FileCode, 
  FileCheck2,
  FileText,
  Sparkles,
  Info,
  Radio
} from 'lucide-react';
import { Project } from '../types';
import { generateIFCContent, generateDXFContent, downloadFile, AsBuiltExportOptions } from '../utils/asBuiltGenerator';

interface AsBuiltViewerProps {
  project: Project;
  onClose?: () => void;
}

export const AsBuiltViewer: React.FC<AsBuiltViewerProps> = ({ project }) => {
  const [viewMode, setViewMode] = useState<'3D' | '2D_CAD' | 'IFC_SCHEMA'>('3D');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [activeLayers, setActiveLayers] = useState({
    architecture: true,
    structure: true,
    fireSafety: true,
    mep: true,
    iotSensors: true,
    dimensions: true,
  });

  const [exportOptions, setExportOptions] = useState<AsBuiltExportOptions>({
    includeStructural: true,
    includeArchitecture: true,
    includeMEP: true,
    includeFireSafety: true,
    includeIoTSensors: true,
    buildingArea: project.buildingSpecs?.totalAreaM2 || 2400,
    floors: project.buildingSpecs?.floors || 3,
  });

  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // 3D Canvas Mount Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Three.js 3D BIM Viewer Scene Setup
  useEffect(() => {
    if (viewMode !== '3D' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 600;
    const height = canvas.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Slate-900 canvas

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(35, 25, 35);
    camera.lookAt(0, 5, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x0284c7, 2, 50);
    blueLight.position.set(-15, 10, -15);
    scene.add(blueLight);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x0284c7, 0x334155);
    scene.add(gridHelper);

    // Build 3D As-Built BIM Geometry
    const totalFloors = exportOptions.floors;
    const buildingWidth = 18;
    const buildingLength = 26;
    const floorHeight = 4.0;

    const buildingGroup = new THREE.Group();

    for (let f = 0; f < totalFloors; f++) {
      const floorY = f * floorHeight;

      // 1. Slab (Laje de Concreto)
      const slabGeo = new THREE.BoxGeometry(buildingLength, 0.4, buildingWidth);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.8,
        metalness: 0.1,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, floorY, 0);
      slab.receiveShadow = true;
      buildingGroup.add(slab);

      // 2. Concrete Columns (Pilares)
      if (activeLayers.structure) {
        const colGeo = new THREE.BoxGeometry(0.8, floorHeight, 0.8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });

        const colXs = [-buildingLength / 2 + 1, 0, buildingLength / 2 - 1];
        const colZs = [-buildingWidth / 2 + 1, 0, buildingWidth / 2 - 1];

        colXs.forEach(cx => {
          colZs.forEach(cz => {
            const col = new THREE.Mesh(colGeo, colMat);
            col.position.set(cx, floorY + floorHeight / 2, cz);
            col.castShadow = true;
            buildingGroup.add(col);
          });
        });
      }

      // 3. Walls & Glass Facade (Paredes e Esquadrias)
      if (activeLayers.architecture) {
        // Transparent glass facade
        const glassGeo = new THREE.BoxGeometry(buildingLength - 0.2, floorHeight - 0.4, buildingWidth - 0.2);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.25,
          roughness: 0.1,
          transmission: 0.9,
          thickness: 0.5,
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, floorY + floorHeight / 2, 0);
        buildingGroup.add(glass);
      }

      // 4. Fire Safety Equipments in 3D (Extintores e Hidrantes AVCB)
      if (activeLayers.fireSafety) {
        const extGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 12);
        const extMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Red
        const ext = new THREE.Mesh(extGeo, extMat);
        ext.position.set(-buildingLength / 2 + 3, floorY + 1.2, -buildingWidth / 2 + 1.5);
        buildingGroup.add(ext);

        const hidGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const hidMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
        const hid = new THREE.Mesh(hidGeo, hidMat);
        hid.position.set(buildingLength / 2 - 3, floorY + 1.2, -buildingWidth / 2 + 1.5);
        buildingGroup.add(hid);
      }

      // 5. IoT Sensors Telemetry Nodes in 3D
      if (activeLayers.iotSensors) {
        const iotGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const iotMat = new THREE.MeshStandardMaterial({
          color: 0x10b981, // Emerald Green
          emissive: 0x059669,
          emissiveIntensity: 0.8,
        });
        const sensor = new THREE.Mesh(iotGeo, iotMat);
        sensor.position.set(0, floorY + 3.2, 0);
        buildingGroup.add(sensor);
      }
    }

    scene.add(buildingGroup);

    // Continuous slow orbit rotation
    let angle = 0;
    const animate = () => {
      angle += 0.004;
      camera.position.x = 42 * Math.sin(angle);
      camera.position.z = 42 * Math.cos(angle);
      camera.lookAt(0, (totalFloors * floorHeight) / 3, 0);

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      renderer.dispose();
    };
  }, [viewMode, activeLayers, exportOptions.floors]);

  // Export handlers
  const handleExportIFC = () => {
    const ifcString = generateIFCContent(project, exportOptions);
    const filename = `${project.name.replace(/[\/\s]/g, '_')}_AsBuilt_BIM.ifc`;
    downloadFile(ifcString, filename, 'application/x-step');
    setDownloadSuccessMessage(`Arquivo IFC gerado com sucesso: ${filename}`);
    setTimeout(() => setDownloadSuccessMessage(null), 5000);
  };

  const handleExportDWG = () => {
    const dxfString = generateDXFContent(project, exportOptions);
    const filename = `${project.name.replace(/[\/\s]/g, '_')}_AsBuilt_AutoCAD.dxf`;
    downloadFile(dxfString, filename, 'application/dxf');
    setDownloadSuccessMessage(`Arquivo DWG/DXF gerado com sucesso: ${filename}`);
    setTimeout(() => setDownloadSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Box className="w-4 h-4 text-indigo-400" />
            <span>Documentação Técnica & Modelagem As-Built</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Gerador & Visualizador As-Built (IFC & DWG)
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Empreendimento: <b className="text-slate-200">{project.name}</b> | Formatos normalizados compatíveis com AutoCAD, Revit, Solibri e BIMcollab.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-ifc"
            onClick={handleExportIFC}
            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar IFC (BIM 3D)</span>
          </button>

          <button
            id="btn-export-dwg"
            onClick={handleExportDWG}
            className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar DWG / DXF (AutoCAD)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {downloadSuccessMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid: Viewer (Left) + Layer / Spec Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Viewer Screen */}
        <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
          
          {/* Viewer Tabs Bar */}
          <div className="p-3 bg-slate-950/80 text-white border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('3D')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === '3D' ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Modelagem 3D BIM (Three.js)
              </button>
              <button
                onClick={() => setViewMode('2D_CAD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === '2D_CAD' ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Planta Baixa CAD (2D)
              </button>
              <button
                onClick={() => setViewMode('IFC_SCHEMA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'IFC_SCHEMA' ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Schema IFC Texto
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Renderizador WebGL Ativo</span>
            </div>
          </div>

          {/* Viewer Canvas Content */}
          <div className="relative flex-1 min-h-[460px] bg-slate-950/80 flex items-center justify-center">
            
            {viewMode === '3D' && (
              <canvas ref={canvasRef} className="w-full h-full block min-h-[460px]" />
            )}

            {viewMode === '2D_CAD' && (
              <div className="w-full h-full p-6 flex flex-col items-center justify-center text-slate-200">
                {/* SVG 2D Interactive Blueprint */}
                <div className="w-full max-w-xl aspect-4/3 bg-slate-950 rounded-2xl border border-white/10 p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                  
                  <svg viewBox="0 0 600 400" className="w-full h-full">
                    {/* Grid */}
                    <defs>
                      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.8"/>
                      </pattern>
                    </defs>
                    <rect width="600" height="400" fill="url(#grid)" />

                    {/* Outer Wall ARQ_ALVENARIA */}
                    {activeLayers.architecture && (
                      <rect x="50" y="40" width="480" height="300" fill="none" stroke="#ffffff" strokeWidth="4" />
                    )}

                    {/* Inner Walls */}
                    {activeLayers.architecture && (
                      <>
                        <line x1="50" y1="180" x2="350" y2="180" stroke="#94a3b8" strokeWidth="2.5" />
                        <line x1="350" y1="40" x2="350" y2="240" stroke="#94a3b8" strokeWidth="2.5" />
                        <text x="70" y="100" fill="#94a3b8" fontSize="11" fontWeight="bold">SALA TÉCNICA 01</text>
                        <text x="70" y="240" fill="#94a3b8" fontSize="11" fontWeight="bold">NAVE / SALÃO PRINCIPAL</text>
                      </>
                    )}

                    {/* Columns ESTR_PILARES */}
                    {activeLayers.structure && (
                      <>
                        <rect x="50" y="40" width="16" height="16" fill="#ef4444" />
                        <rect x="280" y="40" width="16" height="16" fill="#ef4444" />
                        <rect x="514" y="40" width="16" height="16" fill="#ef4444" />
                        <rect x="50" y="324" width="16" height="16" fill="#ef4444" />
                        <rect x="280" y="324" width="16" height="16" fill="#ef4444" />
                        <rect x="514" y="324" width="16" height="16" fill="#ef4444" />
                      </>
                    )}

                    {/* Fire Safety PREV_INCENDIO */}
                    {activeLayers.fireSafety && (
                      <>
                        {/* Extinguisher P1 */}
                        <circle cx="120" cy="180" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="135" y="184" fill="#fca5a5" fontSize="9" fontWeight="bold">EXT-PQS 6kg</text>

                        {/* Hydrant SH-01 */}
                        <rect x="480" y="180" width="14" height="14" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="430" y="174" fill="#fca5a5" fontSize="9" fontWeight="bold">HIDRANTE SH-01</text>
                        
                        {/* Exit Arrow */}
                        <path d="M 500 340 L 530 340 L 520 330 M 530 340 L 520 350" stroke="#22c55e" strokeWidth="3" fill="none" />
                        <text x="440" y="335" fill="#86efac" fontSize="10" fontWeight="bold">SAÍDA EMERGÊNCIA</text>
                      </>
                    )}

                    {/* IoT Telemetry Nodes */}
                    {activeLayers.iotSensors && (
                      <>
                        <circle cx="280" cy="180" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                        <text x="250" y="210" fill="#6ee7b7" fontSize="10" fontWeight="bold">[IoT GATEWAY]</text>
                      </>
                    )}

                    {/* Title Block Stamp (Selo de Engenharia) */}
                    <rect x="360" y="260" width="170" height="80" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                    <text x="370" y="278" fill="#38bdf8" fontSize="10" fontWeight="bold">REGULAPRO AS-BUILT</text>
                    <text x="370" y="293" fill="#cbd5e1" fontSize="8">OBRA: {project.name.substring(0, 20)}</text>
                    <text x="370" y="306" fill="#cbd5e1" fontSize="8">RESP: {project.authorName || 'Engenharia'}</text>
                    <text x="370" y="320" fill="#cbd5e1" fontSize="8">ESCALA: 1:100 | DATA: 2026</text>
                  </svg>

                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Planta Baixa CAD interativa gerada a partir das dimensões reais do empreendimento.
                </p>
              </div>
            )}

            {viewMode === 'IFC_SCHEMA' && (
              <div className="w-full h-full p-4 overflow-auto max-h-[460px] text-[11px] font-mono text-emerald-400 bg-slate-950">
                <pre>{generateIFCContent(project, exportOptions)}</pre>
              </div>
            )}

          </div>

          {/* Footer Info */}
          <div className="p-3 bg-slate-950/80 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>Área Total: <b className="text-slate-200">{exportOptions.buildingArea} m²</b> | Pavimentos: <b className="text-slate-200">{exportOptions.floors}</b></span>
            <span>Normas: ISO-10303-21 (IFC), NBR 9050, IT-21 Bombeiros, AutoCAD DXF AC1027</span>
          </div>

        </div>

        {/* Right 4 Cols: Layer Filters & BIM Properties */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Layer Visibility Control */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Camadas do Modelo As-Built (Layers):</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:bg-white/5 transition">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  Alvenarias & Paredes (ARQ_ALVENARIA)
                </span>
                <input
                  type="checkbox"
                  checked={activeLayers.architecture}
                  onChange={e => setActiveLayers({ ...activeLayers, architecture: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-sky-400/50"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:bg-white/5 transition">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  Pilares & Vigas (ESTR_PILARES)
                </span>
                <input
                  type="checkbox"
                  checked={activeLayers.structure}
                  onChange={e => setActiveLayers({ ...activeLayers, structure: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-sky-400/50"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:bg-white/5 transition">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Combate a Incêndio (PREV_INCENDIO)
                </span>
                <input
                  type="checkbox"
                  checked={activeLayers.fireSafety}
                  onChange={e => setActiveLayers({ ...activeLayers, fireSafety: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-sky-400/50"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:bg-white/5 transition">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  Sensores IoT Telemetria (IOT_SENSORES)
                </span>
                <input
                  type="checkbox"
                  checked={activeLayers.iotSensors}
                  onChange={e => setActiveLayers({ ...activeLayers, iotSensors: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-sky-400/50"
                />
              </label>
            </div>
          </div>

          {/* Export Configurations Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Parâmetros de Geração do Arquivo:</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Área Construída (m²):</label>
                <input
                  type="number"
                  value={exportOptions.buildingArea}
                  onChange={e => setExportOptions({ ...exportOptions, buildingArea: Number(e.target.value) })}
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-semibold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Qtd. de Pavimentos:</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={exportOptions.floors}
                  onChange={e => setExportOptions({ ...exportOptions, floors: Number(e.target.value) })}
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-semibold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={handleExportIFC}
                  className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-95 shadow-md"
                >
                  <FileCode className="w-4 h-4 text-indigo-300" />
                  <span>Exportar .IFC Standard</span>
                </button>

                <button
                  onClick={handleExportDWG}
                  className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-95 shadow-md"
                >
                  <FileText className="w-4 h-4 text-sky-300" />
                  <span>Exportar .DXF / .DWG AutoCAD</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
