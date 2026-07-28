// frontend/src/utils/constants.ts
import { MasterConfig, MasterType } from '../types';

export const MASTER_CONFIGS: Record<MasterType, MasterConfig> = {
  'Material Master': {
    baseColumns: [
      'Product Number',
      'Product Description',
      'Product Type',
      'Product Group',
      'Plant',
      'Sales Organization',
      'Distribution Channel'
    ],
    ruleKeys: [
      'Product Type',
      'Product Group',
      'Plant',
      'Sales Organization',
      'Distribution Channel'
    ],
    primaryKey: 'Product Number',
    xmlTemplateFile: 'Source data for Product.xml',
    badgeColor: 'text-emerald-700 border-emerald-300 bg-emerald-50',
    badgeBg: 'bg-emerald-600'
  },
  'Vendor Master': {
    baseColumns: [
      'Vendor Code',
      'BP Grouping',
      'Account Group',
      'BP Type',
      'Purchasing Organization',
      'Company Code'
    ],
    ruleKeys: [
      'BP Grouping',
      'Account Group',
      'BP Type',
      'Purchasing Organization',
      'Company Code'
    ],
    primaryKey: 'Vendor Code',
    xmlTemplateFile: 'Source data for Supplier.xml',
    badgeColor: 'text-indigo-700 border-indigo-300 bg-indigo-50',
    badgeBg: 'bg-indigo-600'
  },
  'Customer Master': {
    baseColumns: [
      'Customer Number',
      'Customer Name',
      'BP Grouping',
      'Customer Account Group',
      'Company Code',
      'Sales Organization',
      'Distribution Channel',
      'Division'
    ],
    ruleKeys: [
      'BP Grouping',
      'Customer Account Group',
      'Company Code',
      'Sales Organization',
      'Distribution Channel',
      'Division'
    ],
    primaryKey: 'Customer Number',
    xmlTemplateFile: 'Source data for Customer.xml',
    badgeColor: 'text-amber-700 border-amber-300 bg-amber-50',
    badgeBg: 'bg-amber-600'
  }
};

export const MAPPING_OPTIONS = [
  'Blank (Default)',
  'Keep Blank',
  'Fixed Values',
  'Based on Fixed Rules',
  'Based on User Input'
] as const;
