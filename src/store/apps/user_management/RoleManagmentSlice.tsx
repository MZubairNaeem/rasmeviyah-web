
import { supabase } from '@/store/SupabaseClient';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

interface selectedPermission {
  id: string;
  name: string;
}
interface Role {
  id: string;
  name: string;
  description: string;
}
export interface Permissions {
  id: string;
  name: string;
  // business_type_id: string | null;
  created_at: string;
}

export interface roleHasPermission {
  permissions: Permissions;
}

export interface Roles {
  id: string;
  name: string;
  description: string;
  roleHasPermissions: roleHasPermission[];
  createdAt: string;
}

interface roleState {
  roleName: string;
  description: string;
  roleId: string | null;
  role: Role[];
  selectedPermissions: selectedPermission[];
  permissions: Permissions[];
  rolePermissions: Roles[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: roleState = {
  roleName: '',
  description: '',
  roleId: null,
  role: [],
  selectedPermissions: [],
  permissions: [],
  rolePermissions: [],
  status: 'idle',
  error: null,
};

export const saveRole = createAsyncThunk<
  Roles,
  {
    roleName: string;
    description: string;
    selectedPermissions: selectedPermission[];
  }
>('roles/saveRole', async ({ roleName, description, selectedPermissions }) => {
  // Insert role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert([{ name: roleName, description: description }])
    .select('*');
  if (roleError) {
    throw new Error(roleError.message);
  }

  const roleId = role[0]?.id;
  if (!roleId) {
    throw new Error('Failed to retrieve role ID');
  }

  const rolePermissions = selectedPermissions.map((permission) => ({
    role_id: roleId,
    permission_id: permission.id,
  }));

  // insert permissions
  const { data: role_permission, error: rolepermissionError } =
    await 
    supabase.from('role_has_permissions').insert(rolePermissions).select(`
      *,
        permissions (
          name
        )
    `);

  if (rolepermissionError) {
    throw new Error(rolepermissionError.message);
  }

  const permissionIds = selectedPermissions.map((perm) => perm.id);
  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('*')
    .in('id', permissionIds);

  if (permissionsError) {
    throw new Error(permissionsError.message);
  }

  const rolehaspermissionId = role_permission[0]?.id;

  const newRole: Roles = {
    id: roleId,
    name: roleName,
    description: description,
    createdAt: role[0]?.created_at,
    roleHasPermissions:
      role_permission.map((permission) => ({
        permissions: {
          id: permission.id,
          name:
            permissions.find(
              (p: Permissions) => p.id === permission.permission_id
            )?.name || '',
          created_at: '',
        },
      })) || [],
  };
  return newRole;
});

// fetch role and accosiative permissions
export const fetchRole = createAsyncThunk<Roles[]>(
  'roles/fetchRolePermissions',
  async (_, { rejectWithValue }) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return rejectWithValue(authError?.message || "User not authenticated");
    } 

    let { data: rolesWithPermissions, error } = await supabase.from('roles')
      .select(`
    *,
    role_has_permissions (
      permissions (
        *
      )
    )
  `)
  .eq("created_by", user.id);
    if (error) {
      throw new Error(error.message);
    }
    return rolesWithPermissions as Roles[];
  }
);

// delete roles
export const deleteRole = createAsyncThunk<string, string>(
  'roles/deleteRole',
  async (roleId, { rejectWithValue }) => {
    const { error } = await supabase.from('roles').delete().eq('id', roleId);
    if (error) {
      return rejectWithValue(error.message);
    }
    return roleId;
  }
);

//edit role
export const editRole = createAsyncThunk<
  Roles,
  {
    roleId: string;
    roleName: string;
    description: string;
    selectedPermissions: selectedPermission[];
  }
>(
  'roles/editRole',
  async ({ roleId, roleName, description, selectedPermissions }) => {
    // Update the role details (name, description)
    const { data: updatedRole, error: updateRoleError } = await supabase
      .from('roles')
      .update({
        name: roleName,
        description: description,
      })
      .eq('id', roleId)
      .select();

    if (updateRoleError) {
      throw new Error(updateRoleError.message);
    }

    if (!updatedRole?.length) {
      throw new Error('Role not found');
    }

    const updatedRoleId = updatedRole[0].id;

    // Fetch existing role permissions
    const { data: existingPermissions, error: fetchPermissionsError } =
      await supabase
        .from('role_has_permissions')
        .select('permission_id')
        .eq('role_id', updatedRoleId);

    if (fetchPermissionsError) {
      throw new Error(fetchPermissionsError.message);
    }

    const existingPermissionIds = existingPermissions.map(
      (perm) => perm.permission_id
    );

    // Filter out permissions that are already assigned
    const newPermissions = selectedPermissions.filter(
      (perm) => !existingPermissionIds.includes(perm.id)
    );

    // If there are new permissions to add, insert them
    if (newPermissions.length > 0) {
      const rolePermissions = newPermissions.map((permission) => ({
        role_id: updatedRoleId,
        permission_id: permission.id,
      }));

      const { error: insertPermissionsError } = await supabase
        .from('role_has_permissions')
        .insert(rolePermissions).select(`
                  *,
                    permissions (
                      name
                    )
                `);

      if (insertPermissionsError) {
        throw new Error(insertPermissionsError.message);
      }
    }

    // Fetch all permission details (including names) for the updated role
    const { data: allPermissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*')
      .in(
        'id',
        selectedPermissions.map((perm) => perm.id)
      );

    if (permissionsError) {
      throw new Error(permissionsError.message);
    }

    const updatedRoleData: Roles = {
      id: updatedRoleId,
      name: roleName,
      description: description,
      createdAt: updatedRole[0]?.created_at || '',
      roleHasPermissions: selectedPermissions.map((permission) => ({
        permissions: {
          id: permission.id,
          name: allPermissions.find((p) => p.id === permission.id)?.name || '',
          business_type_id: null,
          created_at: '',
        },
      })),
    };

    return updatedRoleData;
  }
);

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    setSelectedPermissions: (
      state,
      action: PayloadAction<selectedPermission[]>
    ) => {
      state.selectedPermissions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // add cases for add role
      .addCase(saveRole.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveRole.fulfilled, (state, action: PayloadAction<Roles>) => {
        state.status = 'succeeded';
        state.roleId = action.payload.id;
        state.rolePermissions.push(action.payload);
      })
      .addCase(saveRole.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      })
      // add cases for fetch roles
      .addCase(fetchRole.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(
        fetchRole.fulfilled,
        (state: Draft<roleState>, action: PayloadAction<Roles[]>) => {
          state.status = 'succeeded';
          state.rolePermissions = action.payload;
        }
      )
      .addCase(fetchRole.rejected, (state: Draft<roleState>, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      })
      //add cases for delete role
      .addCase(deleteRole.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(
        deleteRole.fulfilled,
        (state: Draft<roleState>, action: PayloadAction<string>) => {
          state.status = 'succeeded';
          state.rolePermissions = state.rolePermissions.filter(
            (role) => role.id !== action.payload
          );
        }
      )
      .addCase(deleteRole.rejected, (state: Draft<roleState>, action) => {
        state.status = 'failed';
        state.error = action.payload ? action.payload.toString() : null;
      })
      // add cases for edit role
      .addCase(editRole.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(editRole.fulfilled, (state, action: PayloadAction<Roles>) => {
        state.status = 'succeeded';
        const updatedRoleIndex = state.rolePermissions.findIndex(
          (role) => role.id === action.payload.id
        );
        if (updatedRoleIndex !== -1) {
          state.rolePermissions[updatedRoleIndex] = action.payload;
        } else {
          state.rolePermissions.push(action.payload);
        }
      })
      .addCase(editRole.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      });
  },
});

export const { setSelectedPermissions } = roleSlice.actions;

export default roleSlice.reducer;
