import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import '../../styles/AvatarSelection.css'

const AvatarSelection = (props) => {
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  useEffect(() => {
    const loadAvatars = async () => {
      const avatarModules = import.meta.glob(
        '../../assets/avatars/*.{png,jpg,jpeg,svg}'
      )
      const newAvatars = []

      for (const path in avatarModules) {
        const avatar = await avatarModules[path]()
        newAvatars.push({
          value: path,
          label: <img className="avatar" src={avatar.default} alt={path} width="50" height="50" />
        })
      }

      setAvatars(newAvatars)
    }

    loadAvatars()
  }, [])

  const handleChange = (selectedOption) => {
    setSelectedAvatar(selectedOption)
    props.handleChange({
      target: { name: 'avatar', value: selectedOption.label.props.src }
    })
  }

  console.log(avatars)
  return (
    <div className="popup-container">
      <div className="popup-menu">
        <div className="popup-header">
          <h3>Select Your Avatar</h3>
          <button id="close-button" onClick={props.handlePopup}>
            X
          </button>
        </div>
        <img src={props.formData.avatar} alt="robot-avatar"></img>
        <div className="bottom-ui">
          <Select
            onChange={handleChange}
            options={avatars}
            value={avatars.find((option) => option.value === selectedAvatar)}
          ></Select>
          <button
            className="submit-button"
            onClick={props.handlePopup}
            type="button"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarSelection
