import React, { useState, useEffect } from 'react'
import words from '../../assets/FryWordList.json'

// Services
import { getProfileById } from '../../services/profileService'

// Components
import FlashCard from '../../components/FlashCard/FlashCard'

// style
import './Study.css'

function Study({ user }) {
  const [gradeLevelWords, setgradeLevelWords] = useState()
  const [click, setClick] = useState(0)
  const [profile, setProfile] = useState()

  let displayWord = []
  let studyList = []

  const handleClick = (e) => {
    setClick(click + 1)
  }
  const handleBack = (e) => {
    click === 0 ? setClick(gradeLevelWords.length - 1) : setClick(click - 1)
  }

  useEffect(() => {
    const getProfile = async () => {
      try {
        const profileData = await getProfileById(user.profile)
        setProfile(profileData)
      } catch (error) {
        throw error
      }
    }
    getProfile()
  }, [user.profile])

  useEffect(() => {
    if (profile?.grade) {
      for (const key in words) {
        if (key <= profile.grade * 100) {
          studyList.push(words[key][1])
        }
        setgradeLevelWords(studyList)
      }
    }
  }, [profile, user.profile])

  if (gradeLevelWords) {
    if (click >= gradeLevelWords.length) {
      displayWord = []
      setClick(0)
    }
    if (click < gradeLevelWords.length) {
    }
    displayWord = gradeLevelWords[click]
  }

  return (
    <div id="study-page">
      <div className="card-holder">
        <FlashCard
          profile={profile}
          handleClick={handleClick}
          handleBack={handleBack}
          displayWord={displayWord}
          test={false}
        />
      </div>
    </div>
  )
}

export default Study
