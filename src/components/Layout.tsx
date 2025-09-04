import React from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import { useUIStore } from '@/lib/stores';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
  backgroundIntensity?: 'low' | 'medium' | 'high';
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className = '', 
  showBackground = true,
  backgroundIntensity = 'medium'
}) => {
  const { loading } = useUIStore();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {showBackground && (
        <AnimatedBackground 
          intensity={backgroundIntensity}
          className="fixed inset-0 -z-10"
        />
      )}
      
      <motion.main 
        className={`relative min-h-screen ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {/* Global Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Layout;