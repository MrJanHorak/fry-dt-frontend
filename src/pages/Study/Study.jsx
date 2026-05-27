import React, { useState, useEffect, useMemo } from 'react'
import words from '../../assets/FryWordList.json'

// Services
import { getProfileById } from '../../services/profileService'

// Components
import FlashCard from '../../components/FlashCard/FlashCard'

// style
import './Study.css'

function Study({ user }) {
  const [click, setClick] = useState(0)
  const [profile, setProfile] = useState()

  useEffect(() => {
    const getProfile = async () => {
      const profileData = await getProfileById(user.profile)
      setProfile(profileData)
    }
    getProfile()
  }, [user.profile])

  const gradeLevelWords = useMemo(() => {
    if (!profile?.grade) return []

    return Object.entries(words)
      .filter(([key]) => Number(key) <= profile.grade * 100)
      .map(([, value]) => value[1])
  }, [profile?.grade])

  useEffect(() => {
    if (!gradeLevelWords.length) {
      setClick(0)
      return
    }

    setClick((prevClick) =>
      prevClick >= gradeLevelWords.length ? 0 : prevClick
    )
  }, [gradeLevelWords.length])

  const handleClick = () => {
    setClick((prevClick) =>
      gradeLevelWords.length ? (prevClick + 1) % gradeLevelWords.length : 0
    )
  }

  const handleBack = () => {
    setClick((prevClick) => {
      if (!gradeLevelWords.length) return 0
      return prevClick === 0 ? gradeLevelWords.length - 1 : prevClick - 1
    })
  }

  const displayWord = gradeLevelWords[click] ?? null

  return (
    <div id="study-page">
      <div className="card-holder">
        <FlashCard
          profile={profile}
          handleClick={handleClick}
          handleBack={handleBack}
          displayWord={displayWord}
          isTest={false}
        />
      </div>
    </div>
  )
}

export default Study
