'use client'

import { Box } from '@mui/material';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import RolesTableList from './components/RolesTableList';
// import withAuth from '@/app/auth/withAuth/withAuth';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Roles Table',
  },
];

const RolesList = () => {
  return (
    <PageContainer title="Roles Table" description="this is Roles Table">
      {/* breadcrumb */}
      <Breadcrumb title="Roles Table" items={BCrumb} />
      {/* end breadcrumb */}
      <Box>
        <RolesTableList />
      </Box>
    </PageContainer>
  );
};

export default RolesList;
