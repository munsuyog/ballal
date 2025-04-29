'use client';

// app/profile/page.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Camera, Lock, Mail, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/lib/hooks/use-auth';
import * as userService from '@/lib/services/user-service';
import { useToast } from '@/components/ui/use-toast';

export default function ProfilePage() {
  const { user, requireAuth, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Require authentication
  requireAuth();

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setRole(user.role || 'student');
      setPreviewUrl(user.photoURL);
    }
  }, [user]);

  // Handle profile image selection
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Update profile information
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updateData: any = { 
        displayName,
        role 
      };
      
      if (selectedFile) {
        updateData.file = selectedFile;
      }
      
      await userService.updateUserProfile(updateData);
      
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
      setIsUpdating(false);
    }
  };

  // Update password
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await userService.updateUserPassword(currentPassword, newPassword);
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
      toast({
        title: "Password update failed",
        description: error.message || "Please check your current password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Update email address
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || email === user?.email) {
      return;
    }
    
    try {
      // This would typically require verification with current password
      // For now, we'll just show a toast
      toast({
        title: "Email update",
        description: "Email changes require verification. Please contact support.",
      });
    } catch (error: any) {
      toast({
        title: "Email update failed",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null; // This will redirect to login due to requireAuth()
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <form onSubmit={handleProfileUpdate}>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar 
                          className="h-24 w-24 cursor-pointer border-2 border-muted hover:border-primary transition-colors"
                          onClick={handleImageClick}
                        >
                          {previewUrl ? (
                            <AvatarImage src={previewUrl} alt={displayName} />
                          ) : (
                            <AvatarFallback>
                              {displayName ? displayName.substring(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          )}
                          <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                            <Camera className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </Avatar>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click on the avatar to change your profile picture
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email address cannot be changed here. Please contact support.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>I am a:</Label>
                      <RadioGroup
                        value={role}
                        onValueChange={(value) => setRole(value as 'student' | 'teacher')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="student" id="student" />
                          <Label htmlFor="student">Student</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="teacher" id="teacher" />
                          <Label htmlFor="teacher">Teacher</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your account details and status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Account Type</Label>
                      <p>{role === 'teacher' ? 'Teacher Account' : 'Student Account'}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Account Status</Label>
                      <p>Active</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Joined</Label>
                      <p>April 2023</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordUpdate}>
                  <CardContent className="space-y-4">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? 'Updating...' : 'Change Password'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Secure your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Two-Factor Authentication</span>
                      </div>
                      <Button variant="outline" size="sm" disabled>Coming Soon</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Verification</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Verification email sent",
                            description: "Please check your inbox for the verification link"
                          })
                        }}
                      >
                        Verify Email
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Account Deletion</span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Account deletion",
                            description: "Please contact support to delete your account",
                            variant: "destructive"
                          })
                        }}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}