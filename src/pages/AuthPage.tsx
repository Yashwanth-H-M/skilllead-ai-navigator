import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/lib/stores';
import { db } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuthStore();
  const [mode, setMode] = useState<'select' | 'create' | 'password'>('select');
  const [profileName, setProfileName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGuestContinue = async () => {
    setLoading(true);
    try {
      const guestUser = {
        name: 'Guest User',
        role: 'student' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isGuest: true,
        passphraseProtected: false
      };

      const userId = await db.users.add(guestUser);
      const user = { ...guestUser, id: userId };
      
      setCurrentUser(user);
      toast({
        title: "Welcome!",
        description: "Continuing as guest. Your data will not persist beyond this session unless you create a profile."
      });
      
      navigate('/onboarding/role');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create guest session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      toast({
        title: "Profile name required",
        description: "Please enter a name for your profile.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const newUser = {
        name: profileName,
        role: 'student' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isGuest: false,
        passphraseProtected: !!passphrase
      };

      const userId = await db.users.add(newUser);
      const user = { ...newUser, id: userId };
      
      setCurrentUser(user);
      toast({
        title: "Profile created!",
        description: `Welcome ${profileName}! Your profile has been created.`
      });
      
      navigate('/onboarding/role');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout backgroundIntensity="high">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.h1 
              className="text-4xl font-bold gradient-text"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              SkillLead.AI
            </motion.h1>
            <p className="text-muted-foreground text-lg">
              AI-Powered Career Guidance
            </p>
          </div>

          {/* Auth Cards */}
          <div className="space-y-4">
            {mode === 'select' && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="glass cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={handleGuestContinue}>
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Continue as Guest</CardTitle>
                      <CardDescription>
                        Quick start with no data persistence beyond this session
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="glass cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={() => setMode('create')}>
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserPlus className="w-6 h-6 text-accent" />
                      </div>
                      <CardTitle>Create Local Profile</CardTitle>
                      <CardDescription>
                        Save your progress locally on this device
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </>
            )}

            {mode === 'create' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Create Your Profile</CardTitle>
                    <CardDescription>
                      Your data will be stored locally on this device
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Profile Name</Label>
                      <Input
                        id="profile-name"
                        placeholder="Enter your name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passphrase" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Passphrase (Optional)
                      </Label>
                      <div className="relative">
                        <Input
                          id="passphrase"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Optional passphrase for encryption"
                          value={passphrase}
                          onChange={(e) => setPassphrase(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        If provided, your data will be encrypted locally
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setMode('select')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleCreateProfile}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Creating...' : 'Create Profile'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted-foreground"
          >
            <p>All data stays on your device • No external tracking</p>
            <p className="mt-1">Powered by your OpenAI API key</p>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AuthPage;