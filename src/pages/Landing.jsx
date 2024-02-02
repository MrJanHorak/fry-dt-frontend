import React from 'react'
import '../styles/Landing.css'

/**
 * Landing page component.
 * 
 * @param {Object} props - The component props.
 * @param {Object} props.user - The user object.
 * @returns {JSX.Element} The rendered Landing component.
 */
export default function Landing({ user }) {
  return (
    <div id="landing-page">
      <h2>FRY Word Diagnosis Tool</h2>
      <img src="src/assets/logo/fry-diagnosis-tool.png" alt="logo" className="logo" />
      <div className="flashcard">
        <p className="intro">
          This tool is designed to help teachers test a students ability to
          recognise sight words.
          <br />
          <br />
          Making use of a special font "Lexend" designed to reduce cognitive
          noise and and increase character recognition, using visual and audio
          tools in the study mode to help learn the words, this tool was
          designed to help{' '}
          <b>
            <i>all</i>
          </b>{' '}
          students improve their reading.
          <br />
          <br />
          This is not a finished product. There are still several things being
          worked on and bugs that need to be figured out. Here a list of items I
          hope to cover in a the next few weeks:
        </p>
        <ul className="future-plans">
          <li>graphical display of progress</li>
          <li>tracking words user struggles most with</li>
          <li>setting up groups of students</li>
        </ul>
        <p className="call-to-action">
          Please give it a try, send me feedback, or feel free to join in and
          colaborate and code along.
          <br />
          <br />
          <b>test user:</b>
          <br />
          <b>login: </b> first grader <b>Password: </b>testadmin
          <br />
          <br />
          <b>test admin user:</b>
          <br />
          <b>login: </b> testAdmin <b>Password: </b>testadmin
        </p>
      </div>
    </div>
  )
}