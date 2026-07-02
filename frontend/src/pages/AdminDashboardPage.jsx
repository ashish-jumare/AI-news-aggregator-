import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage({ onClose }) {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [toast, setToast] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('all');

  useEffect(() => {
    const loadAdminData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view the admin dashboard.');
        setLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [overviewRes, usersRes, feedbackRes, contactRes] = await Promise.all([
          axios.get(API_ENDPOINTS.ADMIN_OVERVIEW, { headers }),
          axios.get(API_ENDPOINTS.ADMIN_USERS, { headers }),
          axios.get(`${API_ENDPOINTS.FEEDBACK}?limit=500&skip=0`, { headers }),
          axios.get(`${API_ENDPOINTS.CONTACTS}?limit=500&skip=0`, { headers })
        ]);

        if (!overviewRes.data?.success) {
          setError('Unable to load admin overview.');
          return;
        }

        setOverview(overviewRes.data);
        setUsers(usersRes.data?.users || []);
        setFeedbacks(feedbackRes.data?.feedbacks || []);
        setContacts(contactRes.data?.contacts || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load admin data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const stats = overview?.stats;
  const isAdmin = user?.role === 'admin';

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 2000);
  };

  const updateFeedbackStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await axios.patch(
        API_ENDPOINTS.ADMIN_FEEDBACK_STATUS(id),
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedbacks((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));

      const emailStatus = response.data?.emailNotification?.status;
      if (emailStatus === 'sent') {
        showToast('Feedback status updated and email sent');
      } else if (emailStatus === 'failed') {
        showToast('Feedback updated, but email failed', 'error');
      } else {
        showToast('Feedback status updated (email skipped)');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to update feedback status.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const updateContactStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await axios.patch(
        API_ENDPOINTS.ADMIN_CONTACT_STATUS(id),
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setContacts((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));

      const emailStatus = response.data?.emailNotification?.status;
      if (emailStatus === 'sent') {
        showToast('Contact status updated and email sent');
      } else if (emailStatus === 'failed') {
        showToast('Contact updated, but email failed', 'error');
      } else {
        showToast('Contact status updated (email skipped)');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to update contact status.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const removeFeedback = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Remove this feedback?')) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(API_ENDPOINTS.ADMIN_DELETE_FEEDBACK(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks((prev) => prev.filter((item) => item._id !== id));
      setOverview((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          feedbacks: Math.max(0, (prev.stats?.feedbacks || 0) - 1)
        }
      }));
      showToast('Feedback removed');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to remove feedback.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const removeContact = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Remove this contact?')) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(API_ENDPOINTS.ADMIN_DELETE_CONTACT(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts((prev) => prev.filter((item) => item._id !== id));
      setOverview((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          contacts: Math.max(0, (prev.stats?.contacts || 0) - 1)
        }
      }));
      showToast('Contact removed');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to remove contact.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const removeUser = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Remove this user account?')) return;

    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(API_ENDPOINTS.ADMIN_DELETE_USER(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers((prev) => prev.filter((item) => item._id !== id));
      setOverview((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          users: Math.max(0, (prev.stats?.users || 0) - 1)
        }
      }));
      showToast('User removed');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to remove user.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredFeedbacks = (feedbacks || []).filter((item) => {
    const matchesStatus = feedbackStatusFilter === 'all' || item.status === feedbackStatusFilter;
    const query = feedbackSearch.trim().toLowerCase();
    if (!query) return matchesStatus;
    const haystack = `${item.ticketNumber} ${item.email} ${item.category}`.toLowerCase();
    return matchesStatus && haystack.includes(query);
  });

  const filteredContacts = (contacts || []).filter((item) => {
    const matchesStatus = contactStatusFilter === 'all' || item.status === contactStatusFilter;
    const query = contactSearch.trim().toLowerCase();
    if (!query) return matchesStatus;
    const haystack = `${item.fullName} ${item.email} ${item.subject}`.toLowerCase();
    return matchesStatus && haystack.includes(query);
  });

  const filteredUsers = (users || []).filter((item) => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return true;
    const haystack = `${item.fullName} ${item.email} ${item.role}`.toLowerCase();
    return haystack.includes(query);
  });

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
            {toast.message}
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              System overview for users, content, and activity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {!isAdmin && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              You do not have admin access.
            </div>
          )}

          {loading && (
            <div className="text-gray-600 dark:text-gray-400">Loading admin overview...</div>
          )}

          {!loading && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && stats && (
            <>
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'Users', value: stats.users },
                  { label: 'Feedback', value: stats.feedbacks },
                  { label: 'Contacts', value: stats.contacts },
                  { label: 'Portfolios', value: stats.portfolios },
                  { label: 'Bookmarks', value: stats.bookmarks },
                  { label: 'Tweets', value: stats.tweets },
                  { label: 'Chats', value: stats.chats }
                ].map((card) => (
                  <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Feedback</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{filteredFeedbacks.length} items</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <input
                      type="text"
                      value={feedbackSearch}
                      onChange={(event) => setFeedbackSearch(event.target.value)}
                      placeholder="Search feedback"
                      className="flex-1 min-w-[140px] text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    />
                    <select
                      value={feedbackStatusFilter}
                      onChange={(event) => setFeedbackStatusFilter(event.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under review</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div
                    className="space-y-3 text-sm max-h-[26rem] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {filteredFeedbacks.length ? (
                      filteredFeedbacks.map((item) => (
                        <div key={item._id} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                          <p className="font-semibold text-gray-900 dark:text-white">{item.ticketNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.email} • {item.category}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(event) => updateFeedbackStatus(item._id, event.target.value)}
                              className="text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                              disabled={Boolean(updating[item._id])}
                            >
                              <option value="pending">Pending</option>
                              <option value="under_review">Under review</option>
                              <option value="in_progress">In progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeFeedback(item._id)}
                              disabled={Boolean(updating[item._id])}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300"
                              title="Remove feedback"
                              aria-label="Remove feedback"
                            >
                              ×
                            </button>
                            {updating[item._id] && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No feedback found.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Contacts</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{filteredContacts.length} items</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(event) => setContactSearch(event.target.value)}
                      placeholder="Search contacts"
                      className="flex-1 min-w-[140px] text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    />
                    <select
                      value={contactStatusFilter}
                      onChange={(event) => setContactStatusFilter(event.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      <option value="all">All</option>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div
                    className="space-y-3 text-sm max-h-[26rem] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {filteredContacts.length ? (
                      filteredContacts.map((item) => (
                        <div key={item._id} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                          <p className="font-semibold text-gray-900 dark:text-white">{item.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.subject}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <select
                              value={item.status}
                              onChange={(event) => updateContactStatus(item._id, event.target.value)}
                              className="text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                              disabled={Boolean(updating[item._id])}
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="responded">Responded</option>
                              <option value="closed">Closed</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeContact(item._id)}
                              disabled={Boolean(updating[item._id])}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300"
                              title="Remove contact"
                              aria-label="Remove contact"
                            >
                              ×
                            </button>
                            {updating[item._id] && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">Updating...</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No contacts found.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Users</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{filteredUsers.length} items</span>
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search users"
                      className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    />
                  </div>
                  <div
                    className="space-y-3 text-sm max-h-[26rem] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {filteredUsers.length ? (
                      filteredUsers.map((item) => (
                        <div key={item._id} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                          <p className="font-semibold text-gray-900 dark:text-white">{item.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.email} • {item.role}</p>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => removeUser(item._id)}
                              disabled={Boolean(updating[item._id]) || item._id === user?.id}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300 disabled:opacity-50"
                              title="Remove user"
                              aria-label="Remove user"
                            >
                              ×
                            </button>
                            {item._id === user?.id && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Current user</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No users found.</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
