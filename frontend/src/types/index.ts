// frontend/src/types/index.ts

export type Role = 'Admin' | 'User';

export type MasterType = 'Material Master' | 'Vendor Master' | 'Customer Master';

export interface AppUser {
  id: string;
  username: string;
  role: Role;
  is_locked: boolean;
  created_at?: string;
}

export interface MigrationProject {
  id?: string;
  project_name: string;
  master_type: MasterType;
  created_at?: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  project_name: string;
  master_type: MasterType;
}

export type MappingType =
  | 'Blank (Default)'
  | 'Keep Blank'
  | 'Fixed Values'
  | 'Based on Fixed Rules'
  | 'Based on User Input';

export interface FieldMapping {
  id?: string;
  project_name: string;
  view_name: string;
  field_name: string;
  mapping_type: MappingType;
  source_field?: string;
  fixed_value?: string;
  is_mandatory: boolean;
}

export interface SchemaField {
  field_name: string;
  description: string;
  data_type?: string;
  length?: string;
  is_mandatory: boolean;
}

export interface MasterSchema {
  [sheetName: string]: SchemaField[];
}

export interface FixedRuleRecord {
  id?: string;
  project_name?: string;
  master_type?: MasterType;
  [key: string]: any;
}

export interface MasterConfig {
  baseColumns: string[];
  ruleKeys: string[];
  primaryKey: string;
  xmlTemplateFile: string;
  badgeColor: string;
  badgeBg: string;
}
