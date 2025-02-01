
import { supabase } from '@/store/supabaseClient';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';


interface Permission {
    id: string;
    name: string;
  }

  interface PermissionState {
    permissions: Permission[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  }
  
  // Initial state
  const initialState: PermissionState = {
    permissions: [],
    status: 'idle',
    error: null,
  };

  export const fetchPermissions = createAsyncThunk<Permission[]>(
    'roles/fetchPermissions',
    async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*');
      if (error) throw new Error(error.message);
      return data as Permission[];
    }
  );

  const permissionSlice = createSlice({
    name: 'permissions',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchPermissions.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(
          fetchPermissions.fulfilled,
          (state: Draft<PermissionState>, action: PayloadAction<Permission[]>) => {
            state.status = 'succeeded';
            state.permissions = action.payload;
          }
        )
        .addCase(
          fetchPermissions.rejected,
          (state: Draft<PermissionState>, action) => {
            state.status = 'failed';
            state.error = action.error.message ?? null;
          }
        )
    },
  });
  
  export default permissionSlice.reducer;