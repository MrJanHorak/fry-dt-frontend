import React from 'react'
import '../../styles/AvatarSelection.css'

// Assets
import blue1 from '../../assets/avatars/blue1.png'
import blue2 from '../../assets/avatars/blue2.png'
import blue3 from '../../assets/avatars/blue3.png'
import blue4 from '../../assets/avatars/blue4.png'
import blue5 from '../../assets/avatars/blue5.png'
import blue6 from '../../assets/avatars/blue6.png'
import brown1 from '../../assets/avatars/brown1.png'
import brown2 from '../../assets/avatars/brown2.png'
import brown3 from '../../assets/avatars/brown3.png'
import brown4 from '../../assets/avatars/brown4.png'
import brown5 from '../../assets/avatars/brown5.png'
import brown6 from '../../assets/avatars/brown6.png'
import gray1 from '../../assets/avatars/gray1.png'
import gray2 from '../../assets/avatars/gray2.png'
import gray3 from '../../assets/avatars/gray3.png'
import gray4 from '../../assets/avatars/gray4.png'
import gray5 from '../../assets/avatars/gray5.png'
import gray6 from '../../assets/avatars/gray6.png'
import green1 from '../../assets/avatars/green1.png'
import green2 from '../../assets/avatars/green2.png'
import green3 from '../../assets/avatars/green3.png'
import green4 from '../../assets/avatars/green4.png'
import green5 from '../../assets/avatars/green5.png'
import green6 from '../../assets/avatars/green6.png'
import orange1 from '../../assets/avatars/orange1.png'
import orange2 from '../../assets/avatars/orange2.png'
import orange3 from '../../assets/avatars/orange3.png'
import orange4 from '../../assets/avatars/orange4.png'
import orange5 from '../../assets/avatars/orange5.png'
import orange6 from '../../assets/avatars/orange6.png'
import pink1 from '../../assets/avatars/pink1.png'
import pink2 from '../../assets/avatars/pink2.png'
import pink3 from '../../assets/avatars/pink3.png'
import pink4 from '../../assets/avatars/pink4.png'
import pink5 from '../../assets/avatars/pink5.png'
import pink6 from '../../assets/avatars/pink6.png'
import purple1 from '../../assets/avatars/purple1.png'
import purple2 from '../../assets/avatars/purple2.png'
import purple3 from '../../assets/avatars/purple3.png'
import purple4 from '../../assets/avatars/purple4.png'
import purple5 from '../../assets/avatars/purple5.png'
import purple6 from '../../assets/avatars/purple6.png'
import red1 from '../../assets/avatars/red1.png'
import red2 from '../../assets/avatars/red2.png'
import red3 from '../../assets/avatars/red3.png'
import red4 from '../../assets/avatars/red4.png'
import red5 from '../../assets/avatars/red5.png'
import red6 from '../../assets/avatars/red6.png'
import white1 from '../../assets/avatars/white1.png'
import white2 from '../../assets/avatars/white2.png'
import white3 from '../../assets/avatars/white3.png'
import white4 from '../../assets/avatars/white4.png'
import white5 from '../../assets/avatars/white5.png'
import white6 from '../../assets/avatars/white6.png'
import yellow1 from '../../assets/avatars/yellow1.png'
import yellow2 from '../../assets/avatars/yellow2.png'
import yellow3 from '../../assets/avatars/yellow3.png'
import yellow4 from '../../assets/avatars/yellow4.png'
import yellow5 from '../../assets/avatars/yellow5.png'
import yellow6 from '../../assets/avatars/yellow6.png'

const AvatarSelection = (props) => {
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
          <select
            onChange={(event) => props.handleChange(event)}
            name="avatar"
            value={props.formData.avatar}
          >
            <option value={blue1}>Blue Robo 1</option>
            <option value={blue2}>Blue Robo 2</option>
            <option value={blue3}>Blue Robo 3</option>
            <option value={blue4}>Blue Robo 4</option>
            <option value={blue5}>Blue Robo 5</option>
            <option value={blue6}>Blue Robo 6</option>
            <option value={brown1}>Brown Robo 1</option>
            <option value={brown2}>Brown Robo 2</option>
            <option value={brown3}>Brown Robo 3</option>
            <option value={brown4}>Brown Robo 4</option>
            <option value={brown5}>Brown Robo 5</option>
            <option value={brown6}>Brown Robo 6</option>
            <option value={gray1}>Gray Robo 1</option>
            <option value={gray2}>Gray Robo 2</option>
            <option value={gray3}>Gray Robo 3</option>
            <option value={gray4}>Gray Robo 4</option>
            <option value={gray5}>Gray Robo 5</option>
            <option value={gray6}>Gray Robo 6</option>
            <option value={green1}>Green Robo 1</option>
            <option value={green2}>Green Robo 2</option>
            <option value={green3}>Green Robo 3</option>
            <option value={green4}>Green Robo 4</option>
            <option value={green5}>Green Robo 5</option>
            <option value={green6}>Green Robo 6</option>
            <option value={orange1}>Orange Robo 1</option>
            <option value={orange2}>Orange Robo 2</option>
            <option value={orange3}>Orange Robo 3</option>
            <option value={orange4}>Orange Robo 4</option>
            <option value={orange5}>Orange Robo 5</option>
            <option value={orange6}>Orange Robo 6</option>
            <option value={pink1}>Pink Robo 1</option>
            <option value={pink2}>Pink Robo 2</option>
            <option value={pink3}>Pink Robo 3</option>
            <option value={pink4}>Pink Robo 4</option>
            <option value={pink5}>Pink Robo 5</option>
            <option value={pink6}>Pink Robo 6</option>
            <option value={purple1}>Purple Robo 1</option>
            <option value={purple2}>Purple Robo 2</option>
            <option value={purple3}>Purple Robo 3</option>
            <option value={purple4}>Purple Robo 4</option>
            <option value={purple5}>Purple Robo 5</option>
            <option value={purple6}>Purple Robo 6</option>
            <option value={red1}>Red Robo 1</option>
            <option value={red2}>Red Robo 2</option>
            <option value={red3}>Red Robo 3</option>
            <option value={red4}>Red Robo 4</option>
            <option value={red5}>Red Robo 5</option>
            <option value={red6}>Red Robo 6</option>
            <option value={white1}>White Robo 1</option>
            <option value={white2}>White Robo 2</option>
            <option value={white3}>White Robo 3</option>
            <option value={white4}>White Robo 4</option>
            <option value={white5}>White Robo 5</option>
            <option value={white6}>White Robo 6</option>
            <option value={yellow1}>Yellow Robo 1</option>
            <option value={yellow2}>Yellow Robo 2</option>
            <option value={yellow3}>Yellow Robo 3</option>
            <option value={yellow4}>Yellow Robo 4</option>
            <option value={yellow5}>Yellow Robo 5</option>
            <option value={yellow6}>Yellow Robo 6</option>
          </select>
          <button onClick={props.handlePopup} type="button">
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarSelection
