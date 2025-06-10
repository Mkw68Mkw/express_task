'use client'
import { useEffect, useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Plus, Menu, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';

function ResponsiveHeader({ username, router, setUsername, setShowModal }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full p-4 bg-white shadow-md">
      {/* Mobile Hamburger */}
      <div className="md:hidden flex justify-between items-center">
        <button
          className="text-gray-800"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <button
          onClick={() => {
            if (!username) {
              toast.error('Bitte melden Sie sich an, um eine neue Aufgabe zu erstellen.');
            } else {
              setShowModal(true);
            }
          }}
          className="text-white px-3 py-2 rounded-lg bg-[var(--confetti-400)] hover:bg-[var(--confetti-500)] flex items-center gap-1"
        >
          <Plus className="h-5 w-5" />
          <span>Aufgabe</span>
        </button>
      </div>

      {/* Menü für große Bildschirme + ggf. Dropdown bei mobil */}
      <div className={`mt-4 md:mt-0 md:flex md:justify-between md:items-center ${menuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          {username ? (
            <>
              <span className="text-gray-600">Eingeloggt als: {username}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-[var(--confetti-400)] hover:bg-[var(--confetti-500)] text-white rounded-lg transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  setUsername(null);
                  router.refresh();
                }}
                className="px-4 py-2 text-[var(--confetti-700)] hover:bg-[var(--confetti-100)] rounded-lg transition-colors cursor-pointer"
              >
                Abmelden
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              style={{ backgroundColor: 'var(--confetti-400)' }}
            >
              Anmelden
            </button>
          )}
        </div>

        {/* Für größere Screens immer sichtbar */}
        <div className="hidden md:block mt-4 md:mt-0">
          <button
            onClick={() => {
              if (!username) {
                toast.error('Bitte melden Sie sich an, um eine neue Aufgabe zu erstellen.');
              } else {
                setShowModal(true);
              }
            }}
            className="text-white px-4 py-2 rounded-lg bg-[var(--confetti-400)] hover:bg-[var(--confetti-500)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Neue Aufgabe</span>
          </button>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default function Home() {
  // State, um die Antwort vom Express-Server zu speichern
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'open'
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const router = useRouter();
  const [username, setUsername] = useState(null);

  // useEffect, um beim Laden der Seite die API anzufragen
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:3001', {
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : {}
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          setUsername(null);
          return
        }
        
        const result = await response.json();
        setData(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTask),
      });
      
      if (response.ok) {
        setShowModal(false);
        // Daten neu laden
        const result = await fetch('http://localhost:3001', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const newData = await result.json();
        setData(newData);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/tasks/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const newData = data.filter(task => task.id !== id);
        setData(newData);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTask),
      });
      
      if (response.ok) {
        setShowEditModal(false);
        const updatedData = data.map(task => 
          task.id === editingTask.id ? {...editingTask} : task
        );
        setData(updatedData);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="grid grid-rows-[auto_1fr_20px] items-center justify-items-center min-h-screen pt-8 px-8 pb-20 gap-8 font-[family-name:var(--font-geist-sans)]" style={{ color: 'var(--confetti-900)' }}>
      <ResponsiveHeader 
        username={username}
        router={router}
        setUsername={setUsername}
        setShowModal={setShowModal}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-500/30 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white/80 p-6 rounded-lg w-96 shadow-xl backdrop-blur-lg border border-white/20 transform transition-all">
            <h2 className="text-xl font-bold mb-4">Neue Aufgabe</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2">Titel*</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Beschreibung</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                >
                  <option value="open">Offen</option>
                  <option value="in progress">In Bearbeitung</option>
                  <option value="done">Erledigt</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--confetti-400)] text-white rounded hover:bg-[var(--confetti-500)]"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {data.length > 0 && (
          <div className="w-full max-w-6xl">
            <h2 className="text-lg font-bold mb-6">Aufgaben:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map(task => (
                <div key={task.id} className="group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 mb-4 flex-1">{task.description}</p>
                    )}
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          task.status === 'done' ? 'bg-green-100 text-green-800' :
                          task.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white/80 p-6 rounded-lg w-96 shadow-xl backdrop-blur-lg border border-white/20 transform transition-all">
            <h2 className="text-xl font-bold mb-4">Aufgabe bearbeiten</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block mb-2">Titel*</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Beschreibung</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                >
                  <option value="open">Offen</option>
                  <option value="in progress">In Bearbeitung</option>
                  <option value="done">Erledigt</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Aktualisieren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
