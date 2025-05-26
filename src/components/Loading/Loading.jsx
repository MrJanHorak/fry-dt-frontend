/**
 * Loading components with skeleton screens for better UX
 */

import React from 'react'
import './Loading.css'

// Generic loading spinner
export const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => (
  <div
    className={`loading-spinner loading-spinner--${size} loading-spinner--${color}`}
  >
    <div className="spinner"></div>
  </div>
)

// Loading overlay
export const LoadingOverlay = ({ message = 'Loading...', children }) => (
  <div className="loading-overlay">
    <div className="loading-overlay__content">
      <LoadingSpinner size="large" />
      <p className="loading-overlay__message">{message}</p>
      {children}
    </div>
  </div>
)

// Skeleton for word statistics
export const WordStatsSkeleton = () => (
  <div className="word-stats-skeleton">
    <div className="skeleton-header">
      <div className="skeleton-line skeleton-line--title"></div>
    </div>
    {[...Array(3)].map((_, index) => (
      <div key={index} className="skeleton-word-card">
        <div className="skeleton-line skeleton-line--word"></div>
        <div className="skeleton-line skeleton-line--stat"></div>
        <div className="skeleton-progress-bars">
          <div className="skeleton-progress"></div>
          <div className="skeleton-progress"></div>
        </div>
        <div className="skeleton-line skeleton-line--attempts"></div>
      </div>
    ))}
  </div>
)

// Skeleton for profile card
export const ProfileSkeleton = () => (
  <div className="profile-skeleton">
    <div className="skeleton-avatar"></div>
    <div className="skeleton-info">
      <div className="skeleton-line skeleton-line--name"></div>
      <div className="skeleton-line skeleton-line--email"></div>
      <div className="skeleton-line skeleton-line--role"></div>
    </div>
  </div>
)

// Skeleton for student list
export const StudentListSkeleton = ({ count = 4 }) => (
  <div className="student-list-skeleton">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="skeleton-student-card">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-student-info">
          <div className="skeleton-line skeleton-line--student-name"></div>
          <div className="skeleton-line skeleton-line--student-stats"></div>
        </div>
      </div>
    ))}
  </div>
)

// Skeleton for chat messages
export const ChatSkeleton = ({ count = 5 }) => (
  <div className="chat-skeleton">
    {[...Array(count)].map((_, index) => (
      <div
        key={index}
        className={`skeleton-message ${
          index % 2 === 0
            ? 'skeleton-message--sent'
            : 'skeleton-message--received'
        }`}
      >
        <div className="skeleton-avatar skeleton-avatar--small"></div>
        <div className="skeleton-message-content">
          <div className="skeleton-line skeleton-line--message"></div>
          <div className="skeleton-line skeleton-line--timestamp"></div>
        </div>
      </div>
    ))}
  </div>
)

// Progress indicator for multi-step processes
export const ProgressIndicator = ({ steps, currentStep, className = '' }) => (
  <div className={`progress-indicator ${className}`}>
    <div className="progress-indicator__steps">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`progress-indicator__step ${
            index < currentStep
              ? 'progress-indicator__step--completed'
              : index === currentStep
              ? 'progress-indicator__step--current'
              : 'progress-indicator__step--pending'
          }`}
        >
          <div className="progress-indicator__step-circle">
            {index < currentStep ? '✓' : index + 1}
          </div>
          <div className="progress-indicator__step-label">{step}</div>
        </div>
      ))}
    </div>
    <div className="progress-indicator__bar">
      <div
        className="progress-indicator__bar-fill"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      ></div>
    </div>
  </div>
)

// Button loading state
export const LoadingButton = ({ loading, children, disabled, ...props }) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`${props.className || ''} ${loading ? 'loading-button' : ''}`}
  >
    {loading && <LoadingSpinner size="small" />}
    <span className={loading ? 'loading-button__text' : ''}>{children}</span>
  </button>
)
