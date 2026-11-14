import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './Nav.css'

import LogoDesktop from '../../assets/logo/fry-diagnosis-tool.png'
import { MdClose } from 'react-icons/md'
import { FiMenu } from 'react-icons/fi'
import PerformanceWidget from '../PerformanceWidget/PerformanceWidget'

/** Links for each kind of user, defined once and shared by both layouts. */
function linksFor(user) {
  if (!user) {
    return [
      { to: '/signin', label: 'Sign In' },
      { to: '/signup', label: 'Sign Up' },
      { to: '/settings/reading', label: 'Reading Settings' }
    ]
  }
  const isAdmin = Boolean(user.isAdmin)
  const isStudent = user.role === 'student'
  const isEducator = isAdmin || ['teacher', 'parent'].includes(user.role)

  return [
    ...(isStudent
      ? [
          { to: '/practice', label: 'Practice Words' },
          { to: '/my-progress', label: 'My Words' }
        ]
      : []),
    ...(isEducator
      ? [
          { to: '/class', label: 'Class Progress' },
          { to: '/assignments', label: 'Assignments' },
          { to: '/teacher-dashboard', label: 'Live Testing' }
        ]
      : []),
    { to: '/study', label: 'Study Words' },
    { to: '/settings/reading', label: 'Reading Settings' },
    { to: '/profile', label: 'Profile' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel' }] : []),
    { to: '/', label: 'Log Out', logout: true }
  ]
}

const Nav = (props) => {
  const [navbarOpen, setNavbarOpen] = useState(false)
  const menuButton = useRef(null)
  const location = useLocation()
  const isAdmin = Boolean(props.user?.isAdmin)
  const showPerformanceWidget =
    Boolean(props.user) && (import.meta.env.DEV || isAdmin)
  const links = linksFor(props.user)

  // Close the mobile menu after navigating
  useEffect(() => {
    setNavbarOpen(false)
  }, [location.pathname])

  // Escape closes the mobile menu and returns focus to its button
  useEffect(() => {
    if (!navbarOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setNavbarOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navbarOpen])

  const renderLink = (link) => (
    <NavLink
      key={link.label}
      to={link.to}
      end={link.to === '/'}
      onClick={() => {
        if (link.logout) props.handleLogout()
        setNavbarOpen(false)
      }}
    >
      {link.label}
    </NavLink>
  )

  return (
    <>
      <div id="hamburger">
        <nav className="navBar" aria-label="Main menu">
          <button
            ref={menuButton}
            type="button"
            onClick={() => setNavbarOpen((open) => !open)}
            aria-expanded={navbarOpen}
            aria-controls="mobile-menu"
            aria-label={navbarOpen ? 'Close menu' : 'Open menu'}
          >
            {navbarOpen ? (
              <MdClose aria-hidden="true" style={{ color: '#fff', width: '40px', height: '40px' }} />
            ) : (
              <FiMenu aria-hidden="true" style={{ color: '#7b7b7b', width: '40px', height: '40px' }} />
            )}
          </button>
          <ul id="mobile-menu" className={`menuNav ${navbarOpen ? ' showMenu' : ''}`} hidden={!navbarOpen}>
            <li>
              <NavLink id="logo" to="/" aria-label="Fry Words home">
                <img src={LogoDesktop} alt="" />
              </NavLink>
            </li>
            {links.map((link) => (
              <li key={link.label}>{renderLink(link)}</li>
            ))}
          </ul>
        </nav>
      </div>
      <div id="nav-bar">
        <nav className="nav-bar" aria-label="Main">
          <NavLink id="logo" to="/" aria-label="Fry Words home">
            <img src={LogoDesktop} alt="" />
          </NavLink>
          <div className="nav-links">{links.map(renderLink)}</div>
          {showPerformanceWidget && <PerformanceWidget />}
        </nav>
      </div>
    </>
  )
}

export default Nav
