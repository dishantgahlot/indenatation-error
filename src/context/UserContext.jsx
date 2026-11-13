import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuthToken, 
  clearAuthToken, 
  loginUser, 
  registerUser, 
  fetchMe, 
  updateAvatar 
} from '../api/client';

// 16 Clean Avatar Character Presets from the DiceBear Library
export const CHARACTER_PRESETS = [
  {
    id: 'explorer',
    name: 'Alex',
    title: 'Mountain Explorer',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    themeColor: '#b86f50'
  },
  {
    id: 'stargazer',
    name: 'Aura',
    title: 'Sunset Stargazer',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aura&backgroundColor=ffd5dc',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aura&backgroundColor=ffd5dc',
    themeColor: '#7a5a8c'
  },
  {
    id: 'wanderer',
    name: 'Aria',
    title: 'Horizon Nomad',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=ffdfbf',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=ffdfbf',
    themeColor: '#c27838'
  },
  {
    id: 'ranger',
    name: 'Kaelen',
    title: 'Emerald Ranger',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kaelen&backgroundColor=d1fae5',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kaelen&backgroundColor=d1fae5',
    themeColor: '#15803d'
  },
  {
    id: 'scholar',
    name: 'Ren',
    title: 'Field Scholar',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ren&backgroundColor=e0e7ff',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ren&backgroundColor=e0e7ff',
    themeColor: '#4f785a'
  },
  {
    id: 'architect',
    name: 'Neo',
    title: 'Systems Architect',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Neo&backgroundColor=cffafe',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Neo&backgroundColor=cffafe',
    themeColor: '#06b6d4'
  },
  {
    id: 'analyst',
    name: 'Maya',
    title: 'Data Strategist',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&backgroundColor=f3e8ff',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&backgroundColor=f3e8ff',
    themeColor: '#8b5cf6'
  },
  {
    id: 'inventor',
    name: 'Ezekiel',
    title: 'Arcane Mechanist',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ezekiel&backgroundColor=fef3c7',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ezekiel&backgroundColor=fef3c7',
    themeColor: '#d97706'
  },
  {
    id: 'ascetic',
    name: 'Sora',
    title: 'Mindful Ascetic',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sora&backgroundColor=fce7f3',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sora&backgroundColor=fce7f3',
    themeColor: '#ec4899'
  },
  {
    id: 'botanist',
    name: 'Lyra',
    title: 'Solar Botanist',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lyra&backgroundColor=ccfbf1',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lyra&backgroundColor=ccfbf1',
    themeColor: '#10b981'
  },
  {
    id: 'dreamer',
    name: 'Selene',
    title: 'Lunar Dreamer',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Selene&backgroundColor=ede9fe',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Selene&backgroundColor=ede9fe',
    themeColor: '#6366f1'
  },
  {
    id: 'oracle',
    name: 'Seraphina',
    title: 'Visionary Guide',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Seraphina&backgroundColor=fae8ff',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Seraphina&backgroundColor=fae8ff',
    themeColor: '#a855f7'
  },
  {
    id: 'titan',
    name: 'Ares',
    title: 'Iron Titan',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ares&backgroundColor=fee2e2',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ares&backgroundColor=fee2e2',
    themeColor: '#dc2626'
  },
  {
    id: 'striker',
    name: 'Valerie',
    title: 'Wind Striker',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Valerie&backgroundColor=fef9c3',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Valerie&backgroundColor=fef9c3',
    themeColor: '#f59e0b'
  },
  {
    id: 'ronin',
    name: 'Jin',
    title: 'Discipline Master',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jin&backgroundColor=f1f5f9',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jin&backgroundColor=f1f5f9',
    themeColor: '#475569'
  },
  {
    id: 'vanguard',
    name: 'Freya',
    title: 'Dawn Vanguard',
    avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Freya&backgroundColor=ffe4e6',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Freya&backgroundColor=ffe4e6',
    themeColor: '#e11d48'
  }
];

export const GUEST_USER = {
  id: null,
  name: 'Explorer',
  email: '',
  characterId: 'explorer',
  category: 'explorer',
  title: 'Mountain Explorer',
  avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
  avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
  themeColor: '#b86f50',
  customAvatarUrl: '',
  isCustom: false,
  isGuest: true
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(getAuthToken()));

  // User state
  const [user, setUser] = useState(() => {
    const hasToken = typeof window !== 'undefined' && Boolean(getAuthToken());
    if (!hasToken) {
      return GUEST_USER;
    }

    try {
      const saved = localStorage.getItem('future_you_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn('Could not read user profile from localStorage', e);
    }
    return GUEST_USER;
  });

  // Modal visibility states
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [avatarChoosePrompt, setAvatarChoosePrompt] = useState(false);
  const [loginNotification, setLoginNotification] = useState(null);
  const notifTimerRef = React.useRef(null);

  const showNotification = (title, message = '', type = 'success') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setLoginNotification({
      id: Date.now(),
      title,
      message,
      type
    });
    notifTimerRef.current = setTimeout(() => {
      setLoginNotification(null);
    }, 3500);
  };

  const dismissNotification = () => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setLoginNotification(null);
  };

  // Sync profile changes to localStorage when authenticated
  useEffect(() => {
    try {
      if (isAuthenticated && user && user.id) {
        localStorage.setItem('future_you_user_profile', JSON.stringify(user));
      }
    } catch (e) {
      console.warn('Could not save user profile to localStorage', e);
    }
  }, [user, isAuthenticated]);

  // Check auth session on startup
  useEffect(() => {
    const existingToken = getAuthToken();
    if (existingToken) {
      setIsAuthLoading(true);
      fetchMe().then(serverUser => {
        if (serverUser) {
          const preset = CHARACTER_PRESETS.find(c => c.id === serverUser.character_id) || CHARACTER_PRESETS[0];
          setIsAuthenticated(true);
          setUser({
            id: serverUser.id,
            name: serverUser.name || preset.name,
            email: serverUser.email,
            characterId: serverUser.character_id || preset.id,
            category: preset.category || 'explorer',
            title: serverUser.title || preset.title,
            avatarThumb: serverUser.avatar_thumb || preset.avatarThumb,
            avatarFull: serverUser.avatar_full || preset.avatarFull,
            themeColor: preset.themeColor,
            customAvatarUrl: serverUser.custom_avatar_url || '',
            isCustom: Boolean(serverUser.is_custom),
            isGuest: false
          });
        } else {
          clearAuthToken();
          setToken(null);
          setIsAuthenticated(false);
          setUser(GUEST_USER);
        }
      }).finally(() => {
        setIsAuthLoading(false);
      });
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  // --- Auth Handlers ---
  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data && data.user) {
      setToken(data.token);
      setIsAuthenticated(true);
      const u = data.user;
      const preset = CHARACTER_PRESETS.find(c => c.id === u.character_id) || CHARACTER_PRESETS[0];
      const newUserObj = {
        id: u.id,
        name: u.name || preset.name,
        email: u.email,
        characterId: u.character_id || preset.id,
        category: preset.category || 'explorer',
        title: u.title || preset.title,
        avatarThumb: u.avatar_thumb || preset.avatarThumb,
        avatarFull: u.avatar_full || preset.avatarFull,
        themeColor: preset.themeColor,
        customAvatarUrl: u.custom_avatar_url || '',
        isCustom: Boolean(u.is_custom),
        isGuest: false
      };
      setUser(newUserObj);
      try {
        localStorage.setItem('future_you_user_profile', JSON.stringify(newUserObj));
        // Clear previous user's cached metrics to avoid data bleed
        localStorage.removeItem('future_you_daily_metrics');
        localStorage.removeItem('future_you_lifestyle_score');
      } catch (e) {}

      setIsAuthModalOpen(false);

      // Clean, minimal real-world login notification
      showNotification(`Signed in as ${u.name || preset.name}`, '', 'success');

      // Notify other components that user changed
      window.dispatchEvent(new CustomEvent('future-you-habits-updated', { detail: { userId: u.id, refresh: true } }));
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser({ name, email, password, character_id: 'explorer' });
    if (data && data.user) {
      setToken(data.token);
      setIsAuthenticated(true);
      const u = data.user;
      const preset = CHARACTER_PRESETS.find(c => c.id === u.character_id) || CHARACTER_PRESETS[0];
      const newUserObj = {
        id: u.id,
        name: u.name || preset.name,
        email: u.email,
        characterId: u.character_id || preset.id,
        category: preset.category || 'explorer',
        title: u.title || preset.title,
        avatarThumb: u.avatar_thumb || preset.avatarThumb,
        avatarFull: u.avatar_full || preset.avatarFull,
        themeColor: preset.themeColor,
        customAvatarUrl: u.custom_avatar_url || '',
        isCustom: Boolean(u.is_custom),
        isGuest: false
      };
      setUser(newUserObj);
      try {
        localStorage.setItem('future_you_user_profile', JSON.stringify(newUserObj));
        // Clear previous user's cached metrics to avoid data bleed
        localStorage.removeItem('future_you_daily_metrics');
        localStorage.removeItem('future_you_lifestyle_score');
      } catch (e) {}

      setIsAuthModalOpen(false);

      // Clean, minimal registration notification
      showNotification(`Account created for ${u.name || preset.name}`, '', 'success');

      // Open Avatar Selection modal for fresh character customization
      setIsCharacterModalOpen(true);
      window.dispatchEvent(new CustomEvent('future-you-habits-updated', { detail: { userId: u.id, refresh: true } }));
    }
    return data;
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setIsAuthenticated(false);
    setUser(GUEST_USER);
    try {
      localStorage.removeItem('future_you_user_profile');
      localStorage.removeItem('future_you_daily_metrics');
      localStorage.removeItem('future_you_lifestyle_score');
    } catch (e) {}
    showNotification('Signed out', '', 'info');
    window.dispatchEvent(new CustomEvent('future-you-habits-updated', { detail: { isLogout: true, refresh: true } }));
  };

  // --- Avatar Selection Handlers (Saved directly to backend and followed everywhere) ---
  const selectCharacter = async (characterId, newName, newEmail) => {
    const preset = CHARACTER_PRESETS.find(c => c.id === characterId);
    if (!preset) return;

    const updatedName = newName || user.name || preset.name;
    const updatedUser = {
      ...user,
      characterId: preset.id,
      category: preset.category,
      title: preset.title,
      name: updatedName,
      email: newEmail || user.email,
      avatarThumb: preset.avatarThumb,
      avatarFull: preset.avatarFull,
      themeColor: preset.themeColor,
      isCustom: false
    };

    setUser(updatedUser);

    // Save to backend
    try {
      await updateAvatar({
        character_id: preset.id,
        title: preset.title,
        avatar_thumb: preset.avatarThumb,
        avatar_full: preset.avatarFull,
        is_custom: false,
        name: updatedName
      });
    } catch (err) {
      console.warn('Could not sync avatar to backend:', err);
    }
  };

  const setCustomAvatar = async (imageUrl, newName) => {
    if (!imageUrl || !imageUrl.trim()) return;

    const updatedName = newName || user.name;
    const updatedUser = {
      ...user,
      name: updatedName,
      characterId: 'custom',
      category: 'custom',
      title: 'Custom Persona',
      avatarThumb: imageUrl.trim(),
      avatarFull: imageUrl.trim(),
      customAvatarUrl: imageUrl.trim(),
      isCustom: true
    };

    setUser(updatedUser);

    // Save to backend
    try {
      await updateAvatar({
        character_id: 'custom',
        title: 'Custom Persona',
        avatar_thumb: imageUrl.trim(),
        avatar_full: imageUrl.trim(),
        custom_avatar_url: imageUrl.trim(),
        is_custom: true,
        name: updatedName
      });
    } catch (err) {
      console.warn('Could not sync custom avatar to backend:', err);
    }
  };

  const updateAccount = async ({ name, email, characterId, customAvatarUrl }) => {
    let targetThumb = user.avatarThumb;
    let targetFull = user.avatarFull;
    let targetTitle = user.title;
    let targetCategory = user.category || '';
    let targetTheme = user.themeColor || '#b86f50';
    let isCustom = user.isCustom;

    if (characterId === 'custom' && customAvatarUrl) {
      targetThumb = customAvatarUrl;
      targetFull = customAvatarUrl;
      targetTitle = 'Custom Persona';
      targetCategory = 'custom';
      isCustom = true;
    } else if (characterId) {
      const preset = CHARACTER_PRESETS.find(c => c.id === characterId);
      if (preset) {
        targetThumb = preset.avatarThumb;
        targetFull = preset.avatarFull;
        targetTitle = preset.title;
        targetCategory = preset.category;
        targetTheme = preset.themeColor;
        isCustom = false;
      }
    }

    const updated = {
      ...user,
      name: name || user.name,
      email: email || user.email,
      characterId: characterId || user.characterId,
      category: targetCategory,
      title: targetTitle,
      avatarThumb: targetThumb,
      avatarFull: targetFull,
      themeColor: targetTheme,
      customAvatarUrl: customAvatarUrl || user.customAvatarUrl,
      isCustom
    };

    setUser(updated);

    try {
      await updateAvatar({
        name: updated.name,
        email: updated.email,
        character_id: updated.characterId,
        title: updated.title,
        avatar_thumb: updated.avatarThumb,
        avatar_full: updated.avatarFull,
        custom_avatar_url: updated.customAvatarUrl,
        is_custom: updated.isCustom
      });
    } catch (err) {
      console.warn('Could not sync account updates to backend:', err);
    }
  };

  const openCharacterModal = () => setIsCharacterModalOpen(true);
  const closeCharacterModal = () => {
    setIsCharacterModalOpen(false);
    setAvatarChoosePrompt(false);
  };

  useEffect(() => {
    const handleOpenCharModal = () => setIsCharacterModalOpen(true);
    const handleShowNotif = (e) => {
      if (e.detail) {
        showNotification(e.detail.title || 'Notification', e.detail.message || '', e.detail.type || 'success');
      }
    };
    window.addEventListener('future-you-open-character-modal', handleOpenCharModal);
    window.addEventListener('future-you-show-notification', handleShowNotif);
    return () => {
      window.removeEventListener('future-you-open-character-modal', handleOpenCharModal);
      window.removeEventListener('future-you-show-notification', handleShowNotif);
    };
  }, []);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('future_you_guest_dismissed', 'true');
    }
  };

  return (
    <UserContext.Provider value={{
      token,
      isAuthenticated,
      isAuthLoading,
      user,
      login,
      register,
      logout,
      selectCharacter,
      setCustomAvatar,
      updateAccount,
      isCharacterModalOpen,
      openCharacterModal,
      closeCharacterModal,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      avatarChoosePrompt,
      loginNotification,
      showNotification,
      dismissNotification
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
