
import { supabase } from '@/store/supabaseClient';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { toast } from 'react-toastify';


export interface Role {
    id: string;
    name: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role_id: string;
    roles: Role;
}

interface UserState {
    userId: string | null;
    userName: string;
    email: string;
    role_id: string | null;
    user: User | null;
    updateUserId: string | null;
    users: User[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

// Initial state
const initialState: UserState = {
    user: null,
    updateUserId: null,
    userId: null,
    userName: '',
    email: '',
    role_id: null,
    users: [],
    status: 'idle',
    error: null,
};

export const addUser = createAsyncThunk<
    User,
    { username: string; email: string; password: string; role_id: string }
>('users/addUser', async ({ username, email, password, role_id }) => {
    let { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (authError) {
        toast.error(authError.message);
        return;
    }
    const { error: insertionError, data: userData } = await supabase
        .from('users')
        .insert({ id: authData?.user?.id, name: username, email: email, role_id: role_id })
        .select(`*, roles (name)`);

    if (insertionError) {
        toast.error(insertionError.message);
        return;
    }
    return userData[0];
});

export const fetchUser = createAsyncThunk<User[]>(
    'roles/fetchUser',
    async (_, { rejectWithValue }) => {
        const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();
      
          if (authError || !user) {
            return rejectWithValue(authError?.message || "User not authenticated");
          }
          
        let { data: users, error } = await supabase.from('users').select(`
    *,
    roles (name)
  `)
  .eq("created_by", user.id);
        if (error) {
            throw new Error(error.message);
        }
        return users as User[];
    }
);

export const deleteUser = createAsyncThunk<string, string>(
    'roles/deleteUser',
    async (userId, { rejectWithValue }) => {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) {
            return rejectWithValue(error.message);
        }
        return userId;
    }
);

export const editUser = createAsyncThunk<
    User,
    { userID: string; username: string; email: string; password: string; role_id: string }
>('users/editUser', async ({ userID, username, email, password ,role_id }) => {
    let { data: authData, error: authError } = await supabase.auth.updateUser({
        email: email,
        password: password,
    });
    if (authError) {
        toast.error(authError.message);
        return;
    }
    const { error: insertionError, data: updateUser } = await supabase
        .from('users')
        .update({id: authData?.user?.id, name: username, email: email, role_id: role_id })
        .eq('id', userID)
        .select(`*, roles (name)`);

    if (insertionError) {
        toast.error(insertionError.message);
        return;
    }
    return updateUser[0]

});


const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setSelectedRole: (state, action: PayloadAction<string>) => {
            state.role_id = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // add cases for add user
            .addCase(addUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.status = 'succeeded';
                state.userId = action.payload.id;
                state.users.push(action.payload);
            })
            .addCase(addUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? null;
            })
            // // add cases for fetch users
            .addCase(fetchUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(
                fetchUser.fulfilled,
                (state: Draft<UserState>, action: PayloadAction<User[]>) => {
                    state.status = 'succeeded';
                    state.users = action.payload;
                }
            )
            .addCase(fetchUser.rejected, (state: Draft<UserState>, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? null;
            })
            // //add cases for delete user
            .addCase(deleteUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(
                deleteUser.fulfilled,
                (state: Draft<UserState>, action: PayloadAction<string>) => {
                    state.status = 'succeeded';
                    state.users = state.users.filter(
                        (user) => user.id !== action.payload
                    );
                }
            )
            .addCase(deleteUser.rejected, (state: Draft<UserState>, action) => {
                state.status = 'failed';
                state.error = action.payload ? action.payload.toString() : null;
            })
            // // add cases for edit user
            .addCase(editUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(editUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.status = 'succeeded';
                const updatedUserIndex = state.users.findIndex(
                    (user) => user.id === action.payload.id
                );
                if (updatedUserIndex !== -1) {
                    state.users[updatedUserIndex] = action.payload;
                } else {
                    state.users.push(action.payload);
                }
            })
            .addCase(editUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message ?? null;
            });
    },
});

export const {
    setSelectedRole,
} = userSlice.actions;

export default userSlice.reducer;
