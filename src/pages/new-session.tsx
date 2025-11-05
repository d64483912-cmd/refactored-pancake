import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth';

export default function NewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: authData } = await authClient.getSession();
        if (!authData?.session) {
          navigate('/sign-in', { state: { from: `/new/${sessionId}` } });
          return;
        }

        const res = await apiClient.sessions[':sessionId'].$get({
          param: { sessionId: sessionId! },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch session');
        }

        const data = await res.json();
        setSession(data.session);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch session');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Session not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{session.title}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {session.status}
            </span>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Agent Type</h2>
            <p className="text-gray-600 capitalize">{session.agentType.replace('_', ' ')}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Task Description</h2>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{session.initialMessage}</p>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500">
              Created: {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}