'use client';

import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import { AppDispatch, RootState } from '@/store/store';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
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
import { fetchRole } from '@/store/apps/user_management/RoleManagmentSlice';
import { editUser, fetchUser } from '@/store/apps/user_management/UserSlice';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import { Stack } from '@mui/system';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Update User',
  },
];

const AddUser = () => {
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fieldError, setError] = useState<string>('');

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const role = useSelector(
    (state: RootState) => state.RoleReducer.rolePermissions
  );
  const status = useSelector((state: RootState) => state.RoleReducer.status);
  const error = useSelector((state: RootState) => state.UserReducer.error);
  

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRole())
        .unwrap()
        .then((result) => {
        })
        .catch((error) => {
          toast.error(error.message)

        });
    }
  }, [dispatch, status]);

  const { id: userID } = useParams<{ id: string }>();

  useEffect(() => {
    if (userID) {
      dispatch(fetchUser())
        .unwrap()
        .then((users) => {
          const user = users.find((u) => u.id === userID);
        if (user) {
          setUserName(user.name);
          setEmail(user.email);
          const selectedRole = role.find(r => r.name === user.roles.name);
          if (selectedRole) {
            setUserRole(selectedRole.id); 
          }
        } 
        })
        .catch((error: any) => {
          toast.error(error.message)

        });
    }
  }, [dispatch, userID, role]);


  const handleEdit = async (event: any) => {
    event.preventDefault();
    setLoading(true);

    if (!userName || !email) {
      setError('Field is required');
      toast.error('Update Failed');
      setLoading(false);
      return;
    }

      try {
        if (userID) {
          const result = await dispatch(
            editUser({
              userID,
              password: password,
              userName: userName,
              email: email,
              roleId: userRole,
            })
          ).unwrap();
          if (result) {
            toast.success('User updated successfully');
            router.push('/dashboard/user_managment/users');
          }
        }
      } catch (error: any) {
          toast.error(error.message)
      }

    setLoading(false);
  };


  return (
    <PageContainer title="Update User" description="this is Update User">
      <Breadcrumb title="Update User" items={BCrumb} />

      <form>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <BlankCard>
              <CardContent>
                <Typography variant="h5" mb={1}>
                 Update a User
                 
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={7}>
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-user-name"
                    >
                      User Name
                    </CustomFormLabel>
                    <CustomTextField
                      type="text"
                      id="text-user_name"
                      placeholder="Jerry"
                      variant="outlined"
                      fullWidth
                      value={userName}
                      onChange={(e: any) => setUserName(e.target.value)}
                    />
                    {fieldError && !userName && (
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
                      htmlFor="text-email"
                    >
                      Email
                    </CustomFormLabel>
                    <CustomTextField
                      type="text"
                      id="text-email"
                      placeholder="Jerry@gmail.com"
                      variant="outlined"
                      fullWidth
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                    />
                    {fieldError && !email && (
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
                      htmlFor="text-password"
                    >
                      Password
                    </CustomFormLabel>
                    <CustomTextField
                      type="password"
                      name="text-password"
                      variant="outlined"
                      fullWidth
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      autoComplete="off"
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <CustomFormLabel
                      sx={{
                        mt: 0,
                      }}
                      htmlFor="text-role"
                    >
                      Select Roles
                    </CustomFormLabel>
                    <CustomSelect
                      fullWidth
                      id="text-role"
                      variant="outlined"
                      value={userRole}
                      onChange={(e: any) =>setUserRole(e.target.value)}
                    >
                      {role.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
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
                    href="/dashboard/user_management/users"
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

export default useAuth(AddUser);
