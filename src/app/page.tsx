"use client";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Login from "@/app/auth/login/page";

 function Page() {
  return (
    <PageContainer title="Login" description="this is Login Page">
      <Login />
    </PageContainer>

  );
}

Page.layout = "Blank";
export default Page;