import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import DailyClosingModal from './DailyClosingModal'

interface SessionData {
  id: string
  name?: string
  date: string
  startTime: string
  endTime: string | null
  isActive: boolean
  user: { username: string }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState<SessionData | null>(null)
  const [completedSessions, setCompletedSessions] = useState<SessionData[]>([])
  const [sessionName, setSessionName] = useState('')
  const [showDailyClosing, setShowDailyClosing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const [activeRes, todayRes] = await Promise.all([
        apiService.getActiveSession(),
        apiService.getTodaySessions()
      ])

      setActiveSession(activeRes.data)
      
      // Filter completed sessions (not active)
      const completed = todayRes.data.filter((session: SessionData) => !session.isActive)
      setCompletedSessions(completed)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      alert('Bitte geben Sie einen Session-Namen ein')
      return
    }

    try {
      await apiService.startSession({ name: sessionName })
      setSessionName('')
      fetchSessions()
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Fehler beim Erstellen der Session')
    }
  }

  const handleEndSession = () => {
    if (!activeSession) return
    
    // Navigate to closing page - session stays active during closing process
    navigate(`/session-closing/${activeSession.id}`)
  }

  const handleDailyClosingComplete = () => {
    setShowDailyClosing(false)
    // Session ist bereits beendet, nur das Modal schließen
  }

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Session "${sessionName || 'Unbenannt'}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) return

    try {
      await apiService.deleteSession(sessionId)
      fetchSessions()
      alert('Session wurde erfolgreich gelöscht!')
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Fehler beim Löschen der Session')
    }
  }

  const handleDeleteAllSessions = async () => {
    if (!confirm('Möchten Sie wirklich ALLE Sessions löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return

    try {
      // Delete all completed sessions
      for (const session of completedSessions) {
        await apiService.deleteSession(session.id)
      }
      fetchSessions()
      alert('Alle Sessions wurden gelöscht!')
    } catch (error) {
      console.error('Error deleting sessions:', error)
      alert('Fehler beim Löschen der Sessions')
    }
  }

  const handleShowReports = () => {
    navigate('/reports')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Session-Dashboard wird geladen...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Daily Closing Modal */}
      <DailyClosingModal
        isOpen={showDailyClosing}
        onClose={() => setShowDailyClosing(false)}
        onComplete={handleDailyClosingComplete}
        sessionStartTime={activeSession?.startTime}
      />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Session-Dashboard
        </h1>
        <p className="text-gray-600">
          Verwalten Sie Ihre Restaurant-Sessions
        </p>
      </div>

      {/* Session Creation Area */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Session creation */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Neue Session erstellen</h2>
            <div className="flex gap-4">
              <input
                type="text"
                className="input-large flex-1"
                placeholder="Session-Name eingeben..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
              />
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim()}
                className="btn-large btn-success disabled:opacity-50 disabled:cursor-not-allowed px-6"
              >
                Erstellen
              </button>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex flex-col gap-3 lg:w-64">
            <button
              onClick={handleShowReports}
              className="btn-large btn-primary w-full"
            >
              📊 Report anzeigen
            </button>
            <button
              onClick={handleDeleteAllSessions}
              className="btn-large btn-danger w-full"
              disabled={completedSessions.length === 0}
            >
              🗑️ Alle Sessions löschen
            </button>
          </div>
        </div>
      </div>

      {/* Active Session */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktive Session</h2>
        {activeSession ? (
          <div 
            className="bg-success-50 border border-success-200 rounded-lg p-4 cursor-pointer hover:bg-success-100 transition-colors"
            onClick={() => navigate('/management')}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-success-800">
                  {activeSession.name || 'Unbenannte Session'}
                </h3>
                <div className="text-success-700 mt-2 space-y-1">
                  <p><strong>Gestartet:</strong> {new Date(activeSession.startTime).toLocaleString('de-DE')}</p>
                  <p><strong>Benutzer:</strong> {activeSession.user.username}</p>
                  <p><strong>Status:</strong> <span className="inline-flex px-2 py-1 bg-success-200 text-success-800 rounded-full text-sm font-medium">Aktiv</span></p>
                </div>
                <div className="mt-3 text-sm text-success-600 font-medium">
                  👆 Hier tippen um zum Management-Dashboard zu gelangen
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation() // Verhindert das Navigieren zum Management
                  handleEndSession()
                }}
                className="btn-large btn-warning"
              >
                Session beenden
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500 text-lg">Keine aktive Session</p>
            <p className="text-gray-400 text-sm mt-1">Erstellen Sie eine neue Session, um zu beginnen</p>
          </div>
        )}
      </div>

      {/* Completed Sessions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Abgeschlossene Sessions heute ({completedSessions.length})
        </h2>
        {completedSessions.length > 0 ? (
          <div className="space-y-3">
            {completedSessions.map((session) => (
              <div key={session.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {session.name || 'Unbenannte Session'}
                    </h3>
                    <div className="text-gray-600 text-sm mt-1 space-y-1">
                      <p><strong>Gestartet:</strong> {new Date(session.startTime).toLocaleString('de-DE')}</p>
                      <p><strong>Beendet:</strong> {session.endTime ? new Date(session.endTime).toLocaleString('de-DE') : 'Nicht beendet'}</p>
                      <p><strong>Benutzer:</strong> {session.user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                      Abgeschlossen
                    </span>
                    <button
                      onClick={() => handleDeleteSession(session.id, session.name || 'Unbenannt')}
                      className="text-danger-600 hover:text-danger-800 text-sm px-2 py-1"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">Keine abgeschlossenen Sessions heute</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard