import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  TestTube, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Settings,
  Database,
  Zap,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Layout from '@/components/Layout';
import { useSettingsStore } from '@/lib/stores';
import { setApiKey, clearApiKey, testApiKey } from '@/lib/openai';
import { exportAllData, importData } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const { 
    settings, 
    openaiKey, 
    isKeyValid, 
    animationsEnabled,
    setOpenaiKey,
    setKeyValid,
    toggleAnimations,
    updateSetting
  } = useSettingsStore();

  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [storageType, setStorageType] = useState<'session' | 'encrypted_local'>('session');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    setTempApiKey(openaiKey);
    if (settings) {
      setStorageType(settings.openaiKeyStored as any || 'session');
      setTheme(settings.theme || 'system');
    }
  }, [openaiKey, settings]);

  const handleSaveApiKey = async () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key.",
        variant: "destructive"
      });
      return;
    }

    try {
      setApiKey(tempApiKey, storageType === 'encrypted_local');
      toast({
        title: "API Key Saved",
        description: `Your API key has been saved ${storageType === 'encrypted_local' ? 'with encryption' : 'for this session'}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTestApiKey = async () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key first.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingKey(true);
    try {
      const isValid = await testApiKey(tempApiKey);
      setKeyValid(isValid);
      
      toast({
        title: isValid ? "API Key Valid" : "API Key Invalid",
        description: isValid 
          ? "Your API key is working correctly!" 
          : "The API key is invalid or has no access to the required models.",
        variant: isValid ? "default" : "destructive"
      });
    } catch (error) {
      setKeyValid(false);
      toast({
        title: "Test Failed",
        description: "Unable to test API key. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setTempApiKey('');
    toast({
      title: "API Key Cleared",
      description: "Your API key has been removed from storage."
    });
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skilllead-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your data has been exported successfully."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await importData(data);
        
        toast({
          title: "Data Imported",
          description: "Your data has been imported successfully. Please refresh the page."
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid backup file or import failed. Please try again.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (confirm("Are you sure you want to clear all local data? This action cannot be undone.")) {
      try {
        // Clear all IndexedDB data
        await Promise.all([
          indexedDB.deleteDatabase('SkillLeadDB')
        ]);
        
        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        toast({
          title: "Data Cleared",
          description: "All local data has been cleared. Please refresh the page."
        });
        
        // Reload the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        toast({
          title: "Clear Failed",
          description: "Failed to clear data. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure your SkillLead.AI experience
            </p>
          </div>

          {/* OpenAI API Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>OpenAI API Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure your OpenAI API key for personalized career analysis and chat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="sk-..."
                          value={tempApiKey}
                          onChange={(e) => setTempApiKey(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button 
                        onClick={handleTestApiKey} 
                        disabled={isTestingKey || !tempApiKey.trim()}
                        variant="outline"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        {isTestingKey ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                    
                    {/* API Key Status */}
                    {openaiKey && (
                      <div className="flex items-center space-x-2 text-sm">
                        {isKeyValid ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-accent" />
                            <span className="text-accent">API key is valid</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-destructive" />
                            <span className="text-destructive">API key needs testing</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Storage Option</Label>
                    <Select value={storageType} onValueChange={(value: any) => setStorageType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="session">Session only (cleared when browser closes)</SelectItem>
                        <SelectItem value="encrypted_local">Encrypted local storage (persistent)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {storageType === 'session' 
                        ? 'Key will be cleared when you close the browser'
                        : 'Key will be encrypted and stored locally (requires passphrase)'
                      }
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleSaveApiKey}>
                      Save API Key
                    </Button>
                    {openaiKey && (
                      <Button variant="outline" onClick={handleClearApiKey}>
                        Clear Key
                      </Button>
                    )}
                  </div>
                </div>

                <Alert>
                  <Key className="w-4 h-4" />
                  <AlertDescription>
                    Your API key is never sent to our servers. It's stored locally and used directly with OpenAI's API.
                    Get your API key from{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      OpenAI's platform
                    </a>.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* App Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>App Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your SkillLead.AI experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={animationsEnabled}
                    onCheckedChange={toggleAnimations}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={(value: any) => {
                    setTheme(value);
                    updateSetting('theme', value);
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center space-x-2">
                          <Sun className="w-4 h-4" />
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center space-x-2">
                          <Moon className="w-4 h-4" />
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center space-x-2">
                          <Monitor className="w-4 h-4" />
                          <span>System</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Data Management</span>
                </CardTitle>
                <CardDescription>
                  Backup, restore, or clear your local data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleExportData} variant="outline" className="h-auto py-3">
                    <div className="flex flex-col items-center space-y-1">
                      <Download className="w-5 h-5" />
                      <span className="font-medium">Export Data</span>
                      <span className="text-xs text-muted-foreground">Download backup file</span>
                    </div>
                  </Button>

                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      style={{ display: 'none' }}
                      id="import-input"
                    />
                    <Button 
                      variant="outline" 
                      className="h-auto py-3 w-full"
                      onClick={() => document.getElementById('import-input')?.click()}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Upload className="w-5 h-5" />
                        <span className="font-medium">Import Data</span>
                        <span className="text-xs text-muted-foreground">Restore from backup</span>
                      </div>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    onClick={handleClearAllData} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Local Data
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    This will permanently delete all profiles, analyses, and chat history stored locally.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Alert>
              <Database className="w-4 h-4" />
              <AlertDescription>
                <strong>Privacy First:</strong> All your data stays on your device. We don't collect, store, or transmit any personal information. 
                Your profiles, analyses, and chat history are stored locally in your browser's IndexedDB.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;