import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, Trash2, BarChart3, Clock } from 'lucide-react';
import { db, createNewSession, getActiveSession, closeSession, deleteAllSessionsForDate } from '../services/database';
import { generateTodaySessionData } from '../services/testDataGenerator';
import { Session } from '../types';

const SessionDashboard: React.FC = () => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    
    // Check for session parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    if (sessionId) {
      // Auto-select the session from URL parameter
      loadSpecificSession(sessionId);
    }
  }, []);

  const loadSpecificSession = async (sessionId: string) => {
    try {
      const session = await db.sessions.get(sessionId);
      if (session) {
        setActiveSession(session);
      }
    } catch (error) {
      console.error('Error loading specific session:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get active session
      const active = await getActiveSession();
      setActiveSession(active);
      
      // Get all sessions for today
      const allSessions = await db.sessions.where('date').equals(today).toArray();
      setTodaySessions(allSessions);
      
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      alert('Bitte geben Sie einen Session-Namen ein');
      return;
    }

    try {
      const sessionId = await createNewSession(newSessionName);
      
      // Optional: Ask user if they want to generate sample data
      // Comment out the next block if you want sessions to ALWAYS start empty
      /*
      const generateSampleData = window.confirm(
        `Session "${newSessionName}" wurde erstellt!\n\n` +
        `Möchten Sie Test-Verkäufe für diese Session generieren?\n\n` +
        `✅ Ja = Beispiel-Verkäufe werden hinzugefügt\n` +
        `❌ Nein = Session startet leer`
      );
      
      if (generateSampleData) {
        // Generate some sample data for the new session
        await generateTodaySessionData(sessionId);
      }
      */
      
      // Sessions now ALWAYS start empty - no automatic test data generation
      
      setNewSessionName('');
      await loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Fehler beim Erstellen der Session');
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    // Navigate to session closing page instead of directly closing
    window.location.href = `/session/close?session=${activeSession.id}`;
  };

  const handleDeleteAllSessions = async () => {
    if (!window.confirm('Alle Sessions von heute löschen? Dies kann nicht rückgängig gemacht werden!')) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await deleteAllSessionsForDate(today);
      await loadSessions();
    } catch (error) {
      console.error('Error deleting sessions:', error);
      alert('Fehler beim Löschen der Sessions');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Lade Sessions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Session Dashboard</h1>
              <p className="text-gray-600 mt-2">Sessions verwalten und überwachen</p>
            </div>
            <div className="flex gap-4">
              <a href="/settings" className="btn-secondary">Settings</a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Active Session */}
        {activeSession ? (
          <a 
            href={`/management?session=${activeSession.id}`}
            className="card mb-8 bg-green-50 border-green-200 hover:bg-green-100 transition-colors cursor-pointer block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-4 rounded-full mr-6">
                  <Play className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-green-900">
                    {activeSession.sessionName}
                  </h2>
                  <p className="text-green-700 text-xl">
                    Aktive Session • Gestartet um {formatTime(activeSession.startTime)}
                  </p>
                  <p className="text-green-600 text-lg">
                    Läuft seit {formatDuration(activeSession.startTime)}
                  </p>
                  <p className="text-green-600 text-sm mt-2 font-medium">
                    👆 Klicken für Management →
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      €{activeSession.totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-green-700">Umsatz</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      €{activeSession.totalExpenses.toFixed(2)}
                    </div>
                    <div className="text-red-700">Ausgaben</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCloseSession();
                  }}
                  className="btn-expense flex items-center px-8 py-4 text-lg"
                >
                  <Square className="h-6 w-6 mr-3" />
                  Session beenden
                </button>
              </div>
            </div>
          </a>
        ) : (
          /* No Active Session */
          <div className="card mb-8 bg-blue-50 border-blue-200">
            <div className="text-center py-12">
              <Clock className="h-20 w-20 text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-blue-900 mb-3">
                Keine aktive Session
              </h2>
              <p className="text-blue-700 text-xl">
                Erstellen Sie eine neue Session, um zu beginnen
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Create New Session */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Neue Session erstellen
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Session Name (z.B. Frühstück, Mittagszeit, Abendservice)"
                className="input-field w-full text-lg py-4"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
              />
              <button
                onClick={handleCreateSession}
                className="btn-primary w-full flex items-center justify-center py-4 text-lg"
              >
                <Plus className="h-6 w-6 mr-3" />
                Session erstellen
              </button>
            </div>
          </div>

          {/* Session Actions */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Session Aktionen
            </h3>
            <div className="space-y-4">
              <a
                href="/reports/chef"
                className="btn-report w-full flex items-center justify-center py-4 text-lg"
              >
                <BarChart3 className="h-6 w-6 mr-3" />
                Chef Report anzeigen
              </a>
              <button
                onClick={handleDeleteAllSessions}
                disabled={todaySessions.length === 0}
                className="btn-expense w-full flex items-center justify-center py-4 text-lg disabled:opacity-50"
              >
                <Trash2 className="h-6 w-6 mr-3" />
                Alle Sessions löschen ({todaySessions.length})
              </button>
            </div>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className="card mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Heutige Sessions ({todaySessions.length})
          </h3>

          {todaySessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl">Noch keine Sessions heute erstellt</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className={`border-2 rounded-xl p-6 transition-all ${
                    session.isActive 
                      ? 'border-green-300 bg-green-50' 
                      : session.isClosed
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-900">
                      {session.sessionName}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      session.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : session.isClosed
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {session.isActive ? 'Aktiv' : session.isClosed ? 'Geschlossen' : 'Beendet'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm">Zeit:</span>
                      <div className="font-medium">
                        {formatTime(session.startTime)} 
                        {session.endTime && ` - ${formatTime(session.endTime)}`}
                      </div>
                      {session.endTime && (
                        <div className="text-sm text-gray-500">
                          {formatDuration(session.startTime, session.endTime)}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600 text-sm">Umsatz:</span>
                        <div className="font-bold text-green-600 text-lg">
                          €{session.totalRevenue.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Ausgaben:</span>
                        <div className="font-bold text-red-600 text-lg">
                          €{session.totalExpenses.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 text-sm">Gewinn:</span>
                      <div className={`font-bold text-xl ${
                        (session.totalRevenue - session.totalExpenses) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        €{(session.totalRevenue - session.totalExpenses).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDashboard;