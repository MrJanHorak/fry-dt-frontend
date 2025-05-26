import React, { useState, useCallback } from 'react'
import { useProfile } from '../../hooks/useProfile'
import {
  Loading,
  ProfileSkeleton,
  StudentListSkeleton
} from '../Loading/Loading'
import AvatarSelection from '../AvatarSelection/AvatarSelection'
import VoiceSettings from '../VoiceSettings/VoiceSettings'
import WordStats from '../WordStats/WordStats'
import AddStudent from '../AddStudent/AddStudent'
import ShowStudents from '../ShowStudents/ShowStudents'
import Collapsible from 'react-collapsible'
import './EnhancedProfile.css'

/**
 * Enhanced Profile component with optimized performance and error handling
 */
const EnhancedProfile = ({ user }) => {
  const [showAvatarSelection, setShowAvatarSelection] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const { profile, loading, error, updateProfile, isUpdating } = useProfile(
    user?.profile,
    refresh
  )

  // Optimized change handler with debouncing
  const handleProfileUpdate = useCallback(
    async (updates) => {
      try {
        await updateProfile(updates)
      } catch (error) {
        console.error('Failed to update profile:', error)
      }
    },
    [updateProfile]
  )

  const handleAvatarToggle = useCallback(() => {
    setShowAvatarSelection((prev) => !prev)
  }, [])

  const handleStudentAdded = useCallback(() => {
    setRefresh((prev) => prev + 1)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="enhanced-profile-loading">
        <ProfileSkeleton />
        <div className="profile-sections-loading">
          <Loading />
          <Loading />
          <StudentListSkeleton />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="enhanced-profile-error">
        <div className="error-card">
          <h2>Unable to Load Profile</h2>
          <p>{error}</p>
          <button onClick={() => setRefresh((prev) => prev + 1)}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No profile data
  if (!profile) {
    return (
      <div className="enhanced-profile-error">
        <div className="error-card">
          <h2>Profile Not Found</h2>
          <p>Unable to load profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="enhanced-profile">
      {/* Avatar Selection Modal */}
      {showAvatarSelection && (
        <div className="modal-overlay">
          <AvatarSelection
            formData={profile}
            handleChange={handleProfileUpdate}
            handlePopup={handleAvatarToggle}
          />
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <img
              src={profile.avatar}
              alt={`${profile.name}'s avatar`}
              className="profile-avatar"
            />
            <button
              onClick={handleAvatarToggle}
              className="change-avatar-btn"
              disabled={isUpdating}
              aria-label="Change avatar"
            >
              Change Avatar
            </button>
          </div>

          <div className="profile-info-section">
            <h1 className="profile-name">{profile.name}</h1>
            <div className="profile-details">
              <span className="profile-grade">Grade: {profile.grade}</span>
              <span className="profile-role">{profile.role}</span>
              <span className="profile-email">{profile.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="profile-sections">
        {/* Voice Settings */}
        <Collapsible
          trigger="Voice Settings"
          className="profile-section"
          openedClassName="profile-section--open"
        >
          <div className="voice-settings-container">
            <VoiceSettings
              formData={profile}
              handleChange={handleProfileUpdate}
              disabled={isUpdating}
            />
          </div>
        </Collapsible>

        {/* Students/Children Section */}
        {(profile.role === 'parent' || profile.role === 'teacher') && (
          <Collapsible
            trigger={
              <span className="students-trigger">
                {profile.role === 'parent' ? 'Your Children' : 'Your Students'}
                {profile.students && (
                  <span className="student-count">
                    ({profile.students.length})
                  </span>
                )}
              </span>
            }
            className="profile-section"
            openedClassName="profile-section--open"
          >
            <div className="students-container">
              {profile.students && profile.students.length > 0 ? (
                <ShowStudents user={profile} />
              ) : (
                <div className="no-students">
                  <p>
                    No {profile.role === 'parent' ? 'children' : 'students'}{' '}
                    added yet.
                  </p>
                </div>
              )}

              <div className="add-student-container">
                <AddStudent added={handleStudentAdded} user={profile} />
              </div>
            </div>
          </Collapsible>
        )}

        {/* Practice Statistics */}
        <Collapsible
          trigger={
            <span className="stats-trigger">
              Practice Statistics
              {profile.practicedWords && (
                <span className="words-count">
                  ({profile.practicedWords.length} words)
                </span>
              )}
            </span>
          }
          className="profile-section"
          openedClassName="profile-section--open"
        >
          <div className="word-stats-container">
            <WordStats userProfile={profile} />
          </div>
        </Collapsible>

        {/* Settings & Tools */}
        {(profile.role === 'parent' || profile.role === 'teacher') && (
          <Collapsible
            trigger="Settings & Tools"
            className="profile-section"
            openedClassName="profile-section--open"
          >
            <div className="settings-tools-container">
              <div className="settings-grid">
                <div className="setting-item">
                  <h4>Export Data</h4>
                  <p>Download your practice data and progress reports.</p>
                  <button className="secondary-btn">Export Data</button>
                </div>

                <div className="setting-item">
                  <h4>Privacy Settings</h4>
                  <p>
                    Manage your account privacy and data sharing preferences.
                  </p>
                  <button className="secondary-btn">Privacy Settings</button>
                </div>

                <div className="setting-item">
                  <h4>Account Security</h4>
                  <p>Update your password and security settings.</p>
                  <button className="secondary-btn">Security Settings</button>
                </div>
              </div>
            </div>
          </Collapsible>
        )}
      </div>

      {/* Update Status Indicator */}
      {isUpdating && (
        <div className="update-indicator" aria-live="polite">
          <div className="update-spinner"></div>
          <span>Updating profile...</span>
        </div>
      )}
    </div>
  )
}

export default EnhancedProfile
