'use client'

import React, { useState, useEffect } from 'react'
import { X, Bell, MessageSquare, Dumbbell, Calendar, Clock, Volume2, Eye } from 'lucide-react'
import { NotificationPreferences, getUserNotificationPreferences, saveNotificationPreferences } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'

interface NotificationPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function NotificationPreferencesModal({ isOpen, onClose, userId }: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // Load user preferences on mount
  useEffect(() => {
    if (isOpen && userId) {
      loadPreferences()
    }
  }, [isOpen, userId])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const userPrefs = await getUserNotificationPreferences(userId)
      setPreferences(userPrefs)
    } catch (error) {
      console.error('Error loading preferences:', error)
      showToast('Failed to load notification preferences', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      const result = await saveNotificationPreferences(preferences)
      if (result.success) {
        showToast('Notification preferences saved!', 'success')
        onClose()
      } else {
        showToast(result.error || 'Failed to save preferences', 'error')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      showToast('Failed to save notification preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Customize when and how you receive notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : preferences ? (
            <div className="space-y-8">
              {/* Message Notifications */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                </div>
                <div className="space-y-3 ml-7">
                  <ToggleOption
                    label="New Messages"
                    description="Get notified when you receive new messages"
                    checked={preferences.new_messages}
                    onChange={(checked) => updatePreference('new_messages', checked)}
                  />
                  <ToggleOption
                    label="Chat Mentions"
                    description="Get notified when someone mentions you in a chat"
                    checked={preferences.chat_mentions}
                    onChange={(checked) => updatePreference('chat_mentions', checked)}
                  />
                  <ToggleOption
                    label="New Chat Invites"
                    description="Get notified when you're added to a new chat"
                    checked={preferences.new_chat_invites}
                    onChange={(checked) => updatePreference('new_chat_invites', checked)}
                  />
                </div>
              </div>

              {/* Workout Notifications */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Workouts</h3>
                </div>
                <div className="space-y-3 ml-7">
                  <ToggleOption
                    label="New Workouts"
                    description="Get notified when new workouts are assigned"
                    checked={preferences.new_workouts}
                    onChange={(checked) => updatePreference('new_workouts', checked)}
                  />
                  <SelectOption
                    label="Workout Reminders"
                    description="Remind me before workouts are due"
                    value={preferences.workout_reminders}
                    options={[
                      { value: 'off', label: 'Off' },
                      { value: '30min', label: '30 minutes before' },
                      { value: '1hour', label: '1 hour before' }
                    ]}
                    onChange={(value) => updatePreference('workout_reminders', value)}
                  />
                  <ToggleOption
                    label="Workout Completions"
                    description="Get notified when teammates complete workouts"
                    checked={preferences.workout_completions}
                    onChange={(checked) => updatePreference('workout_completions', checked)}
                  />
                </div>
              </div>

              {/* Event Notifications */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Events</h3>
                </div>
                <div className="space-y-3 ml-7">
                  <ToggleOption
                    label="New Events"
                    description="Get notified when new events are created"
                    checked={preferences.new_events}
                    onChange={(checked) => updatePreference('new_events', checked)}
                  />
                  <SelectOption
                    label="Event Reminders"
                    description="Remind me before events start"
                    value={preferences.event_reminders}
                    options={[
                      { value: 'off', label: 'Off' },
                      { value: '1hour', label: '1 hour before' },
                      { value: '1day', label: '1 day before' }
                    ]}
                    onChange={(value) => updatePreference('event_reminders', value)}
                  />
                  <ToggleOption
                    label="Event Updates"
                    description="Get notified when events are updated or cancelled"
                    checked={preferences.event_updates}
                    onChange={(checked) => updatePreference('event_updates', checked)}
                  />
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
                </div>
                <div className="space-y-3 ml-7">
                  <ToggleOption
                    label="Enable Quiet Hours"
                    description="Pause notifications during specified hours"
                    checked={preferences.quiet_hours_enabled}
                    onChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
                  />
                  {preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <TimeOption
                        label="Start Time"
                        value={preferences.quiet_hours_start}
                        onChange={(value) => updatePreference('quiet_hours_start', value)}
                      />
                      <TimeOption
                        label="End Time"
                        value={preferences.quiet_hours_end}
                        onChange={(value) => updatePreference('quiet_hours_end', value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Style */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Notification Style</h3>
                </div>
                <div className="space-y-3 ml-7">
                  <ToggleOption
                    label="Sound"
                    description="Play sound when notifications arrive"
                    checked={preferences.sound_enabled}
                    onChange={(checked) => updatePreference('sound_enabled', checked)}
                  />
                  <ToggleOption
                    label="Show Preview"
                    description="Show message content in notifications"
                    checked={preferences.show_preview}
                    onChange={(checked) => updatePreference('show_preview', checked)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load preferences</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
          >
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
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
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

function SelectOption({ label, description, value, options, onChange }: SelectOptionProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

// Time Option Component
interface TimeOptionProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function TimeOption({ label, value, onChange }: TimeOptionProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )
}
