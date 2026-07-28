// frontend/src/components/workspace/XmlGenerationTab.tsx
import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { loadMasterSchema } from '../../utils/schemaLoader';
import { fetchMappingsForProject } from '../../services/mappingService';
import { fetchProjectRules } from '../../services/rulesService';
import { generateXmlPayload } from '../../services/xmlGeneratorService';
import { MASTER_CONFIGS } from '../../utils/constants';
import { FieldMapping, FixedRuleRecord } from '../../types';
import { DataGrid } from '../common/DataGrid';
import { Toast } from '../common/Toast';
import * as XLSX from 'xlsx';
import { FileCode, Download, Upload, Play, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';

export const XmlGenerationTab: React.FC = () => {
  const { currentProject, selectedMaster } = useProject();
  const config = MASTER_CONFIGS[selectedMaster];
  const schema = loadMasterSchema(selectedMaster);

  const [allMappings, setAllMappings] = useState<FieldMapping[]>([]);
  const [savedRules, setSavedRules] = useState<FixedRuleRecord[]>([]);

  const [templateColumns, setTemplateColumns] = useState<string[]>(config.baseColumns);
  const [uploadedRecords, setUploadedRecords] = useState<Record<string, any>[]>([]);
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);

    Promise.all([
      fetchMappingsForProject(currentProject),
      fetchProjectRules(currentProject, selectedMaster)
    ]).then(([mappings, rules]) => {
      setAllMappings(mappings);
      setSavedRules(rules);

      // Determine user input mapped fields
      const userMappedFields: string[] = [];
      mappings.forEach((m) => {
        if (m.mapping_type === 'Based on User Input' && !config.baseColumns.includes(m.field_name)) {
          if (!userMappedFields.includes(m.field_name)) {
            userMappedFields.push(m.field_name);
          }
        }
      });

      setTemplateColumns([...config.baseColumns, ...userMappedFields]);
      setLoading(false);
    });
  }, [currentProject, selectedMaster]);

  // Download Upload Template Excel
  const handleDownloadTemplate = () => {
    const emptyRow: Record<string, string> = {};
    templateColumns.forEach((col) => (emptyRow[col] = ''));
    const worksheet = XLSX.utils.json_to_sheet([emptyRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Data');
    XLSX.writeFile(
      workbook,
      `${currentProject}_${selectedMaster.replace(/\s+/g, '_')}_Upload_Template.xlsx`
    );
  };

  // Handle Excel Upload
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

        setUploadedRecords(data);
        setGeneratedXml(null);
        setToast({
          type: 'success',
          msg: `Detected ${data.length} raw data records from uploaded file!`
        });
      } catch (err: any) {
        setToast({ type: 'error', msg: `Failed to parse Excel file: ${err.message}` });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Execute Transformation & XML Payload Generation
  const handleExecuteMigration = async () => {
    if (uploadedRecords.length === 0) {
      setToast({ type: 'error', msg: 'Please upload raw data Excel file first.' });
      return;
    }

    setExecuting(true);
    setToast(null);

    try {
      const xmlResult = await generateXmlPayload(
        selectedMaster,
        schema,
        allMappings,
        savedRules,
        uploadedRecords
      );

      setGeneratedXml(xmlResult);
      setExecuting(false);
      setToast({
        type: 'success',
        msg: 'Payload structured successfully! XML file is ready for download.'
      });
    } catch (err: any) {
      setExecuting(false);
      setToast({ type: 'error', msg: `XML Payload Generation error: ${err.message}` });
    }
  };

  // Download XML file
  const handleDownloadXml = () => {
    if (!generatedXml) return;
    const blob = new Blob([generatedXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentProject}_${selectedMaster.replace(/\s+/g, '_')}_Payload.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Construct DataGrid columns dynamically from templateColumns
  const gridColumns = templateColumns.map((col) => ({
    key: col,
    header: col
  }));

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

      {/* Step 1: Upload Template Download Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-blue-600" />
            1. Source Data Template
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Download standard Excel template with base and user-mapped fields for{' '}
            <span className="font-bold text-slate-700">{selectedMaster}</span>.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors shrink-0"
        >
          <Download className="w-4 h-4 mr-1.5 text-blue-600" />
          Download Upload Template
        </button>
      </div>

      {/* Step 2: Upload Raw Data & Execute Transformation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-600" />
              2. Upload Raw Data & Execute Pipeline
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload populated Excel file and trigger S/4HANA Migration Logic Engine.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer transition-colors">
              <Upload className="w-4 h-4 mr-1.5 text-blue-600" />
              <span>Select Raw Excel File</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExecuteMigration}
              disabled={executing || uploadedRecords.length === 0}
              className="inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Executing Logic...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5 fill-current" />
                  Execute Migration Logic
                </>
              )}
            </button>
          </div>
        </div>

        {/* Uploaded Data Summary */}
        {uploadedRecords.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detected Raw Records ({uploadedRecords.length} Rows, {savedRules.length} Rules Evaluated)
              </span>
            </div>
            <DataGrid data={uploadedRecords} columns={gridColumns} pageSize={10} />
          </div>
        )}
      </div>

      {/* Step 3: XML Payload Ready & Download */}
      {generatedXml && (
        <div className="bg-emerald-50/80 p-6 rounded-2xl border border-emerald-300 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                SAP Migration Cockpit Payload Ready!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                XML migration payload formatted with deduplicated basic/general data and valid ExpandedRowCount.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadXml}
            className="inline-flex items-center px-6 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-lg transition-all shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Download SAP XML Payload
          </button>
        </div>
      )}
    </div>
  );
};
