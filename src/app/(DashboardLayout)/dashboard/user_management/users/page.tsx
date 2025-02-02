'use client'

import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
// import useAuth from '@/app/auth/useAuth/page';
import { Box } from '@mui/material';
import UsersTableList from './components/UsersTableList';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Users Table',
  },
];

const SearchTable = () => {
  return (
    <PageContainer title="Users Table" description="this is Users Table">
      {/* breadcrumb */}
      <Breadcrumb title="Users Table" items={BCrumb} />
      {/* end breadcrumb */}
      <Box>
        <UsersTableList />
      </Box>
    </PageContainer>
  );
};

export default SearchTable;
