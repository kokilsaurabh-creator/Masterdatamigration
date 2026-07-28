// frontend/src/services/xmlGeneratorService.ts
import type { FieldMapping, FixedRuleRecord, MasterSchema, MasterType } from '../types';
import { MASTER_CONFIGS } from '../utils/constants';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeVal(val: any): string {
  if (val === null || val === undefined) return '';
  let s = String(val).trim();
  if (s.endsWith('.0')) {
    s = s.substring(0, s.length - 2);
  }
  return s;
}

export async function generateXmlPayload(
  masterType: MasterType,
  schema: MasterSchema,
  allMappings: FieldMapping[],
  savedRules: FixedRuleRecord[],
  uploadedRecords: Record<string, any>[]
): Promise<string> {
  const config = MASTER_CONFIGS[masterType];
  const templateFileName = config.xmlTemplateFile;
  const primaryKey = config.primaryKey;
  const ruleKeys = config.ruleKeys;
  const baseColumns = config.baseColumns;

  // 1. Fetch XML template content
  const response = await fetch(`/templates/${encodeURIComponent(templateFileName)}`);
  if (!response.ok) {
    throw new Error(`Failed to load core XML template: ${templateFileName}`);
  }
  let xmlContent = await response.text();

  // 2. Build final_sap_data structure
  const finalSapData: Record<string, Record<string, string>[]> = {};

  const validMasterDbViews = Object.keys(schema).map((view) =>
    view.includes('. ') ? view.split('. ')[1] : view
  );

  const activeMappings = allMappings.filter((m) => {
    const sheetName = m.view_name.includes('. ') ? m.view_name.split('. ')[1] : m.view_name;
    return validMasterDbViews.includes(sheetName) || Object.keys(schema).includes(sheetName);
  });

  uploadedRecords.forEach((material, matIndex) => {
    // Find matching rule
    let matchedRule: FixedRuleRecord = {};
    for (const rule of savedRules) {
      let isMatch = true;
      for (const key of ruleKeys) {
        const rVal = normalizeVal(rule[key]);
        const mVal = normalizeVal(material[key]);
        if (rVal && rVal !== mVal) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        matchedRule = rule;
        break;
      }
    }

    // Resolve mappings for each field
    activeMappings.forEach((mapConfig) => {
      const rawView = mapConfig.view_name;
      const sheetName = rawView.includes('. ') ? rawView.split('. ')[1] : rawView;

      if (!schema[sheetName]) return;

      const fieldName = mapConfig.field_name;
      const mappingType = mapConfig.mapping_type;

      if (!finalSapData[sheetName]) {
        finalSapData[sheetName] = [];
      }

      while (finalSapData[sheetName].length <= matIndex) {
        finalSapData[sheetName].push({});
      }

      let resolvedValue = '';
      if (mappingType === 'Blank (Default)' || mappingType === 'Keep Blank') {
        resolvedValue = '';
      } else if (mappingType === 'Fixed Values') {
        resolvedValue = mapConfig.fixed_value || '';
      } else if (mappingType === 'Based on Fixed Rules') {
        resolvedValue = normalizeVal(matchedRule[fieldName]);
      } else if (mappingType === 'Based on User Input' || baseColumns.includes(fieldName)) {
        resolvedValue = normalizeVal(material[fieldName]);
      }

      finalSapData[sheetName][matIndex][fieldName] = resolvedValue;
    });
  });

  // 3. Process each sheet and inject XML rows with deduplication
  for (const sheetName of Object.keys(finalSapData)) {
    const rowsList = finalSapData[sheetName];
    const sheetStartTag = `<Worksheet ss:Name="${sheetName}"`;

    if (!xmlContent.includes(sheetStartTag)) continue;

    const hasPrimaryKeyVal = (rowDict: Record<string, string>): boolean => {
      const val = rowDict[primaryKey];
      if (val && String(val).trim()) return true;
      const alternatives = [
        'Vendor Code',
        'Vendor code',
        'Supplier Number',
        'Vendor Number',
        'Supplier',
        'Product Number',
        'Customer Number',
        'Product',
        'Customer',
        'Vendor'
      ];
      for (const alt of alternatives) {
        if (rowDict[alt] && String(rowDict[alt]).trim()) return true;
      }
      return false;
    };

    const validRows = rowsList.filter(hasPrimaryKeyVal);
    if (validRows.length === 0) continue;

    const schemaFields = schema[sheetName] || [];
    const exactColumnOrder = schemaFields.map((f) => f.description || f.field_name);

    // DEDUPLICATION LOGIC
    const dedupedRows: Record<string, string>[] = [];
    const seenKeys = new Set<string>();
    const seenTuples = new Set<string>();
    const isHeaderSheet = sheetName === 'Basic Data' || sheetName === 'General Data';

    for (const r of validRows) {
      let pkVal = normalizeVal(r[primaryKey]);
      if (!pkVal) {
        for (const alt of [
          'Vendor Code',
          'Vendor code',
          'Supplier Number',
          'Vendor Number',
          'Supplier',
          'Product Number',
          'Customer Number',
          'Product',
          'Customer',
          'Vendor'
        ]) {
          pkVal = normalizeVal(r[alt]);
          if (pkVal) break;
        }
      }

      if (isHeaderSheet && pkVal) {
        if (seenKeys.has(pkVal)) continue;
        seenKeys.add(pkVal);
      }

      const rowTuple = exactColumnOrder.map((field) => normalizeVal(r[field])).join('||');
      if (seenTuples.has(rowTuple)) continue;
      seenTuples.add(rowTuple);

      dedupedRows.push(r);
    }

    const numNewRows = dedupedRows.length;
    if (numNewRows === 0) continue;

    let sheetXmlRows = '';
    for (const rowDict of dedupedRows) {
      sheetXmlRows += '    <Row>\n';
      for (const field of exactColumnOrder) {
        const val = rowDict[field] || '';
        const safeVal = escapeXml(val);
        sheetXmlRows += `        <Cell><Data ss:Type="String">${safeVal}</Data></Cell>\n`;
      }
      sheetXmlRows += '    </Row>\n';
    }

    const parts = xmlContent.split(sheetStartTag);
    const beforeSheet = parts[0];
    const sheetAndAfter = parts[1];

    const tableParts = sheetAndAfter.split('</Table>');
    let insideTable = tableParts[0];
    const afterTable = tableParts.slice(1).join('</Table>');

    // Update ExpandedRowCount
    insideTable = insideTable.replace(/ss:ExpandedRowCount="(\d+)"/, (_, oldCount) => {
      const newCount = parseInt(oldCount, 10) + numNewRows;
      return `ss:ExpandedRowCount="${newCount}"`;
    });

    xmlContent = `${beforeSheet}${sheetStartTag}${insideTable}${sheetXmlRows}    </Table>${afterTable}`;
  }

  return xmlContent;
}
