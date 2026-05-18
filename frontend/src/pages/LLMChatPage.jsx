import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LLMChatPage({ onClose }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showImagesGallery, setShowImagesGallery] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px'; // Max 128px
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInputMessage(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(API_ENDPOINTS.CHATS, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInputMessage('');
    setSelectedImages([]);
    setShowImagesGallery(false);
    setSearchQuery('');
  };

  const handleChatSelect = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(API_ENDPOINTS.CHAT_BY_ID(chatId), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCurrentChatId(chatId);
        setMessages(response.data.chat.messages || []);
        setShowImagesGallery(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setCurrentChatId(chatId);
      setMessages([]);
    }
  };

  const handleShowImages = async () => {
    try {
      setIsLoadingImages(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load all chats to extract images
      const response = await axios.get(API_ENDPOINTS.CHATS, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Get all chat IDs
        const chatIds = response.data.chats.map(chat => chat._id);
        
        // Fetch all chats with messages - handle failures gracefully
        const chatDetailsPromises = chatIds.map(chatId =>
          axios.get(API_ENDPOINTS.CHAT_BY_ID(chatId), {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => {
            console.error(`Failed to load chat ${chatId}:`, err);
            return null; // Return null for failed requests
          })
        );

        const chatDetailsResponses = await Promise.all(chatDetailsPromises);
        
        // Extract all images from all messages
        const images = [];
        chatDetailsResponses.forEach(res => {
          // Skip null responses (failed requests)
          if (res && res.data && res.data.success && res.data.chat.messages) {
            res.data.chat.messages.forEach(msg => {
              if (msg.images && msg.images.length > 0) {
                msg.images.forEach(img => {
                  images.push({
                    ...img,
                    chatId: res.data.chat._id,
                    chatTitle: res.data.chat.title,
                    timestamp: msg.timestamp
                  });
                });
              }
            });
          }
        });

        setAllImages(images);
        setShowImagesGallery(true);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      alert('Failed to load images. Please try again.');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes (max 5MB per image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      alert(`Some images are too large (max 5MB). ${invalidFiles.length} file(s) skipped.`);
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      alert('Only JPEG, PNG, GIF, and WebP images are supported.');
      return;
    }

    // Convert images to base64
    const imagePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: file.name,
          type: file.type,
          data: e.target.result
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises)
      .then(images => {
        setSelectedImages(prev => [...prev, ...images]);
      })
      .catch(error => {
        console.error('Error reading images:', error);
        alert('Failed to load images. Please try again.');
      });

    // Reset file input
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage || 'Uploaded image(s)',
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date()
    };

    const currentInput = inputMessage;
    const currentImages = selectedImages;
    setInputMessage('');
    setSelectedImages([]);
    setIsLoading(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message to UI immediately
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);

    try {
      // Prepare messages for API (include conversation history)
      const conversationHistory = messagesWithUser.map(msg => ({
        role: msg.role,
        content: msg.content,
        images: msg.images
      }));

      // Call Gemini API
      const response = await axios.post(API_ENDPOINTS.GEMINI_CHAT, {
        messages: conversationHistory
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date()
        };
        const updatedMessages = [...messagesWithUser, aiMessage];
        setMessages(updatedMessages);

        // Save chat to backend
        await saveChatToBackend(updatedMessages);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Show error message to user
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.message || error.message || 'Unable to connect to AI service'}. Please make sure the Gemini API key is configured in the backend.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatToBackend = async (updatedMessages) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, skipping chat save');
        return;
      }

      // Format messages for backend (remove id field, only send role, content, timestamp, images)
      const formattedMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        images: msg.images
      }));

      if (currentChatId) {
        // Update existing chat
        const response = await axios.put(
          API_ENDPOINTS.CHAT_BY_ID(currentChatId),
          { messages: formattedMessages },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Chat updated successfully:', response.data);
      } else {
        // Create new chat
        const response = await axios.post(
          API_ENDPOINTS.CHATS,
          { messages: formattedMessages },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setCurrentChatId(response.data.chat._id);
          console.log('New chat created:', response.data.chat);
          // Reload chats to show new chat in sidebar
          await loadChats();
        }
      }
    } catch (error) {
      console.error('Error saving chat:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.delete(API_ENDPOINTS.CHAT_BY_ID(chatId), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChats(chats.filter(chat => chat._id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handlePinChat = async (chatId, e) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.patch(
        API_ENDPOINTS.CHAT_PIN(chatId),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setChats(chats.map(chat => 
          chat._id === chatId ? { ...chat, pinned: response.data.chat.pinned } : chat
        ));
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyMessage = async (messageId, content) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId((current) => (current === messageId ? null : current));
      }, 1500);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-white overflow-hidden z-50">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-white dark:bg-gray-950 border-r border-slate-200 dark:border-gray-800 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-semibold">NEWSINSIGHT</span>
          </div>
          
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 px-3 py-2 pl-9 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:ring-gray-600 transition-all"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <svg className="w-3 h-3 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="px-3">
          <button 
            onClick={handleShowImages}
            disabled={isLoadingImages}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              showImagesGallery ? 'bg-slate-100 text-slate-900 dark:bg-gray-800 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoadingImages ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <span>{isLoadingImages ? 'Loading...' : 'Images'}</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 mt-4">
          <div className="text-xs text-slate-500 dark:text-gray-500 px-3 mb-2 font-medium">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Your chats'}
          </div>
          <div className="space-y-1">
            {(() => {
              const filteredChats = chats.filter(chat => 
                searchQuery === '' || 
                chat.title.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredChats.length === 0 && searchQuery) {
                return (
                  <div className="text-center py-8 px-3">
                    <svg className="w-12 h-12 mx-auto text-slate-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-slate-500 dark:text-gray-400">No chats found</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try a different search term</p>
                  </div>
                );
              }

              if (filteredChats.length === 0) {
                return (
                  <div className="text-center py-8 px-3">
                    <p className="text-sm text-slate-500 dark:text-gray-400">No chats yet</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Start a new conversation</p>
                  </div>
                );
              }

              return filteredChats.map(chat => (
              <div
                key={chat._id}
                onClick={() => handleChatSelect(chat._id)}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat._id ? 'bg-slate-100 dark:bg-gray-800' : 'hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex-1 text-sm truncate">{chat.title}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => handlePinChat(chat._id, e)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded"
                    title={chat.pinned ? 'Unpin' : 'Pin'}
                  >
                    <svg className={`w-3 h-3 ${chat.pinned ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.61.548 2.112A3.989 3.989 0 007.5 16H9v2a1 1 0 102 0v-2h1.5a3.989 3.989 0 002.77-1.062c.578-.502.798-1.332.548-2.112L15 10.274V6.5a1 1 0 10-2 0v3.274l-.818 2.552c-.25.78-.03 1.61.548 2.112.578.502 1.331.562 2.022.602a2.003 2.003 0 01-.784.62A2 2 0 0113.5 16H11v2a1 1 0 11-2 0v-2H7.5a2 2 0 01-1.468-.64 2.003 2.003 0 01-.784-.62c.691-.04 1.444-.1 2.022-.602.578-.502.798-1.332.548-2.112L7 9.774V6.5a1 1 0 10-2 0v3.774z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded"
                    title="Delete"
                  >
                    <svg className="w-3 h-3 text-slate-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ));
            })()}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full" />
              ) : (
                <span>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.fullName || 'User'}</div>
              <div className="text-xs text-slate-500 dark:text-gray-400">Go</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">TradeGPT</span>
              <span className="text-sm text-slate-500 dark:text-gray-400">7.1</span>
              <svg className="w-4 h-4 text-slate-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              title="Back to News"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {showImagesGallery ? (
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Image Gallery</h2>
                <p className="text-gray-400 text-sm">All images from your conversations</p>
              </div>
              
              {allImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <svg className="w-24 h-24 text-slate-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-xl font-medium text-slate-700 dark:text-gray-300 mb-2">No images yet</h3>
                  <p className="text-slate-500 dark:text-gray-500">Upload images in your conversations to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allImages.map((image, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-all">
                      <img
                        src={image.data}
                        alt={image.name || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-end p-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full">
                          <p className="text-xs text-white font-medium truncate">{image.chatTitle}</p>
                          <p className="text-xs text-gray-300 truncate">{image.name}</p>
                          {image.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(image.timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <h1 className="text-4xl font-medium mb-12 text-center">What can I help with?</h1>
              
              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full mb-8">
                <button className="p-4 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-left transition-colors border border-slate-200 dark:border-gray-700">
                  <div className="font-medium mb-1">Analyze sentiment</div>
                  <div className="text-sm text-slate-500 dark:text-gray-400">of news articles about a company</div>
                </button>
                <button className="p-4 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-left transition-colors border border-slate-200 dark:border-gray-700">
                  <div className="font-medium mb-1">Summarize trends</div>
                  <div className="text-sm text-slate-500 dark:text-gray-400">in recent company news</div>
                </button>
                <button className="p-4 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-left transition-colors border border-slate-200 dark:border-gray-700">
                  <div className="font-medium mb-1">Compare companies</div>
                  <div className="text-sm text-slate-500 dark:text-gray-400">based on news sentiment</div>
                </button>
                <button className="p-4 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-left transition-colors border border-slate-200 dark:border-gray-700">
                  <div className="font-medium mb-1">Generate insights</div>
                  <div className="text-sm text-slate-500 dark:text-gray-400">from Twitter discussions</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8">
              {messages.map((message) => (
                <div key={message.id} className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-sm font-semibold">{user?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      {/* Display images if present */}
                      {message.images && message.images.length > 0 && (
                        <div className={`mb-2 flex flex-wrap gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.images.map((image, idx) => (
                            <img
                              key={idx}
                              src={image.data}
                              alt={image.name}
                              className="max-w-xs max-h-64 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <div className={`inline-block px-4 py-3 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-slate-900 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 dark:text-gray-400">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Copy
                            </button>
                            {copiedMessageId === message.id && (
                              <div className="absolute left-0 -top-7 rounded-md bg-slate-900 text-white text-[10px] px-2 py-1 shadow">
                                Copied
                              </div>
                            )}
                          </div>
                          <span>{formatMessageTime(message.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 mb-6">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-transparent">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-gray-800">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
            {/* Image Preview Area */}
            {selectedImages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.data}
                      alt={image.name}
                      className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-3 bg-white dark:bg-gray-800 rounded-2xl p-2 border border-slate-200 dark:border-gray-700 focus-within:border-slate-300 dark:focus-within:border-gray-600 transition-colors">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
                title="Upload images"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask anything"
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 outline-none resize-none max-h-32 py-2"
                rows="1"
                style={{ minHeight: '2.5rem', overflow: 'hidden' }}
              />
              {/* Voice input button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 transition-colors flex-shrink-0 ${
                  isRecording 
                    ? 'text-red-500 animate-pulse' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                <svg className="w-5 h-5" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={(!inputMessage.trim() && selectedImages.length === 0) || isLoading}
                className="p-2 bg-slate-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-500 text-center mt-2">
              TradeGPT can make mistakes. Check important info.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
