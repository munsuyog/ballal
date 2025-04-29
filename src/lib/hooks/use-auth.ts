'use client';

// hooks/use-auth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';

export function useAuth() {
  const auth = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string, redirectTo?: string) => {
    setIsLoading(true);
    try {
      await auth.signIn(email, password);
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher', redirectTo?: string) => {
    setIsLoading(true);
    try {
      await auth.signUp(email, password, name, role);
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (redirectTo: string = '/') => {
    setIsLoading(true);
    try {
      await auth.signOut();
      router.push(redirectTo);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    setIsLoading(true);
    try {
      await auth.signInWithGoogle();
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      await auth.resetPassword(email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    setIsLoading(true);
    try {
      await auth.updateUserProfile(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requireAuth = () => {
    useEffect(() => {
      if (!auth.loading && !auth.user) {
        router.push('/auth/login');
      }
    }, [auth.loading, auth.user]);

    return auth.user;
  };

  return {
    user: auth.user,
    loading: auth.loading || isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    requireAuth,
  };
}