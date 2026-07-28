// frontend/src/services/mappingService.ts
import { supabase } from './supabaseClient';
import { FieldMapping, MappingType } from '../types';

export async function fetchMappingsForProject(projectName: string): Promise<FieldMapping[]> {
  try {
    const { data, error } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('project_name', projectName);

    if (error || !data) return [];
    return data as FieldMapping[];
  } catch (err) {
    console.error('Error fetching mappings:', err);
    return [];
  }
}

export async function saveMapping(
  projectName: string,
  viewName: string,
  fieldName: string,
  mappingType: MappingType,
  sourceField: string,
  fixedValue: string,
  isMandatory: boolean
): Promise<boolean> {
  try {
    const payload = {
      project_name: projectName,
      view_name: viewName,
      field_name: fieldName,
      mapping_type: mappingType,
      source_field: sourceField,
      fixed_value: fixedValue,
      is_mandatory: isMandatory
    };

    const { error } = await supabase.from('field_mappings').upsert(payload, {
      onConflict: 'project_name,view_name,field_name'
    });

    return !error;
  } catch (err) {
    console.error(`Error saving mapping for ${fieldName}:`, err);
    return false;
  }
}
