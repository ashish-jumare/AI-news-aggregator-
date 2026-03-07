import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  
  // Settings state
  const [settings, setSettings] = useState({
    // General
    autoRefresh: true,
    refreshInterval: 5, // minutes
    articlesPerPage: 20,
    maxArticles: 200, // NEW: Total articles to fetch from backend
    language: 'en',
    
    // Notifications
    enableNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
    notifyOnNewArticle: true,
    notifyOnSentimentChange: false,
    
    // Display
    compactView: false,
    showThumbnails: true,
    showSources: true,
    showTimestamps: true,
    
    // Data & Privacy
    cacheEnabled: true,
    cacheDuration: 5, // minutes
    trackAnalytics: true,
    saveHistory: true,
    
    // API Settings
    twitterCacheTime: 5, // minutes
    maxTweetsPerRequest: 10,
    enableRateLimitWarnings: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('⚙️ Settings saved successfully!');
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        autoRefresh: true,
        refreshInterval: 5,
        articlesPerPage: 20,
        maxArticles: 200,
        language: 'en',
        enableNotifications: true,
        emailNotifications: false,
        pushNotifications: true,
        notifyOnNewArticle: true,
        notifyOnSentimentChange: false,
        compactView: false,
        showThumbnails: true,
        showSources: true,
        showTimestamps: true,
        cacheEnabled: true,
        cacheDuration: 5,
        trackAnalytics: true,
        saveHistory: true,
        twitterCacheTime: 5,
        maxTweetsPerRequest: 10,
        enableRateLimitWarnings: true,
      };
      setSettings(defaultSettings);
      localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
      alert('✅ Settings reset to defaults!');
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs & Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <TabButton
              active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
              label="General"
            />
            <TabButton
              active={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
              label="Notifications"
            />
            <TabButton
              active={activeTab === 'display'}
              onClick={() => setActiveTab('display')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              label="Display"
            />
            <TabButton
              active={activeTab === 'data'}
              onClick={() => setActiveTab('data')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              }
              label="Data & Privacy"
            />
            <TabButton
              active={activeTab === 'api'}
              onClick={() => setActiveTab('api')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="API Settings"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <SettingSection title="General Settings">
                  <ToggleSetting
                    label="Auto Refresh"
                    description="Automatically refresh news feed"
                    checked={settings.autoRefresh}
                    onChange={(checked) => updateSetting('autoRefresh', checked)}
                  />
                  
                  <SelectSetting
                    label="Refresh Interval"
                    description="How often to refresh the news feed"
                    value={settings.refreshInterval}
                    onChange={(value) => updateSetting('refreshInterval', parseInt(value))}
                    options={[
                      { value: 1, label: '1 minute' },
                      { value: 5, label: '5 minutes' },
                      { value: 10, label: '10 minutes' },
                      { value: 15, label: '15 minutes' },
                      { value: 30, label: '30 minutes' },
                    ]}
                  />

                  <SelectSetting
                    label="Articles Per Page"
                    description="Number of articles to display per page"
                    value={settings.articlesPerPage}
                    onChange={(value) => updateSetting('articlesPerPage', parseInt(value))}
                    options={[
                      { value: 10, label: '10 articles' },
                      { value: 20, label: '20 articles' },
                      { value: 50, label: '50 articles' },
                      { value: 100, label: '100 articles' },
                    ]}
                  />

                  <SelectSetting
                    label="Max Articles to Fetch"
                    description="Total number of articles to fetch from backend (affects loading time)"
                    value={settings.maxArticles}
                    onChange={(value) => updateSetting('maxArticles', parseInt(value))}
                    options={[
                      { value: 20, label: '20 articles (Fast)' },
                      { value: 50, label: '50 articles (Balanced)' },
                      { value: 100, label: '100 articles (More Data)' },
                      { value: 200, label: '200 articles (Complete)' },
                    ]}
                  />

                  <SelectSetting
                    label="Language"
                    description="Preferred language for interface"
                    value={settings.language}
                    onChange={(value) => updateSetting('language', value)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'hi', label: 'Hindi' },
                      { value: 'mr', label: 'Marathi' },
                      { value: 'ta', label: 'Tamil' },
                      { value: 'te', label: 'Telugu' },
                    ]}
                  />

                  <div className="pt-4">
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isDark ? (
                          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                        )}
                        <div className="text-left">
                          <div className="font-medium text-gray-800 dark:text-white">Theme</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Current: {isDark ? 'Dark' : 'Light'} Mode
                          </div>
                        </div>
                      </div>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Toggle</span>
                    </button>
                  </div>
                </SettingSection>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <SettingSection title="Notification Preferences">
                  <ToggleSetting
                    label="Enable Notifications"
                    description="Master switch for all notifications"
                    checked={settings.enableNotifications}
                    onChange={(checked) => updateSetting('enableNotifications', checked)}
                  />
                  
                  <ToggleSetting
                    label="Email Notifications"
                    description="Receive notifications via email"
                    checked={settings.emailNotifications}
                    onChange={(checked) => updateSetting('emailNotifications', checked)}
                    disabled={!settings.enableNotifications}
                  />

                  <ToggleSetting
                    label="Push Notifications"
                    description="Receive push notifications in browser"
                    checked={settings.pushNotifications}
                    onChange={(checked) => updateSetting('pushNotifications', checked)}
                    disabled={!settings.enableNotifications}
                  />

                  <ToggleSetting
                    label="New Article Alerts"
                    description="Notify when new articles are published"
                    checked={settings.notifyOnNewArticle}
                    onChange={(checked) => updateSetting('notifyOnNewArticle', checked)}
                    disabled={!settings.enableNotifications}
                  />

                  <ToggleSetting
                    label="Sentiment Change Alerts"
                    description="Notify when sentiment analysis detects significant changes"
                    checked={settings.notifyOnSentimentChange}
                    onChange={(checked) => updateSetting('notifyOnSentimentChange', checked)}
                    disabled={!settings.enableNotifications}
                  />
                </SettingSection>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-6">
                <SettingSection title="Display Preferences">
                  <ToggleSetting
                    label="Compact View"
                    description="Show articles in a more compact layout"
                    checked={settings.compactView}
                    onChange={(checked) => updateSetting('compactView', checked)}
                  />

                  <ToggleSetting
                    label="Show Thumbnails"
                    description="Display article thumbnails and images"
                    checked={settings.showThumbnails}
                    onChange={(checked) => updateSetting('showThumbnails', checked)}
                  />

                  <ToggleSetting
                    label="Show Sources"
                    description="Display the source of each article"
                    checked={settings.showSources}
                    onChange={(checked) => updateSetting('showSources', checked)}
                  />

                  <ToggleSetting
                    label="Show Timestamps"
                    description="Display publication dates and times"
                    checked={settings.showTimestamps}
                    onChange={(checked) => updateSetting('showTimestamps', checked)}
                  />
                </SettingSection>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <SettingSection title="Data & Privacy Settings">
                  <ToggleSetting
                    label="Enable Caching"
                    description="Cache data locally for faster loading"
                    checked={settings.cacheEnabled}
                    onChange={(checked) => updateSetting('cacheEnabled', checked)}
                  />

                  <SelectSetting
                    label="Cache Duration"
                    description="How long to keep cached data"
                    value={settings.cacheDuration}
                    onChange={(value) => updateSetting('cacheDuration', parseInt(value))}
                    options={[
                      { value: 1, label: '1 minute' },
                      { value: 5, label: '5 minutes' },
                      { value: 10, label: '10 minutes' },
                      { value: 30, label: '30 minutes' },
                      { value: 60, label: '1 hour' },
                    ]}
                    disabled={!settings.cacheEnabled}
                  />

                  <ToggleSetting
                    label="Track Analytics"
                    description="Allow anonymous usage analytics to improve the app"
                    checked={settings.trackAnalytics}
                    onChange={(checked) => updateSetting('trackAnalytics', checked)}
                  />

                  <ToggleSetting
                    label="Save History"
                    description="Save your browsing history and preferences"
                    checked={settings.saveHistory}
                    onChange={(checked) => updateSetting('saveHistory', checked)}
                  />

                  <div className="pt-4 space-y-3">
                    <button
                      onClick={() => {
                        localStorage.clear();
                        alert('🗑️ All local data cleared!');
                      }}
                      className="w-full p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                    >
                      Clear All Local Data
                    </button>
                  </div>
                </SettingSection>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <SettingSection title="Twitter API Settings">
                  <SelectSetting
                    label="Twitter Cache Time"
                    description="How long to cache Twitter data"
                    value={settings.twitterCacheTime}
                    onChange={(value) => updateSetting('twitterCacheTime', parseInt(value))}
                    options={[
                      { value: 1, label: '1 minute' },
                      { value: 5, label: '5 minutes' },
                      { value: 10, label: '10 minutes' },
                      { value: 15, label: '15 minutes' },
                      { value: 30, label: '30 minutes' },
                    ]}
                  />

                  <SelectSetting
                    label="Max Tweets Per Request"
                    description="Maximum number of tweets to fetch"
                    value={settings.maxTweetsPerRequest}
                    onChange={(value) => updateSetting('maxTweetsPerRequest', parseInt(value))}
                    options={[
                      { value: 5, label: '5 tweets' },
                      { value: 10, label: '10 tweets' },
                      { value: 15, label: '15 tweets' },
                      { value: 20, label: '20 tweets' },
                    ]}
                  />

                  <ToggleSetting
                    label="Rate Limit Warnings"
                    description="Show warnings when approaching API rate limits"
                    checked={settings.enableRateLimitWarnings}
                    onChange={(checked) => updateSetting('enableRateLimitWarnings', checked)}
                  />

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">API Rate Limits</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• Twitter API: 15 requests per 15 minutes</li>
                      <li>• Monthly limit: 500,000 tweets</li>
                      <li>• Caching reduces API usage by ~90%</li>
                    </ul>
                  </div>
                </SettingSection>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                saveSettings();
                if (onSettingsSaved) {
                  onSettingsSaved();
                }
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function SettingSection({ title, children }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <div className="font-medium text-gray-800 dark:text-white">{label}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'transform translate-x-7' : ''
          }`}
        />
      </button>
    </div>
  );
}

function SelectSetting({ label, description, value, onChange, options, disabled }) {
  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <div className="font-medium text-gray-800 dark:text-white mb-1">{label}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
