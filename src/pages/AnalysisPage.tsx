import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle, Clock, Lightbulb, Target, TrendingUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { useAuthStore, useProfileStore, useAnalysisStore, useSettingsStore } from '@/lib/stores';
import { generateCareerAnalysis, mockAnalysisData } from '@/lib/openai';
import { db } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { profile, profileType } = useProfileStore();
  const { analysis, isAnalyzing, analysisStep, progress, setAnalysis, setAnalyzing, setAnalysisStep, setProgress } = useAnalysisStore();
  const { isKeyValid } = useSettingsStore();
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (!analysis && profile && currentUser) {
      startAnalysis();
    }
  }, [profile, currentUser]);

  const analysisSteps = [
    { id: 'understanding', title: 'Understanding Your Profile', icon: Brain },
    { id: 'clarifying', title: 'Identifying Opportunities', icon: Lightbulb },
    { id: 'exploring', title: 'Exploring Career Paths', icon: Target },
    { id: 'planning', title: 'Creating Plans A, B, C', icon: TrendingUp },
    { id: 'deep-dive', title: 'Deep Dive Analysis', icon: CheckCircle },
    { id: 'complete', title: 'Analysis Complete', icon: CheckCircle }
  ];

  const startAnalysis = async (useDemoMode = false) => {
    if (!profile || !currentUser?.id || !profileType) return;

    setDemoMode(useDemoMode);
    setAnalyzing(true);
    setProgress(0);

    try {
      // Simulate analysis steps
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(analysisSteps[i].id as any);
        setProgress((i + 1) * (100 / analysisSteps.length));
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, useDemoMode ? 800 : 2000));
      }

      let analysisResult;
      
      if (useDemoMode || !isKeyValid) {
        // Use mock data for demo
        analysisResult = mockAnalysisData;
        toast({
          title: "Demo Analysis Complete",
          description: "Using sample data. Configure your OpenAI key for personalized analysis."
        });
      } else {
        // Generate real analysis with OpenAI
        analysisResult = await generateCareerAnalysis(
          profile,
          profileType,
          (step, prog) => {
            setProgress(prog);
          }
        );
      }

      // Save analysis to database
      const analysisRecord = {
        userId: currentUser.id,
        status: 'complete' as const,
        clarifications: analysisResult.clarifications || [],
        interestsConfirmed: analysisResult.interestsConfirmed || true,
        plans: analysisResult.plans,
        planADeepDive: analysisResult.planADeepDive,
        summary: analysisResult.summary,
        roadmap: analysisResult.roadmap,
        latest: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Mark previous analyses as not latest
      await db.analyses.where({ userId: currentUser.id, latest: true }).modify({ latest: false });
      
      // Add new analysis
      await db.analyses.add(analysisRecord);
      setAnalysis(analysisRecord as any);

      setAnalysisStep('complete');
      setProgress(100);
      
      toast({
        title: "Analysis Complete!",
        description: "Your personalized career roadmap is ready."
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again or use demo mode.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChatNavigation = () => {
    navigate('/chat');
  };

  const handleRetryAnalysis = () => {
    startAnalysis(false);
  };

  const handleDemoMode = () => {
    startAnalysis(true);
  };

  if (isAnalyzing) {
    const currentStepIndex = analysisSteps.findIndex(step => step.id === analysisStep);
    const currentStepData = analysisSteps[currentStepIndex] || analysisSteps[0];

    return (
      <Layout backgroundIntensity="low">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-2xl space-y-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Progress Header */}
            <div className="space-y-4">
              <motion.div
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-10 h-10 text-primary" />
              </motion.div>
              
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  Analyzing Your Career Path
                </h1>
                <p className="text-muted-foreground">
                  Our AI is creating your personalized career roadmap
                </p>
              </div>
            </div>

            {/* Current Step */}
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <currentStepData.icon className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                </div>
                
                <Progress value={progress} className="w-full mb-4" />
                
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </CardContent>
            </Card>

            {/* Analysis Timeline */}
            <div className="space-y-2">
              {analysisSteps.map((step, index) => {
                const isActive = step.id === analysisStep;
                const isCompleted = index < currentStepIndex;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 
                      isCompleted ? 'bg-accent/10 text-accent' : 
                      'text-muted-foreground'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{step.title}</span>
                    {isCompleted && <CheckCircle className="w-4 h-4 ml-auto" />}
                    {isActive && <Clock className="w-4 h-4 ml-auto animate-spin" />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (analysis) {
    return (
      <Layout>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-8 h-8 text-accent" />
              </motion.div>
              <h1 className="text-3xl font-bold">Your Career Analysis</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Based on your profile, we've identified three potential career paths and created a detailed roadmap for your top choice.
              </p>
            </div>

            {/* Career Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {['A', 'B', 'C'].map((planLetter, index) => {
                const plan = analysis.plans[planLetter as keyof typeof analysis.plans];
                if (!plan) return null;

                const isPrimaryPlan = planLetter === 'A';

                return (
                  <motion.div
                    key={planLetter}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className={`plan-card group h-full ${isPrimaryPlan ? 'selected' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-primary">
                              Plan {planLetter}
                            </span>
                            {isPrimaryPlan && (
                              <Badge variant="secondary">Recommended</Badge>
                            )}
                          </CardTitle>
                          {'fitScore' in plan && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-accent">
                                {plan.fitScore}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Fit Score
                              </div>
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-lg font-medium">
                          {plan.title}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {plan.rationale}
                        </p>
                        
                        {'roles' in plan && plan.roles && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Key Roles:</h4>
                            <div className="flex flex-wrap gap-1">
                              {plan.roles.slice(0, 3).map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Plan A Deep Dive */}
            {analysis.planADeepDive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-xl">Plan A: Deep Dive Analysis</CardTitle>
                    <CardDescription>
                      Comprehensive analysis of your recommended career path
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Market Outlook</h4>
                        <p className="text-sm text-muted-foreground">
                          {analysis.planADeepDive.marketOutlook}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Future Demand</h4>
                        <p className="text-sm text-muted-foreground">
                          {analysis.planADeepDive.futureDemand}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Learning Timeline</h4>
                      <div className="space-y-4">
                        {[
                          { period: '0-3 Months', items: analysis.planADeepDive.timeline.month0_3 },
                          { period: '3-6 Months', items: analysis.planADeepDive.timeline.month3_6 },
                          { period: '6-12 Months', items: analysis.planADeepDive.timeline.month6_12 }
                        ].map((phase) => (
                          <div key={phase.period} className="timeline-item">
                            <h5 className="font-medium text-sm mb-2">{phase.period}</h5>
                            <ul className="space-y-1">
                              {phase.items.map((item, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button onClick={handleChatNavigation} size="lg">
                <MessageCircle className="w-4 h-4 mr-2" />
                Discuss with AI Assistant
              </Button>
              <Button variant="outline" onClick={handleRetryAnalysis}>
                Re-analyze Profile
              </Button>
              {demoMode && (
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  Configure API Key for Real Analysis
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  // Initial state - no analysis yet
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">Ready for Analysis</h1>
            <p className="text-muted-foreground">
              Let's analyze your profile and create your personalized career roadmap
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleRetryAnalysis} size="lg" className="w-full">
              Start Career Analysis
            </Button>
            <Button onClick={handleDemoMode} variant="outline" className="w-full">
              Try Demo Mode
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Demo mode uses sample data. Configure your OpenAI API key for personalized analysis.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AnalysisPage;