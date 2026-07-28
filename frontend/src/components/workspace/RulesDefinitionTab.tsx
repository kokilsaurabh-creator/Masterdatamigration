// frontend/src/components/workspace/RulesDefinitionTab.tsx
import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { fetchProjectRules, saveProjectRules } from '../../services/rulesService';
import { fetchMappingsForProject } from '../../services/mappingService';
import { FixedRuleRecord } from '../../types';
import { MASTER_CONFIGS } from '../../utils/constants';
import { Toast } from '../common/Toast';
import * as XLSX from 'xlsx';
import { Sliders, Download, Upload, Plus, Trash2, Save, Loader2, Database } from 'lucide-react';

export const RulesDefinitionTab: React.FC = () => {
  const { currentProject, selectedMaster } = useProject();
  const config = MASTER_CONFIGS[selectedMaster];
  const ruleKeys = config.ruleKeys;

  const [ruleFields, setRuleFields] = useState<string[]>([]);
  const [ruleRecords, setRuleRecords] = useState<FixedRuleRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);

    // Fetch mappings configured as 'Based on Fixed Rules' to get target rule fields
    fetchMappingsForProject(currentProject).then((mappings) => {
      const targetFields = mappings
        .filter((m) => m.mapping_type === 'Based on Fixed Rules')
        .map((m) => m.field_name);

      const uniqueFields = Array.from(new Set(targetFields));
      setRuleFields(uniqueFields);
    });

    // Fetch saved rules
    fetchProjectRules(currentProject, selectedMaster).then((rules) => {
      setRuleRecords(rules);
      setLoading(false);
    });
  }, [currentProject, selectedMaster]);

  const allColumns = [...ruleKeys, ...ruleFields];

  const handleAddRow = () => {
    const newRecord: FixedRuleRecord = {
      project_name: currentProject || '',
      master_type: selectedMaster
    };
    allColumns.forEach((col) => (newRecord[col] = ''));
    setRuleRecords((prev) => [...prev, newRecord]);
  };

  const handleRemoveRow = (index: number) => {
    setRuleRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCellChange = (index: number, col: string, val: string) => {
    setRuleRecords((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [col]: val };
      return copy;
    });
  };

  // Bulk Excel Template Download
  const handleDownloadTemplate = () => {
    const emptyRow: Record<string, string> = {};
    allColumns.forEach((col) => (emptyRow[col] = ''));
    const worksheet = XLSX.utils.json_to_sheet([emptyRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fixed Rules');
    XLSX.writeFile(workbook, `${currentProject}_${selectedMaster.replace(/\s+/g, '_')}_Rules_Template.xlsx`);
  };

  // Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        const importedRules: FixedRuleRecord[] = data.map((row) => ({
          ...row,
          project_name: currentProject || '',
          master_type: selectedMaster
        }));

        setRuleRecords(importedRules);
        setToast({ type: 'success', msg: `Successfully imported ${importedRules.length} rules from Excel!` });
      } catch (err: any) {
        setToast({ type: 'error', msg: `Failed to parse Excel file: ${err.message}` });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveRules = async () => {
    if (!currentProject) return;
    setSaving(true);
    setProgress(0);

    const ok = await saveProjectRules(
      currentProject,
      selectedMaster,
      ruleRecords,
      (ratio) => setProgress(ratio)
    );

    setSaving(false);
    if (ok) {
      setToast({ type: 'success', msg: `Successfully saved all ${ruleRecords.length} rule records!` });
    } else {
      setToast({ type: 'error', msg: 'Error saving rules to database.' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
            <Sliders className="w-5 h-5 mr-2 text-blue-600" />
            Fixed Rules Engine Definition
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Define rule key conditions and target default values for <span className="font-bold text-slate-700">{selectedMaster}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Download Excel Template
          </button>

          <label className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer transition-colors">
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>Upload Rules Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Saving ({Math.round(progress * 100)}%)...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Save All Rules ({ruleRecords.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rule Keys Legend */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">
          Rule Condition Keys:
        </span>
        {ruleKeys.map((key) => (
          <span
            key={key}
            className="px-2.5 py-1 bg-blue-100 text-blue-800 font-semibold rounded-md text-xs border border-blue-200"
          >
            {key}
          </span>
        ))}
        {ruleFields.length > 0 && (
          <>
            <span className="text-slate-300 mx-2">|</span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">
              Target Fields:
            </span>
            {ruleFields.map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-md text-xs border border-emerald-200"
              >
                {f}
              </span>
            ))}
          </>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Rules Matrix ({ruleRecords.length} Records Loaded)
          </span>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Rule Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">#</th>
                {ruleKeys.map((key) => (
                  <th key={key} className="py-3 px-3 bg-blue-50/60 text-blue-900">
                    🔑 {key}
                  </th>
                ))}
                {ruleFields.map((f) => (
                  <th key={f} className="py-3 px-3 bg-emerald-50/60 text-emerald-900">
                    🎯 {f}
                  </th>
                ))}
                <th className="py-3 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={allColumns.length + 2} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading rules data...
                  </td>
                </tr>
              ) : ruleRecords.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length + 2} className="py-8 text-center text-slate-400 italic">
                    No rules defined. Click "Add Rule Row" or upload an Excel template to get started.
                  </td>
                </tr>
              ) : (
                ruleRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    {ruleKeys.map((key) => (
                      <td key={key} className="py-2 px-2">
                        <input
                          type="text"
                          value={record[key] || ''}
                          onChange={(e) => handleCellChange(index, key, e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                    {ruleFields.map((f) => (
                      <td key={f} className="py-2 px-2">
                        <input
                          type="text"
                          value={record[f] || ''}
                          onChange={(e) => handleCellChange(index, f, e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-mono text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
