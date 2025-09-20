import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SettingsDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [startingCash, setStartingCash] = useState('')
  const [showStartingCashModal, setShowStartingCashModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Lade gespeicherte Startkasse aus localStorage
    const savedStartingCash = localStorage.getItem('startingCash')
    if (savedStartingCash) {
      setStartingCash(savedStartingCash)
    }
  }, [])

  const settingsButtons = [
    {
      title: 'Mitarbeiter verwalten',
      icon: '👥',
      path: '/employees',
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'Mitarbeiter hinzufügen, bearbeiten und löschen'
    },
    {
      title: 'Benutzer verwalten',
      icon: '👤',
      path: '/users',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'System-Benutzer und Zugänge verwalten'
    },
    {
      title: 'Inventar verwalten',
      icon: '📦',
      path: '/inventory',
      color: 'bg-warning-500 hover:bg-warning-600',
      description: 'Lagerartikel und Bestände verwalten'
    },
    {
      title: 'Menu-Items verwalten',
      icon: '🍽️',
      path: '/menu',
      color: 'bg-success-500 hover:bg-success-600',
      description: 'Speisekarte und Preise bearbeiten'
    },
    {
      title: 'Kategorien verwalten',
      icon: '📋',
      path: '/menu?tab=categories',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Menu-Kategorien erstellen und bearbeiten'
    },
    {
      title: 'Startkasse einstellen',
      icon: '💰',
      action: () => setShowStartingCashModal(true),
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Anfangsbestand der Kasse festlegen'
    }
  ]

  const handleSaveStartingCash = () => {
    if (!startingCash) {
      alert('Bitte geben Sie einen Betrag für die Startkasse ein')
      return
    }

    const amount = parseFloat(startingCash)
    if (isNaN(amount) || amount < 0) {
      alert('Bitte geben Sie einen gültigen Betrag ein')
      return
    }

    setLoading(true)
    
    // Speichere in localStorage (in einer echten App würde dies in der Datenbank gespeichert)
    localStorage.setItem('startingCash', startingCash)
    
    setTimeout(() => {
      setLoading(false)
      setShowStartingCashModal(false)
      setStartingCash('')
      alert(`Startkasse wurde auf €${amount.toFixed(2)} gesetzt`)
    }, 500)
  }

  const getStartingCashForToday = () => {
    const savedAmount = localStorage.getItem('startingCash')
    return savedAmount ? `€${parseFloat(savedAmount).toFixed(2)}` : 'Nicht festgelegt'
  }

  return (
    <div className="space-y-6">
      {/* Startkasse Modal */}
      {showStartingCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Startkasse einstellen</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 font-medium">Aktuelle Startkasse: {getStartingCashForToday()}</p>
              <p className="text-blue-600 text-sm mt-1">
                Dies ist der Betrag, mit dem jede neue Session beginnt
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neuer Startkasse-Betrag (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-large w-full"
                  placeholder="0.00"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Hinweis:</strong> Die Startkasse wird bei jeder neuen Session als Anfangsbestand verwendet.</p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveStartingCash}
                  disabled={loading}
                  className="btn-large btn-success flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Speichern...' : 'Speichern'}
                </button>
                <button
                  onClick={() => {
                    setShowStartingCashModal(false)
                    setStartingCash('')
                  }}
                  className="btn-large btn-secondary flex-1"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System-Verwaltung */}
      <div className="card">
        <div className="flex justify-start mb-6">
          <button
            onClick={() => navigate('/')}
            className="btn-large btn-secondary"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          🔧 System-Verwaltung
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsButtons.map((button, index) => (
            <button
              key={button.path || index}
              onClick={() => button.path ? navigate(button.path) : button.action?.()}
              className={`dashboard-tile text-white ${button.color} min-h-[160px] transition-all duration-200 transform hover:scale-105`}
            >
              <div className="text-4xl mb-3">{button.icon}</div>
              <h3 className="text-lg font-bold mb-2">{button.title}</h3>
              <p className="text-sm opacity-90 leading-tight">{button.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* System-Informationen */}
      <div className="card bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ System-Informationen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Version</p>
            <p className="text-gray-600">Restaurant Manager v1.0</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Letzte Aktualisierung</p>
            <p className="text-gray-600">{new Date().toLocaleDateString('de-DE')}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">System-Status</p>
            <p className="text-success-600 font-medium">✅ Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsDashboard