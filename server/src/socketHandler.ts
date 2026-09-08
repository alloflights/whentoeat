import { Server, Socket } from 'socket.io';
import {
  getRoomState,
  saveRestaurant,
  updateRestaurant,
  deleteRestaurant,
  scheduleRestaurant,
  unscheduleRestaurant,
  resetAllSchedules,
  updateRoomUsers,
  restoreRoomState,
  completeRestaurant,
  addCompletedRestaurant,
  revisitRestaurant,
  skipRestaurant,
  setBusyStatus,
  clearBusyStatus
} from './db.js';
import { getNextScheduleStep } from './scheduler.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoomId = 'default';

    socket.on('join-room', ({ roomId = 'default' }: { roomId?: string }) => {
      socket.leave(currentRoomId);
      currentRoomId = roomId;
      socket.join(roomId);

      const state = getRoomState(roomId);
      socket.emit('room-state', state);

      // Notify others in room of active participants
      const roomClients = io.sockets.adapter.rooms.get(roomId)?.size || 1;
      io.to(roomId).emit('presence-update', { activeCount: roomClients });
    });

    socket.on('update-profile', ({ roomId, user1Name, user2Name }: { roomId: string; user1Name: string; user2Name: string }) => {
      updateRoomUsers(roomId, user1Name, user2Name);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('restore-room-state', ({ roomId, backupState }: { roomId: string; backupState: any }) => {
      if (backupState && typeof backupState === 'object') {
        restoreRoomState(roomId, backupState);
        io.to(roomId).emit('room-state', getRoomState(roomId));
      }
    });

    socket.on('set-busy', ({
      roomId,
      date,
      slotType,
      weekday,
      userRole,
      busyType,
      reason,
    }: {
      roomId: string;
      date: string;
      slotType: string;
      weekday: number;
      userRole: 'user1' | 'user2';
      busyType: 'weekly' | 'this_week' | 'temp';
      reason?: string;
    }) => {
      const updatedState = setBusyStatus(roomId, userRole, date, slotType, weekday, busyType, reason);
      io.to(roomId).emit('room-state', updatedState);
    });

    socket.on('clear-busy', ({
      roomId,
      date,
      slotType,
      weekday,
      userRole,
      clearWeekly = false,
    }: {
      roomId: string;
      date: string;
      slotType: string;
      weekday?: number;
      userRole: 'user1' | 'user2';
      clearWeekly?: boolean;
    }) => {
      const updatedState = clearBusyStatus(roomId, userRole, date, slotType, weekday, clearWeekly);
      io.to(roomId).emit('room-state', updatedState);
    });

    socket.on('add-restaurant', ({
      roomId,
      name,
      category,
      priority,
      preferredSlotType,
      notes
    }: {
      roomId: string;
      name: string;
      category: string;
      priority: number;
      preferredSlotType: any;
      notes?: string;
    }) => {
      saveRestaurant({
        roomId,
        name,
        category,
        priority,
        preferredSlotType,
        notes,
      });
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('update-restaurant', ({
      roomId,
      restaurantId,
      updates
    }: {
      roomId: string;
      restaurantId: string;
      updates: any;
    }) => {
      updateRestaurant(roomId, restaurantId, updates);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('delete-restaurant', ({ roomId, restaurantId }: { roomId: string; restaurantId: string }) => {
      deleteRestaurant(roomId, restaurantId);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('get-schedule-step', ({ roomId }: { roomId: string }) => {
      const state = getRoomState(roomId);
      const step = getNextScheduleStep(state);
      socket.emit('schedule-step', step);
    });

    socket.on('confirm-schedule-step', ({
      roomId,
      restaurantId,
      date,
      slotType,
      slotLabel
    }: {
      roomId: string;
      restaurantId: string;
      date: string;
      slotType: string;
      slotLabel: string;
    }) => {
      scheduleRestaurant(roomId, restaurantId, date, slotType, slotLabel);
      const updatedState = getRoomState(roomId);
      // Broadcast state update to everyone in room
      io.to(roomId).emit('room-state', updatedState);

      // Compute next step immediately
      const nextStep = getNextScheduleStep(updatedState);
      io.to(roomId).emit('schedule-step-confirmed', {
        confirmedRestaurantId: restaurantId,
        date,
        slotType,
        slotLabel,
        nextStep
      });
    });

    socket.on('skip-schedule-step', ({ roomId, restaurantId }: { roomId: string; restaurantId: string }) => {
      skipRestaurant(roomId, restaurantId);
      const updatedState = getRoomState(roomId);
      io.to(roomId).emit('room-state', updatedState);
      const nextStep = getNextScheduleStep(updatedState);
      io.to(roomId).emit('schedule-step', nextStep);
    });

    socket.on('unschedule-restaurant', ({ roomId, restaurantId }: { roomId: string; restaurantId: string }) => {
      unscheduleRestaurant(roomId, restaurantId);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('complete-restaurant', ({
      roomId,
      restaurantId,
      details
    }: {
      roomId: string;
      restaurantId: string;
      details: {
        eatenDate?: string;
        rating?: number;
        review?: string;
        cost?: string | number;
      };
    }) => {
      completeRestaurant(roomId, restaurantId, details);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('add-completed-restaurant', ({
      roomId,
      data
    }: {
      roomId: string;
      data: any;
    }) => {
      addCompletedRestaurant(roomId, data);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('revisit-restaurant', ({
      roomId,
      restaurantId
    }: {
      roomId: string;
      restaurantId: string;
    }) => {
      revisitRestaurant(roomId, restaurantId);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('reset-all-schedules', ({ roomId }: { roomId: string }) => {
      resetAllSchedules(roomId);
      io.to(roomId).emit('room-state', getRoomState(roomId));
    });

    socket.on('disconnect', () => {
      const roomClients = io.sockets.adapter.rooms.get(currentRoomId)?.size || 0;
      io.to(currentRoomId).emit('presence-update', { activeCount: roomClients });
    });
  });
}
