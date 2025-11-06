'use client'

import React, { useState, useEffect } from 'react'
import { X, Settings, Palette, Info, Bell, Sun, Moon, Clock, Calendar, Type, Smartphone } from 'lucide-react'
import { UserPreferences } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenNotifications: () => void
  userId: string
}

export default function SettingsModal({ isOpen, onClose, onOpenNotifications, userId }: SettingsModalProps) {
  const { preferences, updatePreferences, theme, actualTheme, isLoading } = useTheme()
  const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // Load preferences when modal opens
  useEffect(() => {
    if (isOpen && preferences) {
      setLocalPreferences({ ...preferences })
    }
  }, [isOpen, preferences])

  const handleSave = async () => {
    if (!localPreferences) return

    setSaving(true)
    try {
      await updatePreferences(localPreferences)
      showToast('Settings saved successfully!', 'success')
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateLocalPreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!localPreferences) return
    setLocalPreferences({
      ...localPreferences,
      [key]: value
    })
  }

  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      default: return <Sun className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">Customize your app experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {isLoading || !localPreferences ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Appearance Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
                </div>
                <div className="space-y-4 ml-7">
                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
                        { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateLocalPreference('theme', option.value as any)}
                          className={`flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                            localPreferences.theme === option.value
                              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${
                            localPreferences.theme === option.value
                              ? 'bg-blue-500 dark:bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                          }`}>
                            {option.icon}
                          </div>
                          <span className={`text-sm font-medium ${
                            localPreferences.theme === option.value
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <SelectOption
                    label="Font Size"
                    description="Choose your preferred text size"
                    icon={<Type className="h-4 w-4" />}
                    value={localPreferences.font_size}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' }
                    ]}
                    onChange={(value) => updateLocalPreference('font_size', value as any)}
                  />
                </div>
              </div>

              {/* App Preferences Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">App Preferences</h3>
                </div>
                <div className="space-y-4 ml-7">
                  <SelectOption
                    label="Time Format"
                    description="How time is displayed throughout the app"
                    icon={<Clock className="h-4 w-4" />}
                    value={localPreferences.time_format}
                    options={[
                      { value: '12hr', label: '12-hour (2:30 PM)' },
                      { value: '24hr', label: '24-hour (14:30)' }
                    ]}
                    onChange={(value) => updateLocalPreference('time_format', value as any)}
                  />

                  <SelectOption
                    label="Date Format"
                    description="How dates are displayed throughout the app"
                    icon={<Calendar className="h-4 w-4" />}
                    value={localPreferences.date_format}
                    options={[
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/25/2024)' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (25/12/2024)' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-25)' }
                    ]}
                    onChange={(value) => updateLocalPreference('date_format', value as any)}
                  />

                  <ToggleOption
                    label="Auto-refresh"
                    description="Automatically refresh data in real-time"
                    checked={localPreferences.auto_refresh}
                    onChange={(checked) => updateLocalPreference('auto_refresh', checked)}
                  />
                </div>
              </div>

              {/* Notifications Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                </div>
                <div className="ml-7">
                  <button
                    onClick={() => {
                      onClose()
                      onOpenNotifications()
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notification Preferences</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-300">Manage alerts and notifications</p>
                      </div>
                    </div>
                    <div className="text-gray-400 dark:text-gray-500">→</div>
                  </button>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">About</h3>
                </div>
                <div className="space-y-3 ml-7">
                  <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">App Version</span>
                      <span className="text-sm text-gray-500 dark:text-gray-300">2.0.0</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
                      Terms of Service
                    </button>
                    <button className="w-full text-left p-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
                      Privacy Policy
                    </button>
                    <button className="w-full text-left p-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="px-6 py-3 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Toggle Option Component
interface ToggleOptionProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-300">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

// Select Option Component
interface SelectOptionProps {
  label: string
  description: string
  icon?: React.ReactNode
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}

function SelectOption({ label, description, icon, value, options, onChange, disabled }: SelectOptionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {icon && <div className="text-gray-500 dark:text-gray-300">{icon}</div>}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-300">{description}</p>
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
