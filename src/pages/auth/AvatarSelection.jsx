import React, { useEffect, useState } from 'react'
import Select, { components } from 'react-select'
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
        const fileNameWithExtension = path.split('/').pop()
        const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.')
        newAvatars.push({
          value: path,
          label: fileName,
          avatar: avatar.default
        })
      }

      setAvatars(newAvatars)
    }

    loadAvatars()
  }, [])

  const handleChange = (selectedOption) => {
    setSelectedAvatar(selectedOption)
    props.handleChange({
      target: { name: 'avatar', value: selectedOption.avatar }
    })
  }

  const CustomOption = (props) => (
    <components.Option {...props}>
      <img
        className="avatar"
        src={props.data.avatar}
        alt={props.data.label}
        width="30"
        height="30"
        style={{ margin: '5px' }}
      />
    </components.Option>
  )

  const MenuList = (props) => (
    <components.MenuList
      {...props}
      style={{ display: 'flex', flexWrap: 'wrap' }}
    >
      {props.children}
    </components.MenuList>
  )

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
            components={{
              Option: CustomOption,
              MenuList: MenuList
            }}
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
