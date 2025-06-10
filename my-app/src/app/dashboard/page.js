'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SquarePen, Trash2, Home, LogOut } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  const sortOptions = [
    { column: 'title', label: 'Titel' },
    { column: 'created_at', label: 'Erstellt am' },
    { column: 'status', label: 'Status' }
  ];

  useEffect(() => {
    // Prüfe bei jedem Mount und Fokus-Wechsel
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      } else {
        fetchTasks();
      }
    };

    checkAuth();
    window.addEventListener('focus', checkAuth);

    return () => window.removeEventListener('focus', checkAuth);
  }, [router]);

  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/user/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      localStorage.removeItem('token');
      setTimeout(() => router.push('/login'), 3000);
    }
  };

  const handleSort = (column) => {
    if (column === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setMobileSortOpen(false);
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'created_at') {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    const valueA = a[sortBy]?.toLowerCase() || '';
    const valueB = b[sortBy]?.toLowerCase() || '';
    
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditedTitle(task.title);
    setEditedDescription(task.description);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:3001/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
          status: selectedTask.status
        })
      });

      if (response.ok) {
        fetchTasks();
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      try {
        const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: 'var(--confetti-50)', color: 'var(--confetti-900)' }}>
      <header className="flex flex-row flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-xl md:text-2xl font-bold whitespace-nowrap">Dashboard</h1>
        
        <div className="flex flex-1 flex-row flex-wrap items-center gap-2 justify-end min-w-[200px]">
          {/* Mobile Sortier-Dropdown */}
          <div className="md:hidden relative flex-[1_1_160px]">
            <button 
              onClick={() => setMobileSortOpen(!mobileSortOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors w-full text-sm"
            >
              <span className="truncate">{sortOptions.find(o => o.column === sortBy)?.label}</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {mobileSortOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded shadow-lg">
                {sortOptions.map(option => (
                  <button
                    key={option.column}
                    onClick={() => {
                      handleSort(option.column);
                      setMobileSortOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    {option.label} {sortBy === option.column && (sortOrder === 'asc' ? '▴' : '▾')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/" className="flex-[0_1_auto]">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              <Home className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline-block truncate">Startseite</span>
            </button>
          </Link>

          <button 
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm flex-[0_1_auto]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline-block truncate">Abmelden</span>
          </button>
        </div>
      </header>
  
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Deine Aufgaben</h2>
        {tasks.length === 0 ? (
          <p>Keine Aufgaben gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow" style={{ backgroundColor: 'var(--confetti-100)' }}>
              <thead className="hidden md:table-header-group">
                <tr className="border-b">
                  <th 
                    className="text-left p-4 group cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Titel
                      <span className={`inline-block transition-transform ${sortBy === 'title' ? 'text-confetti-600' : 'text-gray-400'}`}>
                        {sortBy === 'title' ? (
                          sortOrder === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 group cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-2">
                      Beschreibung
                      <span className={`inline-block transition-transform ${sortBy === 'description' ? 'text-confetti-600' : 'text-gray-400'}`}>
                        {sortBy === 'description' ? (
                          sortOrder === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 group cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <span className={`inline-block transition-transform ${sortBy === 'status' ? 'text-confetti-600' : 'text-gray-400'}`}>
                        {sortBy === 'status' ? (
                          sortOrder === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 group cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Erstellt am
                      <span className={`inline-block transition-transform ${sortBy === 'created_at' ? 'text-confetti-600' : 'text-gray-400'}`}>
                        {sortBy === 'created_at' ? (
                          sortOrder === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="text-left p-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task, index) => (
                  <tr key={task.id || index} className="bg-gray-50 block md:table-row mb-4 md:mb-0">
                    <td className="p-4 block md:table-cell border-b before:content-[attr(data-label)] md:before:content-none before:font-semibold before:mr-2" data-label="Titel">
                      {task.title}
                    </td>
                    <td className="p-4 block md:table-cell border-b before:content-[attr(data-label)] md:before:content-none before:font-semibold before:mr-2" data-label="Beschreibung">
                      {task.description}
                    </td>
                    <td className="p-4 block md:table-cell border-b before:content-[attr(data-label)] md:before:content-none before:font-semibold before:mr-2" data-label="Status">
                      <span className="px-2 py-1 rounded bg-opacity-20 text-sm" 
                            style={{ 
                              backgroundColor: task.status === 'Erledigt' 
                                ? 'var(--confetti-400)' 
                                : 'var(--confetti-200)',
                              color: 'var(--confetti-900)'
                            }}>
                        {task.status || 'In Bearbeitung'}
                      </span>
                    </td>
                    <td className="p-4 block md:table-cell border-b before:content-[attr(data-label)] md:before:content-none before:font-semibold before:mr-2" data-label="Erstellt am">
                      {task.created_at ? formatDate(task.created_at) : 'N/A'}
                    </td>
                    <td className="p-4 block md:table-cell border-b">
                      <div className="flex gap-2 justify-end md:justify-start">
                        <button 
                          onClick={() => handleEdit(task)}
                          className="p-1 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <SquarePen className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Füge Modal hinzu */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/80 p-4 md:p-6 rounded-lg w-11/12 md:w-96 max-w-md">
            <h2 className="text-xl font-bold mb-4">Aufgabe bearbeiten</h2>
            <div className="mb-4">
              <label className="block mb-2">Titel*</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Beschreibung</label>
              <textarea
                className="w-full p-2 border rounded"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Status</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedTask?.status || ''}
                onChange={(e) => setSelectedTask({...selectedTask, status: e.target.value})}
              >
                <option value="open">Offen</option>
                <option value="in progress">In Bearbeitung</option>
                <option value="done">Erledigt</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[var(--confetti-400)] text-white rounded hover:bg-[var(--confetti-500)]"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          tr {
            display: block;
            border: 1px solid #e5e7eb;
            margin-bottom: 1rem;
          }
          td {
            display: block;
            text-align: right;
          }
          td:before {
            content: attr(data-label);
            float: left;
            font-weight: 500;
          }
          th {
            display: none;
          }
        }
      `}</style>
    </div>
  );  
}
