'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);

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

  return (
    <div className="p-8" style={{ backgroundColor: 'var(--confetti-50)', color: 'var(--confetti-900)' }}>
      <h1 className="text-2xl font-bold">Dashboard</h1>
  
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          router.push('/login');
        }}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        style={{ backgroundColor: 'var(--confetti-400)' }}
      >
        Abmelden
      </button>
  
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Deine Aufgaben</h2>
        {tasks.length === 0 ? (
          <p>Keine Aufgaben gefunden.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task, index) => (
              <li key={task.id || index} className="p-4 bg-gray-100 rounded shadow" style={{ backgroundColor: 'var(--confetti-100)' }}>
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-gray-700">{task.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );  
}
