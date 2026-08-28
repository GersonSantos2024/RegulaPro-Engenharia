import React, { useState } from 'react';
import { 
  Radio, 
  Thermometer, 
  Wind, 
  Volume2, 
  Activity, 
  Zap, 
  Flame, 
  Droplets, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Sliders, 
  Clock,
  Sparkles,
  Building
} from 'lucide-react';
import { IoTDevice, Project } from '../types';

interface IoTMonitoringViewProps {
  devices: IoTDevice[];
  projects: Project[];
  onAddDevice: (device: IoTDevice) => void;
  onUpdateDeviceThreshold: (id: string, min: number, max: number) => void;
  onRefreshTelemetry: () => void;
}

export const IoTMonitoringView: React.FC<IoTMonitoringViewProps> = ({
  devices,
  projects,
  onAddDevice,
  onUpdateDeviceThreshold,
  onRefreshTelemetry,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('TODOS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [calibratingDeviceId, setCalibratingDeviceId] = useState<string | null>(null);

  // New device form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<IoTDevice['type']>('TEMPERATURE');
  const [newLocation, setNewLocation] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || 'proj-101');
  const [newMin, setNewMin] = useState(15);
  const [newMax, setNewMax] = useState(35);

  const [calibMin, setCalibMin] = useState(0);
  const [calibMax, setCalibMax] = useState(100);

  const filteredDevices = devices.filter(d => {
    if (selectedProjectId !== 'TODOS' && d.projectId !== selectedProjectId) return false;
    return true;
  });

  const getDeviceIcon = (type: IoTDevice['type']) => {
    switch (type) {
      case 'TEMPERATURE':
        return <Thermometer className="w-5 h-5 text-sky-500" />;
      case 'AIR_QUALITY':
        return <Wind className="w-5 h-5 text-emerald-500" />;
      case 'NOISE':
        return <Volume2 className="w-5 h-5 text-indigo-500" />;
      case 'VIBRATION':
        return <Activity className="w-5 h-5 text-amber-500" />;
      case 'ENERGY':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'SMOKE':
        return <Flame className="w-5 h-5 text-rose-500" />;
      case 'WATER':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      default:
        return <Radio className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let unit = '°C';
    if (newType === 'AIR_QUALITY') unit = 'µg/m³';
    else if (newType === 'NOISE') unit = 'dB(A)';
    else if (newType === 'VIBRATION') unit = 'mm/s';
    else if (newType === 'ENERGY') unit = 'kW/h';
    else if (newType === 'SMOKE') unit = 'PPM';
    else if (newType === 'WATER') unit = 'm³';

    const newDevice: IoTDevice = {
      id: `iot-${Date.now()}`,
      projectId: newProjectId,
      name: newName.trim(),
      type: newType,
      unit,
      currentValue: (newMin + newMax) / 2,
      minThreshold: Number(newMin),
      maxThreshold: Number(newMax),
      status: 'ONLINE',
      lastPing: 'Agora',
      location: newLocation.trim() || 'Canteiro de Obras',
      history: [
        { time: '10:00', value: (newMin + newMax) / 2 },
        { time: '11:00', value: (newMin + newMax) / 2 + 0.5 },
        { time: '12:00', value: (newMin + newMax) / 2 }
      ]
    };

    onAddDevice(newDevice);
    setShowAddModal(false);
    setNewName('');
    setNewLocation('');
  };

  const handleSaveCalibration = (deviceId: string) => {
    onUpdateDeviceThreshold(deviceId, Number(calibMin), Number(calibMax));
    setCalibratingDeviceId(null);
  };

  const alertCount = devices.filter(d => d.status === 'ALERT').length;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Telemetria & Sensoriamento no Canteiro de Obras</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
            Integração com Dispositivos IoT em Tempo Real
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Monitoramento de conforto ambiental, qualidade do ar, ruído NBR 10151, vibração e segurança contra incêndio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRefreshTelemetry}
            className="bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Atualizar leituras de telemetria"
          >
            <RefreshCw className="w-4 h-4 text-sky-400" />
            <span>Forçar Leitura</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Conectar Dispositivo IoT</span>
          </button>
        </div>
      </div>

      {/* Filter & Telemetry Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Project Filter */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-center">
          <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-sky-400" />
            <span>Filtrar por Empreendimento:</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 text-slate-100 rounded-xl p-2 text-xs font-bold focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
          >
            <option value="TODOS" className="bg-slate-900 text-slate-100">Todos os Empreendimentos ({devices.length} nós)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">{p.name}</option>
            ))}
          </select>
        </div>

        {/* Online Nodes */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Sensores Online</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">
            {devices.filter(d => d.status === 'ONLINE').length} / {devices.length}
          </p>
          <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
            Gateway MQTT / LoRaWAN Conectado
          </p>
        </div>

        {/* Critical Alerts */}
        <div className={`bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border shadow-xl relative overflow-hidden group transition ${
          alertCount > 0 ? 'border-rose-500/40 bg-rose-950/20' : 'border-white/10'
        }`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Alertas de Limite</span>
            <AlertTriangle className={`w-4 h-4 ${alertCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-1 ${alertCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {alertCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {alertCount > 0 ? 'Valores fora dos parâmetros' : 'Todos os nós normais'}
          </p>
        </div>

        {/* Protocol Standard */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Taxa de Amostragem</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white mt-1">
            10 Segundos
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Transmissão contínua em tempo real
          </p>
        </div>

      </div>

      {/* IoT Nodes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDevices.map(device => {
          const isAlert = device.currentValue > device.maxThreshold || device.currentValue < device.minThreshold;
          const proj = projects.find(p => p.id === device.projectId);

          // Calibrate percent for gauge
          const range = device.maxThreshold - device.minThreshold || 10;
          const currentPct = Math.min(100, Math.max(0, Math.round(((device.currentValue - device.minThreshold) / range) * 100)));

          return (
            <div
              key={device.id}
              className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl border shadow-xl p-5 space-y-4 transition hover:border-white/20 ${
                isAlert ? 'border-rose-500/40 bg-rose-950/20 ring-1 ring-rose-500/30' : 'border-white/10'
              }`}
            >
              {/* Device Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">
                      {device.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{device.location}</span>
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  isAlert
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
                  {isAlert ? 'ALERTA' : 'NORMAL'}
                </span>
              </div>

              {/* Big Value Reading Gauge */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {device.currentValue.toFixed(1)}{' '}
                    <span className="text-sm font-bold text-slate-400">{device.unit}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Faixa Segura: {device.minThreshold} ~ {device.maxThreshold} {device.unit}
                  </span>
                </div>

                {/* Progress Bar of Value */}
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isAlert ? 'bg-rose-500 shadow-sm' : 'bg-emerald-400 shadow-sm'
                    }`}
                    style={{ width: `${currentPct}%` }}
                  />
                </div>
              </div>

              {/* Sparkline / History timeline */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Histórico Recente (Leituras por Hora):
                </span>
                <div className="flex items-end gap-1.5 h-10 pt-2">
                  {device.history.map((h, i) => {
                    const hPct = Math.min(100, Math.max(15, Math.round(((h.value - device.minThreshold) / range) * 100)));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                        <div
                          className="w-full bg-sky-500/30 hover:bg-sky-400 rounded-t transition border-t border-sky-400/50"
                          style={{ height: `${hPct}%` }}
                          title={`${h.time}: ${h.value} ${device.unit}`}
                        />
                        <span className="text-[9px] text-slate-500">{h.time.split(':')[0]}h</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project & Calibration Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[170px]" title={proj?.name}>
                  <b className="text-slate-300">Obra:</b> {proj?.name || 'Empreendimento'}
                </span>

                <button
                  onClick={() => {
                    setCalibratingDeviceId(calibratingDeviceId === device.id ? null : device.id);
                    setCalibMin(device.minThreshold);
                    setCalibMax(device.maxThreshold);
                  }}
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  Calibrar
                </button>
              </div>

              {/* Calibration Form */}
              {calibratingDeviceId === device.id && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2 text-xs">
                  <p className="font-bold text-slate-200">Definir Limites de Segurança ({device.unit}):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block">Mínimo:</label>
                      <input
                        type="number"
                        value={calibMin}
                        onChange={e => setCalibMin(Number(e.target.value))}
                        className="w-full bg-slate-950/80 border border-white/10 p-1.5 rounded-lg font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block">Máximo:</label>
                      <input
                        type="number"
                        value={calibMax}
                        onChange={e => setCalibMax(Number(e.target.value))}
                        className="w-full bg-slate-950/80 border border-white/10 p-1.5 rounded-lg font-bold text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveCalibration(device.id)}
                    className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 font-bold py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Salvar Limites
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 backdrop-blur-2xl w-full max-w-md rounded-2xl shadow-2xl border border-white/10 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>Conectar Novo Dispositivo / Sensor IoT</span>
            </h3>

            <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome do Sensor / Gateway *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Sensor de Poeira Canteiro Leste"
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-semibold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Grandeza Telemetrada *</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as IoTDevice['type'])}
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-bold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                >
                  <option value="TEMPERATURE" className="bg-slate-900 text-white">Temperatura & Umidade (°C)</option>
                  <option value="AIR_QUALITY" className="bg-slate-900 text-white">Qualidade do Ar / Poeira (PM2.5 µg/m³)</option>
                  <option value="NOISE" className="bg-slate-900 text-white">Ruído e Decibéis (NBR 10151 - dB(A))</option>
                  <option value="VIBRATION" className="bg-slate-900 text-white">Vibração e Estabilidade Estrutural (mm/s)</option>
                  <option value="ENERGY" className="bg-slate-900 text-white">Consumo de Energia Elétrica (kW/h)</option>
                  <option value="SMOKE" className="bg-slate-900 text-white">Detector de Fumaça / Gás (PPM)</option>
                  <option value="WATER" className="bg-slate-900 text-white">Hidrômetro Digital / Consumo de Água (m³)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Empreendimento Associado *</label>
                <select
                  value={newProjectId}
                  onChange={e => setNewProjectId(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-semibold text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Localização Física no Canteiro</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="Ex: Canteiro de Obras - Lado Leste"
                  className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl text-white focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Limite Mínimo</label>
                  <input
                    type="number"
                    value={newMin}
                    onChange={e => setNewMin(Number(e.target.value))}
                    className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Limite Máximo</label>
                  <input
                    type="number"
                    value={newMax}
                    onChange={e => setNewMax(Number(e.target.value))}
                    className="w-full bg-slate-950/60 border border-white/10 p-2 rounded-xl font-bold text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold rounded-xl transition cursor-pointer"
                >
                  Conectar Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
