#!/usr/bin/env node

/**
 * Comprehensive Testing Room Functionality Test
 * Tests the complete teacher-student testing workflow
 */

import { io } from 'socket.io-client'
import fetch from 'node-fetch'

const BACKEND_URL = 'http://localhost:3000'
const SOCKET_URL = 'http://localhost:3000'

// Test data
const testCredentials = {
  teacher: { name: 'Test Teacher', pw: 'password123' },
  student: { name: 'New Test Student', pw: 'password123' }
}

const testWords = ['the', 'and', 'to', 'a', 'in']
const testRoom = 'test-room-1'

class TestingRoomTester {
  constructor() {
    this.teacherToken = null
    this.studentToken = null
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
      sessionManagement: false
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
    await new Promise((resolve) => {
      this.teacherSocket.on('chatroom_users', (users) => {
        console.log('   📝 Teacher received room users:', users.length)
        resolve()
      })

      this.teacherSocket.emit('join_room', {
        username: 'Test Teacher',
        user: { name: 'Test Teacher', role: 'teacher' },
        room: testRoom
      })
    })

    // Student joins room
    await new Promise((resolve) => {
      this.studentSocket.on('chatroom_users', (users) => {
        console.log('   📝 Student received room users:', users.length)
        console.log('   ✅ Room joining successful')
        this.results.roomJoining = true
        resolve()
      })

      this.studentSocket.emit('join_room', {
        username: 'New Test Student',
        user: { name: 'New Test Student', role: 'student' },
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
    
    // Test session management
    await this.testSessionManagement()
  }

  async testSessionCreation() {
    console.log('   📋 Testing session creation...')

    const sessionData = {
      sessionId: `test-session-${Date.now()}`,
      teacherId: 'teacher-123',
      room: testRoom,
      testType: 'recognition',
      wordsToTest: testWords,
      fryLevel: 1
    }

    this.testSession = sessionData

    await new Promise((resolve) => {
      // Student listens for session start
      this.studentSocket.on('test_session_started', (data) => {
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

    await new Promise((resolve) => {
      // Student listens for word
      this.studentSocket.on('receive_test_word', (data) => {
        console.log(`   ✅ Student received word: "${data.word}"`)
        this.results.wordSending = true
        
        // Student submits response
        setTimeout(() => {
          this.studentSocket.emit('submit_test_response', {
            sessionId: this.testSession.sessionId,
            word: testWord,
            studentId: 'student-123',
            studentName: 'New Test Student',
            response: testWord,
            responseTime: 1500,
            testType: 'recognition',
            recognized: true,
            confidence: 0.9
          })
        }, 100)
      })

      // Teacher listens for student response
      this.teacherSocket.on('student_test_response', (data) => {
        console.log(`   ✅ Teacher received student response for: "${data.word}"`)
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

  async testSessionManagement() {
    console.log('   🏁 Testing session management...')

    await new Promise((resolve) => {
      // Student listens for session end
      this.studentSocket.on('test_session_ended', (data) => {
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

  async generateReport() {
    console.log('\n📊 Test Results Summary:')
    console.log('=' .repeat(50))
    
    const totalTests = Object.keys(this.results).length
    const passedTests = Object.values(this.results).filter(Boolean).length
    
    Object.entries(this.results).forEach(([test, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`)
    })
    
    console.log('=' .repeat(50))
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
