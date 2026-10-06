import React, { useState, useEffect } from 'react';
import {
  Code,
  BookOpen,
  Sparkles,
  Layers,
  Sliders,
  Check,
  AlertCircle,
  Play,
  Save,
  Trash2,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CandlestickBar } from '../../../shared/src/types.ts';
import {
  CustomIndicatorDefinition,
  CustomIndicatorEngine,
  BUILT_IN_CUSTOM_PRESETS,
  IndicatorPane,
  IndicatorPlotType,
  CustomIndicatorParam,
} from '../utils/customIndicatorEngine.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

interface CustomIndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bars: CandlestickBar[];
  onApplyIndicator: (indicator: CustomIndicatorDefinition) => void;
  activeIndicators: CustomIndicatorDefinition[];
  onToggleIndicator: (id: string) => void;
  onUpdateIndicatorsList: (indicators: CustomIndicatorDefinition[]) => void;
  editingIndicatorId?: string | null;
}

const COLOR_PRESETS = [
  { name: 'Tiffany Cyan', hex: '#0abab5' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Gold/Amber', hex: '#fbbf24' },
  { name: 'Purple', hex: '#c084fc' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Magenta Pink', hex: '#ec4899' },
  { name: 'Lime Neon', hex: '#84cc16' },
];

export const CustomIndicatorModal: React.FC<CustomIndicatorModalProps> = ({
  isOpen,
  onClose,
  bars,
  onApplyIndicator,
  activeIndicators,
  onToggleIndicator,
  onUpdateIndicatorsList,
  editingIndicatorId,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'EDITOR' | 'MY_LIBRARY' | 'DOCS'>('TEMPLATES');
  const [savedIndicators, setSavedIndicators] = useState<CustomIndicatorDefinition[]>([]);

  // Editor State
  const [currentId, setCurrentId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [shortName, setShortName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pane, setPane] = useState<IndicatorPane>('OVERLAY');
  const [plotType, setPlotType] = useState<IndicatorPlotType>('LINE');
  const [color, setColor] = useState<string>('#0abab5');
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [code, setCode] = useState<string>('');
  const [params, setParams] = useState<CustomIndicatorParam[]>([]);
  const [isBuiltIn, setIsBuiltIn] = useState<boolean>(false);

  // Validation Test Result State
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    dataPointsCount: number;
    minVal: number | null;
    maxVal: number | null;
    sampleValues: (number | null)[];
    error?: string;
  }>({
    tested: false,
    success: false,
    dataPointsCount: 0,
    minVal: null,
    maxVal: null,
    sampleValues: [],
  });

  // Load Saved Indicators from LocalStorage
  const refreshLibrary = () => {
    const loaded = CustomIndicatorEngine.loadSavedIndicators();
    setSavedIndicators(loaded);
    return loaded;
  };

  useEffect(() => {
    if (isOpen) {
      const list = refreshLibrary();
      if (editingIndicatorId) {
        const target = list.find(item => item.id === editingIndicatorId);
        if (target) {
          loadIntoEditor(target);
          setActiveTab('EDITOR');
        }
      }
    }
  }, [isOpen, editingIndicatorId]);

  const loadIntoEditor = (def: CustomIndicatorDefinition) => {
    setCurrentId(def.id);
    setName(def.name);
    setShortName(def.shortName);
    setDescription(def.description);
    setPane(def.pane);
    setPlotType(def.plotType);
    setColor(def.color);
    setLineWidth(def.lineWidth || 2);
    setCode(def.formulaOrCode);
    setParams(def.params ? JSON.parse(JSON.stringify(def.params)) : []);
    setIsBuiltIn(!!def.isBuiltInPreset);
    setTestResult({ tested: false, success: false, dataPointsCount: 0, minVal: null, maxVal: null, sampleValues: [] });
  };

  const handleSelectPreset = (preset: CustomIndicatorDefinition) => {
    loadIntoEditor(preset);
    setActiveTab('EDITOR');
  };

  const handleCreateNew = () => {
    const newId = 'custom_' + Date.now();
    setCurrentId(newId);
    setName('My Custom Indicator');
    setShortName('MY_IND(14)');
    setDescription('Custom indicator written in Pine/JavaScript sandbox');
    setPane('OVERLAY');
    setPlotType('LINE');
    setColor('#0abab5');
    setLineWidth(2);
    setIsBuiltIn(false);
    setParams([{ id: 'length', name: 'Length', type: 'number', defaultValue: 14, value: 14, min: 1, max: 100 }]);
    setCode(`// Custom TradingView-Style Indicator
// bars: [{ timestamp, open, high, low, close, volume }]
// params: { length: 14 }
// indicators: { sma, ema, rsi, atr, vwap, highest, lowest }
function calculate(bars, params, indicators) {
  const len = params.length || 14;
  const ema = indicators.ema(bars, len);
  
  return bars.map((bar, i) => {
    if (ema[i] === null) return null;
    return parseFloat(ema[i].toFixed(4));
  });
}`);
    setTestResult({ tested: false, success: false, dataPointsCount: 0, minVal: null, maxVal: null, sampleValues: [] });
    setActiveTab('EDITOR');
  };

  // Run Real-Time Validation
  const handleTestScript = () => {
    const tempDef: CustomIndicatorDefinition = {
      id: currentId || 'temp_test',
      name: name || 'Test Indicator',
      shortName: shortName || 'TEST',
      description: description || '',
      pane,
      plotType,
      color,
      lineWidth,
      enabled: true,
      codeType: 'JAVASCRIPT',
      formulaOrCode: code,
      params,
      createdAt: new Date().toISOString(),
    };

    const res = CustomIndicatorEngine.executeIndicator(tempDef, bars);
    if (res.success && res.data) {
      let min: number | null = null;
      let max: number | null = null;
      const validPoints: number[] = [];
      res.data.forEach(v => {
        if (v !== null && typeof v === 'number' && !isNaN(v)) {
          validPoints.push(v);
          if (min === null || v < min) min = v;
          if (max === null || v > max) max = v;
        }
      });

      const sample = res.data.slice(-5);
      setTestResult({
        tested: true,
        success: true,
        dataPointsCount: validPoints.length,
        minVal: min,
        maxVal: max,
        sampleValues: sample,
      });
    } else {
      setTestResult({
        tested: true,
        success: false,
        dataPointsCount: 0,
        minVal: null,
        maxVal: null,
        sampleValues: [],
        error: res.error || 'Execution failed',
      });
    }
  };

  // Save Indicator and Apply to Chart
  const handleSaveAndApply = () => {
    // Run test first
    const tempDef: CustomIndicatorDefinition = {
      id: currentId || 'custom_' + Date.now(),
      name: name.trim() || 'Custom Indicator',
      shortName: shortName.trim() || 'CUSTOM',
      description: description.trim() || 'Custom Indicator',
      pane,
      plotType,
      color,
      lineWidth,
      enabled: true,
      codeType: 'JAVASCRIPT',
      formulaOrCode: code,
      params,
      createdAt: new Date().toISOString(),
      isBuiltInPreset: isBuiltIn,
    };

    const res = CustomIndicatorEngine.executeIndicator(tempDef, bars);
    if (!res.success) {
      setTestResult({
        tested: true,
        success: false,
        dataPointsCount: 0,
        minVal: null,
        maxVal: null,
        sampleValues: [],
        error: res.error || 'Error executing script before saving',
      });
      return;
    }

    // Save to list
    const existing = CustomIndicatorEngine.loadSavedIndicators();
    const idx = existing.findIndex(item => item.id === tempDef.id);
    let updated: CustomIndicatorDefinition[];
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = tempDef;
    } else {
      updated = [...existing, tempDef];
    }

    CustomIndicatorEngine.saveIndicators(updated);
    setSavedIndicators(updated);
    onUpdateIndicatorsList(updated);
    onApplyIndicator(tempDef);
    onClose();
  };

  const handleDeleteIndicator = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedIndicators.filter(item => item.id !== id);
    CustomIndicatorEngine.saveIndicators(updated);
    setSavedIndicators(updated);
    onUpdateIndicatorsList(updated);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          background: 'linear-gradient(145deg, #071317 0%, #0c2027 100%)',
          border: '1px solid rgba(10, 186, 181, 0.4)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(10, 186, 181, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(129, 216, 208, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0abab5, #078c88)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(10, 186, 181, 0.4)',
              }}
            >
              <Code size={22} color="#000" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  {t.customStudio.modalTitle}
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(10, 186, 181, 0.2)',
                    color: '#81d8d0',
                    border: '1px solid rgba(10, 186, 181, 0.4)',
                  }}
                >
                  {t.customStudio.sandboxBadge}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.customStudio.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#94aeb0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {[
            { id: 'TEMPLATES', label: t.customStudio.tabTemplates, icon: Sparkles },
            { id: 'EDITOR', label: t.customStudio.tabEditor, icon: Code },
            { id: 'MY_LIBRARY', label: `${t.customStudio.tabLibrary} (${savedIndicators.length})`, icon: Layers },
            { id: 'DOCS', label: t.customStudio.tabDocs, icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: active ? '1px solid #0abab5' : '1px solid transparent',
                  background: active ? 'rgba(10, 186, 181, 0.15)' : 'transparent',
                  color: active ? '#81d8d0' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateNew}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0abab5, #078c88)',
                border: 'none',
                color: '#000',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(10, 186, 181, 0.3)',
              }}
            >
              <Plus size={14} /> {t.customStudio.newIndicatorBtn}
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {/* TAB 1: PRESET TEMPLATES */}
          {activeTab === 'TEMPLATES' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {t.customStudio.chooseTemplateTitle}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t.customStudio.chooseTemplateDesc}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {BUILT_IN_CUSTOM_PRESETS.map(preset => {
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(12, 28, 33, 0.6)',
                        border: '1px solid rgba(129, 216, 208, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#0abab5';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = 'rgba(12, 28, 33, 0.9)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(129, 216, 208, 0.15)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'rgba(12, 28, 33, 0.6)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: preset.pane === 'OVERLAY' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                              color: preset.pane === 'OVERLAY' ? '#38bdf8' : '#fbbf24',
                              border: `1px solid ${preset.pane === 'OVERLAY' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                            }}
                          >
                            {preset.pane === 'OVERLAY' ? t.customStudio.mainOverlay : t.customStudio.subPanel}
                          </span>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: preset.color,
                              boxShadow: `0 0 8px ${preset.color}`,
                            }}
                          />
                        </div>

                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                          {preset.name}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#81d8d0', fontFamily: 'monospace', marginBottom: '8px' }}>
                          Tag: {preset.shortName} • Plot: {preset.plotType}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {preset.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {preset.params?.length || 0} {t.customStudio.parametersTitle}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0abab5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {t.customStudio.useTemplate} →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PINE / JS SCRIPT EDITOR */}
          {activeTab === 'EDITOR' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
              {/* Left Config Panel */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                    {t.customStudio.indicatorName.toUpperCase()}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Hull Moving Average"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                      {t.customStudio.shortLabel.toUpperCase()}
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={e => setShortName(e.target.value)}
                      placeholder="e.g. HMA(20)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                      {t.customStudio.chartPane.toUpperCase()}
                    </label>
                    <select
                      value={pane}
                      onChange={e => setPane(e.target.value as IndicatorPane)}
                      style={{
                        width: '100%',
                        padding: '8px 6px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    >
                      <option value="OVERLAY">{t.customStudio.mainOverlay}</option>
                      <option value="SUBPANEL">{t.customStudio.subPanel}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                      {t.customStudio.visualStyle.toUpperCase()}
                    </label>
                    <select
                      value={plotType}
                      onChange={e => setPlotType(e.target.value as IndicatorPlotType)}
                      style={{
                        width: '100%',
                        padding: '8px 6px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    >
                      <option value="LINE">{t.customStudio.plotLine}</option>
                      <option value="HISTOGRAM">{t.customStudio.plotHistogram}</option>
                      <option value="DOTS">{t.customStudio.plotDots}</option>
                      <option value="AREA">Area Fill</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                      {t.customStudio.lineWidth.toUpperCase()}
                    </label>
                    <select
                      value={lineWidth}
                      onChange={e => setLineWidth(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 6px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    >
                      <option value={1}>1px (Thin)</option>
                      <option value={2}>2px (Standard)</option>
                      <option value={3}>3px (Bold)</option>
                      <option value={4}>4px (Heavy)</option>
                    </select>
                  </div>
                </div>

                {/* Color Palette Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                    {t.customStudio.colorTheme.toUpperCase()}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    {COLOR_PRESETS.map(cp => (
                      <button
                        key={cp.hex}
                        onClick={() => setColor(cp.hex)}
                        title={cp.name}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: cp.hex,
                          border: color === cp.hex ? '2px solid #fff' : '1px solid rgba(0,0,0,0.5)',
                          cursor: 'pointer',
                          boxShadow: color === cp.hex ? `0 0 8px ${cp.hex}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: color,
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#81d8d0', marginBottom: '6px' }}>
                    {t.customStudio.description.toUpperCase()}
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description of how this custom indicator calculates signal"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      resize: 'none',
                    }}
                  />
                </div>

                {/* Parameters Tuner */}
                {params.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>
                      {t.customStudio.parametersTitle.toUpperCase()}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {params.map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
                          <input
                            type="number"
                            value={p.value !== undefined ? p.value : p.defaultValue}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              const copy = [...params];
                              copy[idx].value = isNaN(val) ? 0 : val;
                              setParams(copy);
                            }}
                            style={{
                              width: '70px',
                              padding: '4px 6px',
                              background: 'rgba(0, 0, 0, 0.5)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '11px',
                              textAlign: 'right',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Code Editor & Sandbox Console */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#81d8d0' }}>
                      {t.customStudio.sourceCodeTitle}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      (function calculate(bars, params, indicators))
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setCode(prev => prev + '\n  const rsi = indicators.rsi(bars, 14);');
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '5px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      + Insert RSI
                    </button>
                    <button
                      onClick={() => {
                        setCode(prev => prev + '\n  const ema20 = indicators.ema(bars, 20);');
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '5px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      + Insert EMA
                    </button>
                    <button
                      onClick={() => {
                        setCode(prev => prev + '\n  const atr = indicators.atr(bars, 14);');
                      }}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '5px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      + Insert ATR
                    </button>
                  </div>
                </div>

                {/* Code Textarea */}
                <div
                  style={{
                    position: 'relative',
                    background: '#040b0e',
                    border: '1px solid rgba(10, 186, 181, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  <textarea
                    value={code}
                    onChange={e => {
                      setCode(e.target.value);
                      setTestResult(prev => ({ ...prev, tested: false }));
                    }}
                    spellCheck={false}
                    rows={13}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#a5f3fc',
                      fontSize: '12px',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      lineHeight: '1.6',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Validation & Test Console */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: testResult.tested
                      ? testResult.success
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${
                      testResult.tested
                        ? testResult.success
                          ? 'rgba(16, 185, 129, 0.4)'
                          : 'rgba(239, 68, 68, 0.4)'
                        : 'rgba(255, 255, 255, 0.08)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {testResult.tested ? (
                        testResult.success ? (
                          <Check size={16} color="#10b981" />
                        ) : (
                          <AlertCircle size={16} color="#ef4444" />
                        )
                      ) : (
                        <Sliders size={16} color="#81d8d0" />
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: testResult.tested ? (testResult.success ? '#10b981' : '#ef4444') : '#cbd5e1' }}>
                        {testResult.tested
                          ? testResult.success
                            ? `${t.customStudio.testPassed}: ${testResult.dataPointsCount} ${t.customStudio.dataPoints}`
                            : `${t.customStudio.testFailed}: ${testResult.error}`
                          : t.customStudio.sourceCodeTitle}
                      </span>
                    </div>

                    <button
                      onClick={handleTestScript}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: 'rgba(10, 186, 181, 0.2)',
                        border: '1px solid #0abab5',
                        color: '#81d8d0',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Play size={13} fill="#81d8d0" /> {t.customStudio.testRunBtn}
                    </button>
                  </div>

                  {testResult.tested && testResult.success && (
                    <div style={{ fontSize: '11px', color: '#94aeb0', display: 'flex', gap: '16px', fontFamily: 'monospace' }}>
                      <span>{t.customStudio.range}: [{testResult.minVal?.toFixed(4)} → {testResult.maxVal?.toFixed(4)}]</span>
                      <span>Last 5 Bars: [{testResult.sampleValues.map(v => v !== null ? v.toFixed(2) : 'null').join(', ')}]</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={onClose}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t.rewards.closeBtn}
                  </button>
                  <button
                    onClick={handleSaveAndApply}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0abab5 0%, #078c88 100%)',
                      border: 'none',
                      color: '#000',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(10, 186, 181, 0.4)',
                    }}
                  >
                    <Save size={15} /> {t.customStudio.saveApplyBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MY LIBRARY */}
          {activeTab === 'MY_LIBRARY' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    {t.customStudio.tabLibrary}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Saved indicators stored in your browser local vault, ready to activate on any chart.
                  </p>
                </div>
                <button
                  onClick={handleCreateNew}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0abab5, #078c88)',
                    border: 'none',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {t.customStudio.newIndicatorBtn}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedIndicators.map(ind => {
                  const isActive = activeIndicators.some(a => a.id === ind.id && a.enabled);
                  return (
                    <div
                      key={ind.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'rgba(12, 28, 33, 0.6)',
                        border: `1px solid ${isActive ? 'rgba(10, 186, 181, 0.5)' : 'rgba(129, 216, 208, 0.12)'}`,
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: ind.color,
                            boxShadow: `0 0 8px ${ind.color}`,
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{ind.name}</span>
                            <span style={{ fontSize: '11px', color: '#81d8d0', fontFamily: 'monospace' }}>
                              [{ind.shortName}]
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: ind.pane === 'OVERLAY' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                color: ind.pane === 'OVERLAY' ? '#38bdf8' : '#fbbf24',
                              }}
                            >
                              {ind.pane}
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {ind.description || 'Custom indicator script'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => onToggleIndicator(ind.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: isActive ? '1px solid #0abab5' : '1px solid var(--border-subtle)',
                            background: isActive ? 'rgba(10, 186, 181, 0.2)' : 'transparent',
                            color: isActive ? '#0abab5' : 'var(--text-muted)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                          {isActive ? t.customStudio.activeOnChart : t.customStudio.useTemplate}
                        </button>

                        <button
                          onClick={() => {
                            loadIntoEditor(ind);
                            setActiveTab('EDITOR');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            color: '#81d8d0',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Script
                        </button>

                        {!ind.isBuiltInPreset && (
                          <button
                            onClick={e => handleDeleteIndicator(ind.id, e)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                            title={t.customStudio.deleteConfirm}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: API REFERENCE & CHEATSHEET */}
          {activeTab === 'DOCS' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  TradingView Sandbox API Reference
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Your custom function `calculate(bars, params, indicators)` receives the candlestick array and pre-built math helpers.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#81d8d0', marginBottom: '10px' }}>
                    1. Candle Bar Object Structure (`bars[i]`)
                  </h4>
                  <pre
                    style={{
                      background: '#040b0e',
                      padding: '12px',
                      borderRadius: '8px',
                      color: '#a5f3fc',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      lineHeight: '1.5',
                    }}
                  >
{`{
  timestamp: number; // Unix timestamp in seconds
  open: number;      // Open price
  high: number;      // High price
  low: number;       // Low price
  close: number;     // Close price
  volume: number;    // Trading volume
}`}
                  </pre>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>
                    2. Built-in Math Helpers (`indicators.*`)
                  </h4>
                  <pre
                    style={{
                      background: '#040b0e',
                      padding: '12px',
                      borderRadius: '8px',
                      color: '#fef08a',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      lineHeight: '1.5',
                    }}
                  >
{`indicators.sma(bars, period)       // Simple Moving Average
indicators.ema(bars, period)       // Exponential Moving Average
indicators.rsi(bars, period)       // Relative Strength Index
indicators.atr(bars, period)       // Average True Range
indicators.vwap(bars)              // Volume Weighted Avg Price
indicators.highest(bars, period)   // Highest High over window
indicators.lowest(bars, period)    // Lowest Low over window`}
                  </pre>
                </div>
              </div>

              <div
                style={{
                  marginTop: '16px',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', marginBottom: '10px' }}>
                  3. Standard Return Contract
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  The function <strong>must return an array of numbers (or null for warmup periods)</strong> matching the exact length of `bars`.
                </p>
                <pre
                  style={{
                    background: '#040b0e',
                    padding: '12px',
                    borderRadius: '8px',
                    color: '#e9d5ff',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    lineHeight: '1.5',
                  }}
                >
{`function calculate(bars, params, indicators) {
  const ema = indicators.ema(bars, params.length || 14);
  return bars.map((b, i) => ema[i]);
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
