import CustomFormLabel from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomFormLabel";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { loginType } from "@/app/(DashboardLayout)/types/auth/auth";
import { supabase } from "@/store/SupabaseClient";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Cookie from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface User {
  id: string;
  name: string;
  email: string;
}

// Supabase user query response interface
interface SupabaseUserResponse {
  data: User | null;
  error: {
    message: string;
  } | null;
}

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    
    if(!email || !password){
      setError("*")
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Invalid email format");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.user) {
        const userId = data.user.id;

        // Fetch user data from the 'users' table
        const { data: user, error: userError }: SupabaseUserResponse =
          await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", userId)
            .single();

        if (userError) {
          toast.error(userError.message);
          return;
        }

        // Store token and user data in cookies
        Cookie.set("sb-access-token", data.session?.access_token, {
          expires: 7,
        });
        Cookie.set("user", JSON.stringify(user), { expires: 7 });

        toast.success("Login Successful");

        // Navigate to the dashboard
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
      // setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Stack>
        <Box>
          <CustomFormLabel htmlFor="username">Email 
            {error && !email &&(
          <Typography component={"span"}
           color="error" variant="body1" fontSize={20} mx={1}>
            {error}
          </Typography>
        )}</CustomFormLabel>
          <CustomTextField
            id="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
          
        </Box>
        <Box>
          <CustomFormLabel htmlFor="password">Password
          {error && !password &&(
          <Typography component={"span"} color="error" variant="body1" fontSize={20} mx={1}>
            {error}
          </Typography>
        )}
          </CustomFormLabel>
          <CustomTextField
            id="password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
         
        </Box>
        <Stack justifyContent="end" direction="row" alignItems="center" my={2}>
          <Typography
            component={Link}
            href="/auth/auth1/forgot-password"
            fontWeight="500"
            sx={{
              textDecoration: "none",
              color: "primary.main",
            }}
          >
            Forgot Password ?
          </Typography>
        </Stack>
      </Stack>
      <Box>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          onClick={handleLogin}
        >
          Sign In
        </Button>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthLogin;
