import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/lib/stores';
import { db } from '@/lib/db';

const OnboardingRole: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuthStore();

  const handleRoleSelection = async (role: 'student' | 'professional') => {
    if (!currentUser) return;

    try {
      // Update user's role in database
      await db.users.update(currentUser.id!, { 
        role, 
        updatedAt: new Date() 
      });

      // Update store
      setCurrentUser({ ...currentUser, role });

      // Navigate to profile building
      navigate('/onboarding/profile');
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const roleCards = [
    {
      id: 'student',
      title: 'Student',
      description: 'I am currently studying or recently graduated',
      icon: GraduationCap,
      features: [
        'Education and academic background',
        'Projects and internships',
        'Learning goals and interests',
        'Entry-level career guidance'
      ],
      gradient: 'from-blue-500/10 to-purple-500/10'
    },
    {
      id: 'professional',
      title: 'Working Professional',
      description: 'I have work experience and am looking to advance',
      icon: Briefcase,
      features: [
        'Professional experience and skills',
        'Career progression goals',
        'Industry transition guidance',
        'Advanced role recommendations'
      ],
      gradient: 'from-green-500/10 to-blue-500/10'
    }
  ];

  return (
    <Layout backgroundIntensity="medium">
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.h1 
              className="text-3xl font-bold text-foreground"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              What best describes you?
            </motion.h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose your current status to get personalized career guidance tailored to your experience level
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {roleCards.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`plan-card bg-gradient-to-br ${role.gradient} cursor-pointer h-full group`}
                  onClick={() => handleRoleSelection(role.id as 'student' | 'professional')}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <role.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{role.title}</CardTitle>
                    <CardDescription className="text-base">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        What we'll help you with:
                      </h4>
                      <ul className="space-y-2">
                        {role.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-sm font-medium text-primary">
                        Get Started
                      </span>
                      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground">
              Don't worry, you can always update this later in your profile
            </p>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OnboardingRole;