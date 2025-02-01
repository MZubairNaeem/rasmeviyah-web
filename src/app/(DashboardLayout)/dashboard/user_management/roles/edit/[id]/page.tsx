'use client';

import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import { AppDispatch, RootState } from '@/store/store';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// components
import CustomFormLabel from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import BlankCard from '@/app/(DashboardLayout)/components/shared/BlankCard';
import MenuItem from '@mui/material/MenuItem';

// images
import CustomSelect from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomSelect';
import useAuth from '@/app/auth/useAuth/page';
import { fetchPermissions } from '@/store/apps/user_management/PermissionsSlice';
import {
  editRole,
  fetchRole,
  setSelectedPermissions,
} from '@/store/apps/user_management/RoleManagmentSlice';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import { Stack } from '@mui/system';
import Link from 'next/link';
import { toast } from 'react-toastify';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Update Role',
  },
];

const EditRole = () => {
  const [roleName, setRoleName] = useState<string>('');
  const [roledescription, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fieldError, setError] = useState<string>('');

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const permissions = useSelector(
    (state: RootState) => state.PermissionsReducer.permissions
  );
  const status = useSelector(
    (state: RootState) => state.PermissionsReducer.status
  );
  const selectedPermissions = useSelector(
    (state: RootState) => state.RoleReducer.selectedPermissions
  );
  const error = useSelector((state: RootState) => state.RoleReducer.error);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPermissions())
        .unwrap()
        .then((result) => {})
        .catch((error) => {
          toast.error(error.message)
        });
    }
  }, [dispatch, status]);

  const handleChange = (event: any) => {
    const value = event.target.value;
    const selectedValues = permissions
      .filter((permission) => value.includes(permission.name))
      .map((permission) => ({
        id: permission.id.toString(),
        name: permission.name,
      }));

    dispatch(setSelectedPermissions(selectedValues));
  };
  const { id: roleId } = useParams<{ id: string }>();

  const handleEdit = async (event: any) => {
    event.preventDefault();
    setLoading(true);

    if (!roleName) {
      setError('Field is required');
      toast.error('Update Failed');
      setLoading(false);
      return;
    }
      try {
        if (roleId) {
          await dispatch(
            editRole({
              roleId,
              rolename: roleName,
              description: roledescription,
              selectedPermissions,
            })
          ).unwrap();
          toast.success('Role updated successfully');
          router.push('/dashboard/user_management/roles');
        }
      } catch (error: any) {
        toast.error(error.message)
      }

    setLoading(false);
  };

  useEffect(() => {
    if (roleId) {
      dispatch(fetchRole())
        .unwrap()
        .then((roles) => {
          const role = roles.find((r) => r.id === roleId);
          if (role) {
            setRoleName(role.name);
            setDescription(role.description);
            dispatch(
              setSelectedPermissions(
                role.role_has_permissions.map((p) => ({
                  id: p.permissions.id,
                  name: p.permissions.name,
                }))
              )
            );
          }
        })
        .catch((error:any) => {
          toast.error(error.message);
        });
    }
  }, [dispatch, roleId]);

  return (
    <PageContainer title="Update Role" description="this is Update Role">
      <Breadcrumb title="Update Role" items={BCrumb} />

      <form>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <BlankCard>
              <CardContent>
                <Typography variant="h5" mb={1}>
                 Update a Role
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={7}>
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-role-name"
                    >
                      Role Name
                    </CustomFormLabel>
                    <CustomTextField
                      type="text"
                      id="text-role_name"
                      placeholder="Admin"
                      variant="outlined"
                      fullWidth
                      value={roleName}
                      onChange={(e: any) => setRoleName(e.target.value)}
                    />
                    {fieldError && !roleName && (
                      <Typography color="error" mt={2}>
                        Field is required
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-description"
                    >
                      Description (optional)
                    </CustomFormLabel>
                    <TextField
                      id="text-description"
                      rows={1}
                      multiline
                      fullWidth
                      value={roledescription}
                      onChange={(e: any) => setDescription(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-location"
                    >
                      Select Permission
                    </CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      id="text-permission"
                      variant="outlined"
                      value={selectedPermissions.map((item) => item.name)}
                      onChange={handleChange}
                      multiple
                      renderValue={(selected: any[]) => selected.join(',   ')}
                    >
                      {permissions.map((permission) => (
                        <MenuItem key={permission.id} value={permission.name}>
                          {permission.name}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                  </Grid>
                </Grid>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: 'end' }}
                  mt={3}
                >
                  <Button
                    size="large"
                    variant="contained"
                    color="secondary"
                    type="submit"
                    onClick={handleEdit}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Update'
                    )}
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    color="primary"
                    component={Link}
                    href="/dashboard/user_management/roles"
                  >
                    Cancel
                  </Button>
                </Stack>
                {error && (
                  <Typography color="error" mt={2}>
                    {error}
                  </Typography>
                )}
              </CardContent>
            </BlankCard>
          </Grid>
        </Grid>
      </form>
    </PageContainer>
  );
};

export default useAuth(EditRole);
