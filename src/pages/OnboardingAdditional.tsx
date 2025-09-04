import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Layout from '@/components/Layout';
import { useAuthStore, useProfileStore } from '@/lib/stores';
import { toast } from '@/hooks/use-toast';

const OnboardingAdditional: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { profile, profileType, updateProfile } = useProfileStore();
  const [preferences, setPreferences] = useState<{
    timeline: '3-months' | '6-months' | '12-months';
    budget: 'free' | 'budget-friendly' | 'premium';
    remote: boolean;
    relocation: boolean;
    learningStyle: 'self-paced' | 'structured' | 'mentored';
  }>({
    timeline: '6-months',
    budget: 'budget-friendly',
    remote: true,
    relocation: false,
    learningStyle: 'self-paced'
  });
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleCompleteProfile = async () => {
    setIsConfirming(true);
    
    try {
      // Update profile with preferences and mark as confirmed
      updateProfile({
        preferences,
        status: 'confirmed'
      });

      toast({
        title: "Profile completed!",
        description: "Your profile is ready for AI analysis. Let's explore your career options."
      });

      // Navigate to analysis page
      navigate('/analysis');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const profileSummary = {
    student: {
      title: "Student Profile Summary",
      items: [
        `Education: ${(profile as any)?.education?.[0]?.degree || 'Not specified'}`,
        `Skills: ${profile?.skills?.length || 0} listed`,
        `Interests: ${(profile as any)?.interests?.length || 0} areas`,
        `Locations: ${profile?.preferredLocations?.length || 0} preferred`
      ]
    },
    professional: {
      title: "Professional Profile Summary", 
      items: [
        `Experience: ${(profile as any)?.yearsExperience || 0} years`,
        `Current Role: ${(profile as any)?.role || 'Not specified'}`,
        `Skills: ${profile?.skills?.length || 0} listed`,
        `Locations: ${profile?.preferredLocations?.length || 0} preferred`
      ]
    }
  };

  const currentSummary = profileType ? profileSummary[profileType] : profileSummary.student;

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-8 h-8 text-accent" />
            </motion.div>
            <h1 className="text-3xl font-bold">Almost Ready!</h1>
            <p className="text-muted-foreground">
              Let's finalize your preferences and confirm your profile
            </p>
          </div>

          {/* Profile Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle>{currentSummary.title}</CardTitle>
                <CardDescription>
                  Review your information before we analyze your career options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSummary.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle>Career Preferences</CardTitle>
                <CardDescription>
                  Help us tailor our recommendations to your goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Timeline for Career Transition</Label>
                    <Select 
                      value={preferences.timeline} 
                      onValueChange={(value) => setPreferences({ ...preferences, timeline: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-months">3 months</SelectItem>
                        <SelectItem value="6-months">6 months</SelectItem>
                        <SelectItem value="12-months">12+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Budget for Learning & Development</Label>
                    <Select 
                      value={preferences.budget} 
                      onValueChange={(value) => setPreferences({ ...preferences, budget: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free resources only</SelectItem>
                        <SelectItem value="budget-friendly">Budget-friendly ($0-500)</SelectItem>
                        <SelectItem value="premium">Premium courses & bootcamps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Learning Style</Label>
                    <Select 
                      value={preferences.learningStyle} 
                      onValueChange={(value) => setPreferences({ ...preferences, learningStyle: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self-paced">Self-paced online</SelectItem>
                        <SelectItem value="structured">Structured courses</SelectItem>
                        <SelectItem value="mentored">Mentored/guided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remote"
                      checked={preferences.remote}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, remote: !!checked })}
                    />
                    <Label htmlFor="remote">
                      Open to remote work opportunities
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="relocation"
                      checked={preferences.relocation}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, relocation: !!checked })}
                    />
                    <Label htmlFor="relocation">
                      Willing to relocate for the right opportunity
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-info">
                    Additional Information (Optional)
                  </Label>
                  <Textarea
                    id="additional-info"
                    placeholder="Any specific constraints, goals, or context you'd like us to consider?"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-4"
          >
            <Card className="glass border-accent/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Ready for AI Analysis</h3>
                    <p className="text-muted-foreground text-sm">
                      We'll analyze your profile and create personalized career plans
                    </p>
                  </div>
                  <Button 
                    onClick={handleCompleteProfile}
                    disabled={isConfirming}
                    size="lg"
                    className="w-full"
                  >
                    {isConfirming ? 'Processing...' : 'Start Career Analysis'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted-foreground"
          >
            <p>Don't worry - you can always update your profile and preferences later</p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default OnboardingAdditional;