#!/usr/bin/env node

/**
 * Comprehensive Testing Room Functionality Test
 * Tests the complete teacher-student testing workflow
 */

import { io } from 'socket.io-client'
import fetch from 'node-fetch'
import { Buffer } from 'buffer'

const BACKEND_URL = 'http://localhost:3000'
const SOCKET_URL = 'http://localhost:3000'
const PROFILES_URL = `${BACKEND_URL}/api/profiles`

// Test data
const testCredentials = {
  teacher: { name: 'Test Teacher', pw: 'password123' },
  student: { name: 'New Test Student', pw: 'password123' }
}

const testWords = ['the', 'and', 'to', 'a', 'in']
const testRoom = `SESSION-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const decodeUserFromToken = (token) => {
  if (!token) return null

  const [, payload] = token.split('.')
  return JSON.parse(Buffer.from(payload, 'base64').toString()).user
}

const getUserProfileId = (user) => user?.profile || user?._id || null

const withTimeout = (label, executor, timeout = 5000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeout}ms`)),
      timeout
    )

    executor(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })

class TestingRoomTester {
  constructor() {
    this.teacherToken = null
    this.studentToken = null
    this.teacherUser = null
    this.studentUser = null
    this.teacherSocket = null
    this.studentSocket = null
    this.testSession = null
    this.results = {
      authentication: false,
      socketConnection: false,
      roomJoining: false,
      sessionCreation: false,
      wordSending: false,
      responseSubmission: false,
      assessmentPersistence: false,
      sessionManagement: false,
      sessionPersistence: false
    }
  }

  async run() {
    console.log('🧪 Testing Room Functionality Test Starting...\n')

    try {
      await this.testAuthentication()
      await this.testSocketConnections()
      await this.testRoomJoining()
      await this.testSessionWorkflow()
      await this.generateReport()
    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
    } finally {
      await this.cleanup()
    }
  }

  async testAuthentication() {
    console.log('1. 🔐 Testing Authentication...')

    // Test teacher login
    try {
      const teacherResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCredentials.teacher)
      })

      if (teacherResponse.ok) {
        const data = await teacherResponse.json()
        this.teacherToken = data.token
        this.teacherUser = decodeUserFromToken(data.token)

        if (!getUserProfileId(this.teacherUser)) {
          throw new Error('Teacher token is missing a profile identifier')
        }

        console.log('   ✅ Teacher authentication successful')
      } else {
        throw new Error('Teacher login failed')
      }
    } catch (error) {
      console.log('   ❌ Teacher authentication failed:', error.message)
      return
    }

    // Test student login
    try {
      const studentResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCredentials.student)
      })

      if (studentResponse.ok) {
        const data = await studentResponse.json()
        this.studentToken = data.token

        this.studentUser = decodeUserFromToken(data.token)
        if (!getUserProfileId(this.studentUser)) {
          throw new Error('Student token is missing a profile identifier')
        }

        console.log('   ✅ Student authentication successful')
        this.results.authentication = true
      } else {
        throw new Error('Student login failed')
      }
    } catch (error) {
      console.log('   ❌ Student authentication failed:', error.message)
    }
  }

  async testSocketConnections() {
    console.log('\n2. 🔌 Testing Socket Connections...')

    // Teacher socket connection
    await new Promise((resolve, reject) => {
      this.teacherSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        timeout: 5000
      })

      this.teacherSocket.on('connect', () => {
        console.log('   ✅ Teacher socket connected:', this.teacherSocket.id)
        this.teacherSocket.on('test_error', (error) => {
          console.log('   ❌ Teacher received test error:', error.message)
        })
        resolve()
      })

      this.teacherSocket.on('connect_error', (error) => {
        console.log('   ❌ Teacher socket connection failed:', error.message)
        reject(error)
      })

      setTimeout(() => reject(new Error('Teacher socket timeout')), 5000)
    })

    // Student socket connection
    await new Promise((resolve, reject) => {
      this.studentSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        timeout: 5000
      })

      this.studentSocket.on('connect', () => {
        console.log('   ✅ Student socket connected:', this.studentSocket.id)
        this.studentSocket.on('test_error', (error) => {
          console.log('   ❌ Student received test error:', error.message)
        })
        this.results.socketConnection = true
        resolve()
      })

      this.studentSocket.on('connect_error', (error) => {
        console.log('   ❌ Student socket connection failed:', error.message)
        reject(error)
      })

      setTimeout(() => reject(new Error('Student socket timeout')), 5000)
    })
  }

  async testRoomJoining() {
    console.log('\n3. 🚪 Testing Room Joining...')

    // Teacher joins room
    await withTimeout('Teacher room join', (resolve) => {
      this.teacherSocket.once('chatroom_users', (users) => {
        console.log('   📝 Teacher received room users:', users.length)
        resolve()
      })

      this.teacherSocket.emit('join_room', {
        username: this.teacherUser.name,
        user: this.teacherUser,
        room: testRoom
      })
    })

    // Student joins room
    await withTimeout('Student room join', (resolve) => {
      this.studentSocket.once('chatroom_users', (users) => {
        console.log('   📝 Student received room users:', users.length)
        console.log('   ✅ Room joining successful')
        this.results.roomJoining = true
        resolve()
      })

      this.studentSocket.emit('join_room', {
        username: this.studentUser.name,
        user: this.studentUser,
        room: testRoom
      })
    })
  }

  async testSessionWorkflow() {
    console.log('\n4. 📚 Testing Session Workflow...')

    // Test session creation
    await this.testSessionCreation()

    // Test word sending and responses
    await this.testWordSending()

    // Test assessment persistence
    await this.testAssessmentPersistence()

    // Test session management
    await this.testSessionManagement()

    // Verify persisted records through the profile API
    await this.verifyPersistedRecords()
  }

  async testSessionCreation() {
    console.log('   📋 Testing session creation...')

    const sessionData = {
      sessionId: `test-session-${Date.now()}`,
      teacherId: getUserProfileId(this.teacherUser),
      room: testRoom,
      testType: 'recognition',
      wordsToTest: testWords,
      fryLevel: 1
    }

    this.testSession = sessionData

    await withTimeout('Session creation', (resolve) => {
      // Student listens for session start
      this.studentSocket.once('test_session_started', (data) => {
        console.log('   ✅ Student received session start notification')
        this.results.sessionCreation = true
        resolve()
      })

      // Teacher starts session
      this.teacherSocket.emit('start_test_session', sessionData)
    })
  }

  async testWordSending() {
    console.log('   💬 Testing word sending...')

    const testWord = testWords[0]

    await withTimeout('Word sending and response submission', (resolve) => {
      // Student listens for word
      this.studentSocket.once('receive_test_word', (data) => {
        console.log(`   ✅ Student received word: "${data.word}"`)
        this.results.wordSending = true

        // Student submits response
        setTimeout(() => {
          this.studentSocket.emit('submit_test_response', {
            sessionId: this.testSession.sessionId,
            word: testWord,
            studentId: getUserProfileId(this.studentUser),
            studentName: this.studentUser.name,
            response: testWord,
            responseTime: 1500,
            testType: 'recognition',
            recognized: true,
            confidence: 0.9
          })
        }, 100)
      })

      // Teacher listens for student response
      this.teacherSocket.once('student_test_response', (data) => {
        console.log(
          `   ✅ Teacher received student response for: "${data.word}"`
        )
        this.results.responseSubmission = true
        resolve()
      })

      // Teacher sends word
      this.teacherSocket.emit('send_test_word', {
        sessionId: this.testSession.sessionId,
        word: testWord,
        testType: 'recognition',
        room: testRoom
      })
    })
  }

  async testAssessmentPersistence() {
    console.log('   📝 Testing assessment persistence...')

    const testWord = testWords[0]

    await withTimeout('Assessment persistence', (resolve) => {
      this.teacherSocket.once('assessment_note_saved', () => {
        console.log('   ✅ Teacher received assessment save confirmation')
        this.results.assessmentPersistence = true
        resolve()
      })

      this.teacherSocket.emit('save_assessment_note', {
        sessionId: this.testSession.sessionId,
        word: testWord,
        studentId: getUserProfileId(this.studentUser),
        teacherNotes: 'Automated live-session validation',
        score: 100,
        recognized: true,
        testType: this.testSession.testType,
        studentName: this.studentUser.name,
        response: testWord,
        responseTime: 1500,
        confidence: 0.9
      })
    })
  }

  async testSessionManagement() {
    console.log('   🏁 Testing session management...')

    await withTimeout('Session management', (resolve) => {
      // Student listens for session end
      this.studentSocket.once('test_session_ended', (data) => {
        console.log('   ✅ Student received session end notification')
        this.results.sessionManagement = true
        resolve()
      })

      // Teacher ends session
      this.teacherSocket.emit('end_test_session', {
        sessionId: this.testSession.sessionId,
        room: testRoom,
        completedCount: 1,
        totalWords: testWords.length
      })
    })
  }

  async verifyPersistedRecords() {
    console.log('   💾 Verifying persisted records...')

    const studentProfileId = getUserProfileId(this.studentUser)
    const headers = {
      Authorization: `Bearer ${this.teacherToken}`
    }

    const [sessionsResponse, assessmentsResponse] = await Promise.all([
      fetch(`${PROFILES_URL}/${studentProfileId}/testSessions`, { headers }),
      fetch(`${PROFILES_URL}/${studentProfileId}/assessments`, { headers })
    ])

    if (!sessionsResponse.ok) {
      throw new Error(
        `Failed to fetch persisted test sessions: ${sessionsResponse.status}`
      )
    }

    if (!assessmentsResponse.ok) {
      throw new Error(
        `Failed to fetch persisted assessments: ${assessmentsResponse.status}`
      )
    }

    const [sessions, assessments] = await Promise.all([
      sessionsResponse.json(),
      assessmentsResponse.json()
    ])

    const persistedSession = sessions.find(
      (session) => session.sessionId === this.testSession.sessionId
    )

    if (!persistedSession || persistedSession.status !== 'completed') {
      throw new Error('Completed test session was not persisted to the profile')
    }

    const persistedAssessment = assessments.find(
      (assessment) =>
        assessment.sessionId === this.testSession.sessionId &&
        Array.isArray(assessment.words) &&
        assessment.words.includes(testWords[0])
    )

    if (!persistedAssessment) {
      throw new Error('Saved assessment was not persisted to the profile')
    }

    console.log('   ✅ Session persisted to the student profile')
    console.log('   ✅ Assessment persisted to the student profile')

    this.results.sessionPersistence = true
  }

  async generateReport() {
    console.log('\n📊 Test Results Summary:')
    console.log('='.repeat(50))

    const totalTests = Object.keys(this.results).length
    const passedTests = Object.values(this.results).filter(Boolean).length

    Object.entries(this.results).forEach(([test, passed]) => {
      console.log(
        `   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`
      )
    })

    console.log('='.repeat(50))
    console.log(`   Overall: ${passedTests}/${totalTests} tests passed`)

    if (passedTests === totalTests) {
      console.log('   🎉 All testing room functionality is working correctly!')
    } else {
      console.log('   ⚠️  Some issues detected in testing room functionality')
      console.log('\n🔧 Recommended Actions:')

      if (!this.results.authentication) {
        console.log('   - Check user authentication system')
      }
      if (!this.results.socketConnection) {
        console.log('   - Verify socket.io server configuration')
      }
      if (!this.results.roomJoining) {
        console.log('   - Check room management and user tracking')
      }
      if (!this.results.sessionCreation) {
        console.log('   - Verify test session creation logic')
      }
      if (!this.results.wordSending) {
        console.log('   - Check word distribution mechanism')
      }
      if (!this.results.responseSubmission) {
        console.log('   - Verify response collection system')
      }
      if (!this.results.sessionManagement) {
        console.log('   - Check session lifecycle management')
      }
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...')

    if (this.teacherSocket) {
      this.teacherSocket.disconnect()
    }
    if (this.studentSocket) {
      this.studentSocket.disconnect()
    }

    console.log('   ✅ Cleanup complete')
  }
}

// Run the test
const tester = new TestingRoomTester()
tester.run().catch(console.error)
