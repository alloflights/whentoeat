import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import type { RoomState, UserRole, ScheduleStepRecommendation, MealSlotType, BusyType } from '../types';

interface SocketContextValue {
  socket: Socket | null;
  roomState: RoomState | null;
  activeCount: number;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  scheduleStep: ScheduleStepRecommendation | null;
  isSchedulerOpen: boolean;
  openScheduler: () => void;
  closeScheduler: () => void;
  setBusy: (date: string, slotType: MealSlotType, weekday: number, busyType: BusyType, reason?: string) => void;
  clearBusy: (date: string, slotType: MealSlotType, weekday?: number, clearWeekly?: boolean) => void;
  addRestaurant: (r: {
    name: string;
    category: string;
    priority: number;
    preferredSlotType: 'any' | MealSlotType;
    notes?: string;
  }) => void;
  updateRestaurant: (id: string, updates: {
    name?: string;
    category?: string;
    priority?: number;
    preferredSlotType?: 'any' | MealSlotType;
    notes?: string;
  }) => void;
  deleteRestaurant: (id: string) => void;
  confirmScheduleStep: (restaurantId: string, date: string, slotType: MealSlotType, slotLabel: string) => void;
  skipScheduleStep: (restaurantId: string) => void;
  unscheduleRestaurant: (restaurantId: string) => void;
  resetAllSchedules: () => void;
  updateProfile: (user1Name: string, user2Name: string) => void;
  lastConfirmedRestaurantName: string | null;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode; roomId: string }> = ({ children, roomId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [activeCount, setActiveCount] = useState<number>(1);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user1');
  const [scheduleStep, setScheduleStep] = useState<ScheduleStepRecommendation | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState<boolean>(false);
  const [lastConfirmedRestaurantName, setLastConfirmedRestaurantName] = useState<string | null>(null);

  // Load user role preference from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem(`eat_together_role_${roomId}`);
    if (savedRole === 'user1' || savedRole === 'user2') {
      setCurrentUserRole(savedRole);
    }
  }, [roomId]);

  const handleSetUserRole = (role: UserRole) => {
    setCurrentUserRole(role);
    localStorage.setItem(`eat_together_role_${roomId}`, role);
  };

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId });
    });

    newSocket.on('room-state', (state: RoomState) => {
      setRoomState(state);

      const hasContent = (state.restaurants && state.restaurants.length > 0) ||
        Object.keys(state.weeklyBusy?.user1 || {}).length > 0 ||
        Object.keys(state.weeklyBusy?.user2 || {}).length > 0 ||
        Object.keys(state.dateBusy || {}).length > 0;

      const storageKey = `eat_together_backup_${roomId}`;

      if (hasContent) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(state));
        } catch {
          // ignore quota errors
        }
      } else {
        // Server returned empty state (e.g. after cloud redeployment). Auto-restore from local backup!
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && ((parsed.restaurants && parsed.restaurants.length > 0) || parsed.weeklyBusy || parsed.dateBusy)) {
              newSocket.emit('restore-room-state', { roomId, backupState: parsed });
            }
          }
        } catch {
          // ignore json errors
        }
      }
    });

    newSocket.on('presence-update', ({ activeCount }: { activeCount: number }) => {
      setActiveCount(activeCount);
    });

    newSocket.on('schedule-step', (step: ScheduleStepRecommendation | null) => {
      setScheduleStep(step);
    });

    newSocket.on('schedule-step-confirmed', ({ confirmedRestaurantId, nextStep }: {
      confirmedRestaurantId: string;
      date: string;
      slotType: string;
      slotLabel: string;
      nextStep: ScheduleStepRecommendation | null;
    }) => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Find restaurant name
      setRoomState((prev) => {
        if (prev) {
          const r = prev.restaurants.find(item => item.id === confirmedRestaurantId);
          if (r) setLastConfirmedRestaurantName(r.name);
        }
        return prev;
      });

      // Advance immediately to next step
      setScheduleStep(nextStep);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const setBusy = useCallback((date: string, slotType: MealSlotType, weekday: number, busyType: BusyType, reason?: string) => {
    if (!socket) return;
    socket.emit('set-busy', {
      roomId,
      date,
      slotType,
      weekday,
      userRole: currentUserRole,
      busyType,
      reason,
    });
  }, [socket, roomId, currentUserRole]);

  const clearBusy = useCallback((date: string, slotType: MealSlotType, weekday?: number, clearWeekly = false) => {
    if (!socket) return;
    socket.emit('clear-busy', {
      roomId,
      date,
      slotType,
      weekday,
      userRole: currentUserRole,
      clearWeekly,
    });
  }, [socket, roomId, currentUserRole]);

  const addRestaurant = useCallback((r: {
    name: string;
    category: string;
    priority: number;
    preferredSlotType: 'any' | MealSlotType;
    notes?: string;
  }) => {
    if (!socket) return;
    socket.emit('add-restaurant', {
      roomId,
      ...r,
    });
  }, [socket, roomId]);

  const updateRestaurant = useCallback((restaurantId: string, updates: {
    name?: string;
    category?: string;
    priority?: number;
    preferredSlotType?: 'any' | MealSlotType;
    notes?: string;
  }) => {
    if (!socket) return;
    socket.emit('update-restaurant', { roomId, restaurantId, updates });
  }, [socket, roomId]);

  const deleteRestaurant = useCallback((restaurantId: string) => {
    if (!socket) return;
    socket.emit('delete-restaurant', { roomId, restaurantId });
  }, [socket, roomId]);

  const openScheduler = useCallback(() => {
    if (!socket) return;
    setIsSchedulerOpen(true);
    socket.emit('get-schedule-step', { roomId });
  }, [socket, roomId]);

  const closeScheduler = useCallback(() => {
    setIsSchedulerOpen(false);
    setLastConfirmedRestaurantName(null);
  }, []);

  const confirmScheduleStep = useCallback((restaurantId: string, date: string, slotType: MealSlotType, slotLabel: string) => {
    if (!socket) return;
    socket.emit('confirm-schedule-step', {
      roomId,
      restaurantId,
      date,
      slotType,
      slotLabel,
    });
  }, [socket, roomId]);

  const skipScheduleStep = useCallback((restaurantId: string) => {
    if (!socket) return;
    socket.emit('skip-schedule-step', { roomId, restaurantId });
  }, [socket, roomId]);

  const unscheduleRestaurant = useCallback((restaurantId: string) => {
    if (!socket) return;
    socket.emit('unschedule-restaurant', { roomId, restaurantId });
  }, [socket, roomId]);

  const resetAllSchedules = useCallback(() => {
    if (!socket) return;
    socket.emit('reset-all-schedules', { roomId });
  }, [socket, roomId]);

  const updateProfile = useCallback((user1Name: string, user2Name: string) => {
    if (!socket) return;
    socket.emit('update-profile', { roomId, user1Name, user2Name });
  }, [socket, roomId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        roomState,
        activeCount,
        currentUserRole,
        setCurrentUserRole: handleSetUserRole,
        scheduleStep,
        isSchedulerOpen,
        openScheduler,
        closeScheduler,
        setBusy,
        clearBusy,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        confirmScheduleStep,
        skipScheduleStep,
        unscheduleRestaurant,
        resetAllSchedules,
        updateProfile,
        lastConfirmedRestaurantName,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
