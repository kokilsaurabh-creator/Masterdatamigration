// frontend/src/services/projectService.ts
import { supabase } from './supabaseClient';
import { MasterType, MigrationProject, UserPermission } from '../types';

export async function fetchProjectsAndModulesForUser(userId: string, role: string): Promise<{
  projects: string[];
  allowedMastersMap: Record<string, MasterType[]>;
}> {
  const projects: string[] = [];
  const allowedMastersMap: Record<string, MasterType[]> = {};

  try {
    if (role === 'Admin') {
      const { data } = await supabase
        .from('migration_projects')
        .select('project_name, master_type');

      if (data) {
        for (const row of data) {
          const p = row.project_name;
          const m = row.master_type as MasterType;
          if (!projects.includes(p)) projects.push(p);
          if (!allowedMastersMap[p]) allowedMastersMap[p] = [];
          if (!allowedMastersMap[p].includes(m)) allowedMastersMap[p].push(m);
        }
      }
    } else {
      const { data } = await supabase
        .from('user_permissions')
        .select('project_name, master_type')
        .eq('user_id', userId);

      if (data) {
        for (const row of data) {
          const p = row.project_name;
          const m = row.master_type as MasterType;
          if (!projects.includes(p)) projects.push(p);
          if (!allowedMastersMap[p]) allowedMastersMap[p] = [];
          if (!allowedMastersMap[p].includes(m)) allowedMastersMap[p].push(m);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching projects:', err);
  }

  return { projects, allowedMastersMap };
}

export async function createProject(projectName: string, masterType: MasterType): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('migration_projects').insert({
      project_name: projectName,
      master_type: masterType
    });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAllPermissions(): Promise<{
  permissions: UserPermission[];
  userMap: Record<string, string>;
}> {
  const { data: usersData } = await supabase.from('app_users').select('id, username').eq('role', 'User');
  const userMap: Record<string, string> = {};
  if (usersData) {
    usersData.forEach((u) => {
      userMap[u.id] = u.username;
    });
  }

  const { data: permsData } = await supabase.from('user_permissions').select('*');
  const permissions: UserPermission[] = permsData ? (permsData as UserPermission[]) : [];

  return { permissions, userMap };
}

export async function grantUserPermissions(
  userId: string,
  projects: string[],
  modules: MasterType[]
): Promise<number> {
  let count = 0;
  for (const project of projects) {
    for (const moduleType of modules) {
      try {
        const { error } = await supabase.from('user_permissions').upsert(
          {
            user_id: userId,
            project_name: project,
            master_type: moduleType
          },
          { onConflict: 'user_id,project_name,master_type' }
        );
        if (!error) count++;
      } catch (err) {
        console.error('Error granting perm:', err);
      }
    }
  }
  return count;
}

export async function revokePermission(permissionId: string): Promise<boolean> {
  const { error } = await supabase.from('user_permissions').delete().eq('id', permissionId);
  return !error;
}
