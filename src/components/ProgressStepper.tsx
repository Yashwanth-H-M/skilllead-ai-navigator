import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStepId: string;
  completedStepIds: string[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStepId,
  completedStepIds,
  className = '',
  orientation = 'horizontal'
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  
  return (
    <div className={cn(
      'flex',
      orientation === 'horizontal' ? 'flex-row items-center space-x-4' : 'flex-col space-y-4',
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = completedStepIds.includes(step.id);
        const isCurrent = step.id === currentStepId;
        const isPending = !isCompleted && !isCurrent;
        
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-center',
              orientation === 'horizontal' ? 'flex-col' : 'flex-row space-x-4'
            )}
          >
            {/* Step Circle */}
            <motion.div
              className={cn(
                'progress-step',
                isCompleted && 'completed',
                isCurrent && 'active',
                isPending && 'pending'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </motion.div>

            {/* Step Content */}
            <div className={cn(
              'text-center',
              orientation === 'horizontal' ? 'mt-2' : 'text-left'
            )}>
              <h3 className={cn(
                'text-sm font-medium',
                isCurrent ? 'text-foreground' : 'text-muted-foreground',
                isCompleted && 'text-accent-foreground'
              )}>
                {step.title}
                {step.optional && (
                  <span className="text-xs text-muted-foreground ml-1">(optional)</span>
                )}
              </h3>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-24">
                  {step.description}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                'bg-border',
                orientation === 'horizontal' 
                  ? 'w-12 h-0.5 mx-2' 
                  : 'w-0.5 h-8 ml-5 my-2',
                (isCompleted || (index < currentIndex)) && 'bg-accent'
              )} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProgressStepper;