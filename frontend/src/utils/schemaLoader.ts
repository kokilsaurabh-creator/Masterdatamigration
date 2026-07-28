// frontend/src/utils/schemaLoader.ts
import { MasterSchema, MasterType } from '../types';
import materialSchema from '../data/material_fields.json';
import vendorSchema from '../data/vendor_fields.json';
import customerSchema from '../data/customer_fields.json';

export function loadMasterSchema(masterType: MasterType): MasterSchema {
  switch (masterType) {
    case 'Material Master':
      return materialSchema as MasterSchema;
    case 'Vendor Master':
      return vendorSchema as MasterSchema;
    case 'Customer Master':
      return customerSchema as MasterSchema;
    default:
      return {};
  }
}

export function getLegacyViewInfo(rawView: string): [string, string] {
  if (rawView.includes('. ')) {
    const parts = rawView.split('. ');
    return [parts[1], rawView];
  }
  return [rawView, rawView];
}
