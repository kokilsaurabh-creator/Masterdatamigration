// frontend/src/components/workspace/FieldMappingTab.tsx
import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { loadMasterSchema } from '../../utils/schemaLoader';
import { fetchMappingsForProject, saveMapping } from '../../services/mappingService';
import { FieldMapping, MappingType, SchemaField } from '../../types';
import { MAPPING_OPTIONS } from '../../utils/constants';
import { StatusBadge } from '../common/StatusBadge';
import { Toast } from '../common/Toast';
import { Save, Filter, Eye, CheckCircle2, Loader2, Layers } from 'lucide-react';

export const FieldMappingTab: React.FC = () => {
  const { currentProject, selectedMaster } = useProject();
  const schema = loadMasterSchema(selectedMaster);

  const viewOptions = Object.keys(schema);
  const [selectedView, setSelectedView] = useState<string>(viewOptions[0] || '');
  const [filterMandatory, setFilterMandatory] = useState<boolean>(false);
  const [showSavedContext, setShowSavedContext] = useState<boolean>(false);

  const [savedMappings, setSavedMappings] = useState<FieldMapping[]>([]);
  const [currentFormState, setCurrentFormState] = useState<
    Record<string, { mappingType: MappingType; fixedValue: string; sourceField: string }>
  >({});

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (viewOptions.length > 0 && !selectedView) {
      setSelectedView(viewOptions[0]);
    }
  }, [selectedMaster]);

  // Load existing saved mappings for project
  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    fetchMappingsForProject(currentProject).then((mappings) => {
      setSavedMappings(mappings);

      // Populate current form state for selected view
      const stateMap: Record<string, { mappingType: MappingType; fixedValue: string; sourceField: string }> = {};
      mappings.forEach((m) => {
        if (m.view_name === selectedView) {
          stateMap[m.field_name] = {
            mappingType: m.mapping_type,
            fixedValue: m.fixed_value || '',
            sourceField: m.source_field || ''
          };
        }
      });
      setCurrentFormState(stateMap);
      setLoading(false);
    });
  }, [currentProject, selectedMaster, selectedView]);

  const activeFields: SchemaField[] = (schema[selectedView] || []).filter(
    (f) => !filterMandatory || f.is_mandatory
  );

  const handleFieldChange = (
    fieldName: string,
    key: 'mappingType' | 'fixedValue' | 'sourceField',
    val: string
  ) => {
    setCurrentFormState((prev) => ({
      ...prev,
      [fieldName]: {
        mappingType: key === 'mappingType' ? (val as MappingType) : prev[fieldName]?.mappingType || 'Blank (Default)',
        fixedValue: key === 'fixedValue' ? val : prev[fieldName]?.fixedValue || '',
        sourceField: key === 'sourceField' ? val : prev[fieldName]?.sourceField || ''
      }
    }));
  };

  const handleSaveAll = async () => {
    if (!currentProject || !selectedView) return;
    setSaving(true);
    setToast(null);

    let successCount = 0;
    const fieldsToSave = schema[selectedView] || [];

    for (const field of fieldsToSave) {
      const state = currentFormState[field.field_name] || {
        mappingType: 'Blank (Default)',
        fixedValue: '',
        sourceField: ''
      };

      const ok = await saveMapping(
        currentProject,
        selectedView,
        field.field_name,
        state.mappingType,
        state.sourceField,
        state.fixedValue,
        field.is_mandatory
      );

      if (ok) successCount++;
    }

    setSaving(false);
    if (successCount > 0) {
      setToast({ type: 'success', msg: `Successfully saved ${successCount} field mappings for ${selectedView}!` });
      // Refresh saved mappings
      fetchMappingsForProject(currentProject).then(setSavedMappings);
    } else {
      setToast({ type: 'error', msg: 'Failed to save field mappings.' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      {/* Header & Controls Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-blue-600" />
            Field Mapping Configuration
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure SAP target fields for <span className="font-bold text-slate-700">{selectedMaster}</span> view structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSavedContext(!showSavedContext)}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4 mr-1.5 text-slate-500" />
            {showSavedContext ? 'Hide Context' : 'View Saved Mappings'}
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Save View Mappings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Saved Mappings Drawer */}
      {showSavedContext && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Saved Mappings Context ({savedMappings.length} Total)
          </h3>
          {savedMappings.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No saved mappings found for this project yet.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-600 border-b">
                  <tr>
                    <th className="p-2">SAP View</th>
                    <th className="p-2">Field Name</th>
                    <th className="p-2">Mandatory</th>
                    <th className="p-2">Rule</th>
                    <th className="p-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedMappings.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-medium">{m.view_name}</td>
                      <td className="p-2">{m.field_name}</td>
                      <td className="p-2">
                        <StatusBadge type="mandatory" value={String(m.is_mandatory)} />
                      </td>
                      <td className="p-2 font-semibold text-blue-700">{m.mapping_type}</td>
                      <td className="p-2 font-mono text-[11px]">{m.fixed_value || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View Selector & Mandatory Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Select SAP Structure / View
          </label>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          >
            {viewOptions.map((view) => (
              <option key={view} value={view}>
                {view}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center md:justify-end">
          <label className="inline-flex items-center cursor-pointer space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={filterMandatory}
              onChange={(e) => setFilterMandatory(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Show Mandatory Fields Only</span>
          </label>
        </div>
      </div>

      {/* Fields Mapping Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">SAP Field</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Data Type & Len</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Mapping Rule</th>
                <th className="py-3 px-4">Fixed Value / User Field</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading view fields...
                  </td>
                </tr>
              ) : activeFields.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No fields match the current filter.
                  </td>
                </tr>
              ) : (
                activeFields.map((field) => {
                  const state = currentFormState[field.field_name] || {
                    mappingType: 'Blank (Default)',
                    fixedValue: '',
                    sourceField: ''
                  };

                  return (
                    <tr key={field.field_name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {field.field_name}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {field.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {field.data_type} {field.length ? `(${field.length})` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge type="mandatory" value={String(field.is_mandatory)} />
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <select
                          value={state.mappingType}
                          onChange={(e) =>
                            handleFieldChange(field.field_name, 'mappingType', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {MAPPING_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 min-w-[220px]">
                        {state.mappingType === 'Fixed Values' ? (
                          <input
                            type="text"
                            placeholder="Enter fixed value"
                            value={state.fixedValue}
                            onChange={(e) =>
                              handleFieldChange(field.field_name, 'fixedValue', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : state.mappingType === 'Based on User Input' ? (
                          <input
                            type="text"
                            placeholder="Source field name"
                            value={state.sourceField}
                            onChange={(e) =>
                              handleFieldChange(field.field_name, 'sourceField', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">- Automatic -</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
