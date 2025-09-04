import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Save, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import ProgressStepper from '@/components/ProgressStepper';
import { useAuthStore, useProfileStore } from '@/lib/stores';
import { db, type StudentProfile, type ProfessionalProfile } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

// Validation schemas
const studentSchema = z.object({
  education: z.array(z.object({
    level: z.string().min(1, "Education level is required"),
    school: z.string().min(1, "School name is required"),
    degree: z.string().min(1, "Degree is required"),
    major: z.string(),
    graduationDate: z.string(),
    gpa: z.string().optional()
  })),
  skills: z.array(z.object({
    name: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced'])
  })),
  interests: z.array(z.string()),
  preferredLocations: z.array(z.string()),
  workAuthorization: z.string()
});

const professionalSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  yearsExperience: z.number().min(0),
  skills: z.array(z.object({
    name: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
  })),
  desiredRoles: z.array(z.string()),
  preferredLocations: z.array(z.string())
});

const OnboardingProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { setProfile } = useProfileStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [skills, setSkills] = useState<Array<{ name: string; level: string }>>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' });
  const [newInterest, setNewInterest] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const isStudent = currentUser?.role === 'student';
  const schema = isStudent ? studentSchema : professionalSchema;

  // Form setup
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isStudent ? {
      education: [{ level: '', school: '', degree: '', major: '', graduationDate: '', gpa: '' }],
      skills: [],
      interests: [],
      preferredLocations: [],
      workAuthorization: ''
    } : {
      company: '',
      role: '',
      yearsExperience: 0,
      skills: [],
      desiredRoles: [],
      preferredLocations: []
    }
  });

  const steps = isStudent ? [
    { id: 'education', title: 'Education', description: 'Academic background' },
    { id: 'skills', title: 'Skills', description: 'Technical & soft skills' },
    { id: 'interests', title: 'Interests', description: 'Career interests' },
    { id: 'preferences', title: 'Preferences', description: 'Location & work style' }
  ] : [
    { id: 'experience', title: 'Experience', description: 'Work background' },
    { id: 'skills', title: 'Skills', description: 'Professional skills' },
    { id: 'goals', title: 'Goals', description: 'Career objectives' },
    { id: 'preferences', title: 'Preferences', description: 'Location & salary' }
  ];

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch(() => {
      debouncedSave();
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const debouncedSave = React.useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveProfile(true); // Silent save
        }, 2000);
      };
    },
    []
  );

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, newSkill]);
      setNewSkill({ name: '', level: 'Intermediate' });
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const addLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter(l => l !== location));
  };

  const saveProfile = async (silent = false) => {
    if (!currentUser?.id) return;

    setSaving(true);
    try {
      const formData = form.getValues();
      const now = new Date();

      if (isStudent) {
        const studentProfile: Omit<StudentProfile, 'id'> = {
          userId: currentUser.id,
          education: formData.education || [],
          projects: [], // Will be filled in additional step
          internships: [], // Will be filled in additional step
          skills: skills as Array<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }>,
          interests,
          preferredLocations: locations,
          workAuthorization: formData.workAuthorization || '',
          preferences: {
            timeline: '6-months',
            budget: 'budget-friendly',
            remote: true,
            relocation: false,
            learningStyle: 'self-paced'
          },
          status: 'draft',
          updatedAt: now
        };

        const existingProfile = await db.studentProfiles.where('userId').equals(currentUser.id).first();
        
        if (existingProfile) {
          await db.studentProfiles.update(existingProfile.id!, studentProfile);
        } else {
          await db.studentProfiles.add(studentProfile);
        }

        setProfile(studentProfile as StudentProfile, 'student');
      } else {
        const professionalProfile: Omit<ProfessionalProfile, 'id'> = {
          userId: currentUser.id,
          company: formData.company || '',
          role: formData.role || '',
          yearsExperience: formData.yearsExperience || 0,
          domains: [], // Will be filled in additional step
          projects: [], // Will be filled in additional step
          stack: [], // Will be filled in additional step
          certifications: [], // Will be filled in additional step
          skills: skills as Array<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' }>,
          desiredRoles: formData.desiredRoles || [],
          salaryRange: { min: 0, max: 0, currency: 'USD' }, // Will be filled in additional step
          preferredLocations: locations,
          preferences: {
            timeline: '6-months',
            budget: 'budget-friendly',
            remote: true,
            relocation: false,
            learningStyle: 'self-paced'
          },
          status: 'draft',
          updatedAt: now
        };

        const existingProfile = await db.professionalProfiles.where('userId').equals(currentUser.id).first();
        
        if (existingProfile) {
          await db.professionalProfiles.update(existingProfile.id!, professionalProfile);
        } else {
          await db.professionalProfiles.add(professionalProfile);
        }

        setProfile(professionalProfile as ProfessionalProfile, 'professional');
      }

      if (!silent) {
        toast({
          title: "Profile saved!",
          description: "Your information has been saved successfully."
        });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await saveProfile();
      navigate('/onboarding/additional');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'education':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Educational Background</h3>
            {/* Education fields would go here - simplified for demo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Degree Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="associate">Associate</SelectItem>
                    <SelectItem value="bachelor">Bachelor's</SelectItem>
                    <SelectItem value="master">Master's</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>School/University</Label>
                <Input placeholder="University name" />
              </div>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Professional Experience</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Company</Label>
                <Input 
                  placeholder="Company name"
                  {...form.register('company')}
                />
              </div>
              <div>
                <Label>Current Role</Label>
                <Input 
                  placeholder="Job title"
                  {...form.register('role')}
                />
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Skills & Expertise</h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Select value={newSkill.level} onValueChange={(value) => setNewSkill({ ...newSkill, level: value })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  {!isStudent && <SelectItem value="Expert">Expert</SelectItem>}
                </SelectContent>
              </Select>
              <Button onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="skill-tag">
                  {skill.name} ({skill.level})
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeSkill(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'interests':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Career Interests</h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest or field"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              />
              <Button onClick={addInterest}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <Badge key={index} variant="outline">
                  {interest}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeInterest(interest)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Career Goals</h3>
            <div>
              <Label>Desired Roles</Label>
              <Textarea placeholder="What roles are you interested in pursuing?" />
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Work Preferences</h3>
            
            <div>
              <Label>Preferred Locations</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                />
                <Button onClick={addLocation}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {locations.map((location, index) => (
                  <Badge key={index} variant="outline">
                    {location}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeLocation(location)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Build Your Profile</h1>
            <p className="text-muted-foreground">
              Tell us about yourself to get personalized career guidance
            </p>
          </div>

          {/* Progress Stepper */}
          <ProgressStepper
            steps={steps}
            currentStepId={steps[currentStep].id}
            completedStepIds={steps.slice(0, currentStep).map(s => s.id)}
            className="justify-center"
          />

          {/* Form Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {steps[currentStep].title}
                  {saving && <div className="text-sm text-muted-foreground">Saving...</div>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveProfile()}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Continue' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OnboardingProfile;