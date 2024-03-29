import React, { useEffect, useRef, useState } from 'react'
// import { createPortal } from 'react-dom'
import Collapsible from 'react-collapsible'
import NewWindow from 'react-new-window'

import './Profile.css'

//services
import { getProfileById, updateProfile } from '../../services/profileService'

//Components
import AvatarSelection from '../../components/AvatarSelection/AvatarSelection'
import VoiceSettings from '../../components/VoiceSettings/VoiceSettings'
import WordStats from '../../components/WordStats/WordStats'
import AddStudent from '../../components/AddStudent/AddStudent'
import ShowStudents from '../../components/ShowStudents/ShowStudents'
import CreateQr from '../../components/CreateQr/CreateQr'
import CryptoJS from 'crypto-js'

/**
 * Renders the user profile page.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.user - The user object.
 * @returns {JSX.Element} The rendered profile page.
 */
const Profile = ({ user }) => {
  const encryptKey = import.meta.env.VITE_REACT_APP_ENCRYPTKEY
  const [userProfile, setUserProfile] = useState()
  const [popup, setPopup] = useState(false)
  const [click, setClick] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    grade: null,
    avatar: '',
    pitch: null,
    rate: null,
    voice: 0
  })
  const [studentAdded, setStudentAdded] = useState(0)
  const [open, setOpen] = useState()
  const [qr, setQr] = useState('')

  const added = () => {
    setStudentAdded(studentAdded + 1)
  }

  useEffect(() => {
    const getProfile = async () => {
      try {
        console.log(user)
        const profileData = await getProfileById(user.profile)
        console.log(profileData)
        setFormData({
          name: profileData.name,
          email: profileData.email,
          grade: profileData.grade,
          avatar: profileData.avatar,
          pitch: profileData.pitch,
          rate: profileData.rate,
          voice: profileData.voice
        })
        setUserProfile(profileData)
      } catch (error) {
        throw error
      }
    }
    getProfile()
  }, [user.profile, click, studentAdded])
  const handlePopup = () => {
    setClick(!click)
    setPopup(!popup)
  }

  const handleChange = async (e) => {
    const value = e.target.value
    setFormData({ ...formData, [e.target.name]: value })
    try {
      await updateProfile(user.profile, {
        ...formData,
        [e.target.name]: value
      })
    } catch (error) {
      throw error
    }
  }

  const handleQrChange = (e) => {
    const value = e.target.value
    setQr(value)
  }

  return (
    <>
      {userProfile && (
        <div id="profile-page">
          {popup && (
            <AvatarSelection
              formData={formData}
              handleChange={handleChange}
              handlePopup={handlePopup}
            />
          )}
          <div className="profile-info">
            <div id="profile-card">
              <div id="profile-image">
                <img
                  id="profile-pic"
                  alt="profile picture"
                  src={userProfile?.avatar}
                />
              </div>
              <div id="update-avatar">
                {' '}
                <button type="button" autoComplete="off" onClick={handlePopup}>
                  Change Avatar
                </button>
              </div>
              <div id="bio-info">
                <div id="user-name">
                  <h1>{userProfile?.name}</h1>
                </div>
                <div id="user-grade">
                  <h2>Grade: {userProfile?.grade}</h2>
                </div>
              </div>
              <div id="user-email">
                <h3>e-mail: {userProfile?.email}</h3>
              </div>
            </div>

            <Collapsible trigger="Voice Settings">
              <div id="voice-setting">
                <VoiceSettings
                  formData={formData}
                  handleChange={handleChange}
                />
              </div>
            </Collapsible>

            {(userProfile?.role === 'parent' ||
              userProfile?.role === 'teacher') && (
              <>
                <Collapsible trigger="Create QR-Codes">
                  <div className="generate-QrCodes qr-code-generation-form">
                    <form className="qr-code-generation-form">
                      <label htmlFor="generateQr">
                        Please enter your password:
                      </label>
                      <input
                        required
                        type="password"
                        autoComplete="off"
                        name="generateQr"
                        id="generateQr"
                        onChange={handleQrChange}
                      />
                      <button
                        type="submit"
                        className="submit-button"
                        onClick={() => {
                          setOpen(true)
                        }}
                      >
                        create
                      </button>
                      {open && (
                        <NewWindow>
                          <CreateQr user={userProfile} pw={qr} />
                        </NewWindow>
                      )}
                    </form>
                  </div>
                </Collapsible>
                <Collapsible
                  trigger={
                    user.role === 'parent' ? (
                      <h3>Your Child</h3>
                    ) : (
                      <h3>Your Students</h3>
                    )
                  }
                >
                  <div className="indexChildren">
                    <ShowStudents user={userProfile} />
                  </div>
                  <div className="addChild">
                    <AddStudent added={added} user={userProfile} />
                  </div>
                </Collapsible>
              </>
            )}

            <Collapsible trigger="Words you have practiced">
              <div className="word-stats">
                <WordStats userProfile={userProfile} />
              </div>
            </Collapsible>
          </div>
        </div>
      )}

      {!userProfile && (
        <div id="profile-page">
          <h2>Loading ... </h2>
        </div>
      )}
    </>
  )
}
export default Profile
