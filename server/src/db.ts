import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Restaurant, RoomState, BusyType, BusyRecord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const storePath = path.join(dbDir, 'store.json');

interface StoreData {
  rooms: Record<string, RoomState>;
}

function readStore(): StoreData {
  try {
    if (fs.existsSync(storePath)) {
      const content = fs.readFileSync(storePath, 'utf-8');
      const data = JSON.parse(content);
      return data;
    }
  } catch (err) {
    console.error('Error reading store.json, reinitializing', err);
  }
  return { rooms: {} };
}

function writeStore(data: StoreData): void {
  try {
    const tempPath = `${storePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, storePath);
  } catch (err) {
    console.error('Error writing store.json', err);
  }
}

export function ensureRoom(roomId: string, user1Name = '我', user2Name = 'TA'): RoomState {
  const store = readStore();
  let room = store.rooms[roomId];
  if (!room) {
    room = {
      roomId,
      user1Name,
      user2Name,
      weeklyBusy: {
        user1: {},
        user2: {},
      },
      dateBusy: {},
      restaurants: [],
      updatedAt: Date.now(),
    };
    store.rooms[roomId] = room;
    writeStore(store);
  } else {
    // Ensure new fields exist for migration
    if (!room.weeklyBusy) {
      room.weeklyBusy = { user1: {}, user2: {} };
    }
    if (!room.dateBusy) {
      room.dateBusy = {};
    }
  }
  return room;
}

export function getRoomState(roomId: string): RoomState {
  return ensureRoom(roomId);
}

export function updateRoomUsers(roomId: string, user1Name: string, user2Name: string): RoomState {
  const store = readStore();
  const room = store.rooms[roomId] || ensureRoom(roomId);
  room.user1Name = user1Name || room.user1Name;
  room.user2Name = user2Name || room.user2Name;
  room.updatedAt = Date.now();
  store.rooms[roomId] = room;
  writeStore(store);
  return room;
}

export function setBusyStatus(
  roomId: string,
  userRole: 'user1' | 'user2',
  date: string,
  slotType: string,
  weekday: number,
  busyType: BusyType,
  reason?: string
): RoomState {
  const store = readStore();
  const room = store.rooms[roomId] || ensureRoom(roomId);

  const record: BusyRecord = {
    type: busyType,
    reason: reason?.trim() || undefined,
  };

  if (busyType === 'weekly') {
    const weeklyKey = `weekday_${weekday}_${slotType}`;
    room.weeklyBusy[userRole][weeklyKey] = record;
  } else {
    // this_week or temp
    const dateKey = `${date}_${slotType}`;
    if (!room.dateBusy[dateKey]) {
      room.dateBusy[dateKey] = {};
    }
    room.dateBusy[dateKey][userRole] = record;
  }

  room.updatedAt = Date.now();
  store.rooms[roomId] = room;
  writeStore(store);
  return room;
}

export function clearBusyStatus(
  roomId: string,
  userRole: 'user1' | 'user2',
  date: string,
  slotType: string,
  weekday?: number,
  clearWeekly = false
): RoomState {
  const store = readStore();
  const room = store.rooms[roomId] || ensureRoom(roomId);

  const dateKey = `${date}_${slotType}`;
  if (room.dateBusy[dateKey]) {
    delete room.dateBusy[dateKey][userRole];
    if (Object.keys(room.dateBusy[dateKey]).length === 0) {
      delete room.dateBusy[dateKey];
    }
  }

  if (clearWeekly && weekday !== undefined) {
    const weeklyKey = `weekday_${weekday}_${slotType}`;
    delete room.weeklyBusy[userRole][weeklyKey];
  }

  room.updatedAt = Date.now();
  store.rooms[roomId] = room;
  writeStore(store);
  return room;
}

export function saveRestaurant(
  restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'status' | 'orderIndex'> & { id?: string }
): Restaurant {
  const store = readStore();
  const room = store.rooms[restaurant.roomId] || ensureRoom(restaurant.roomId);

  const now = Date.now();
  const id = restaurant.id || `rest_${Math.random().toString(36).substring(2, 9)}`;

  const maxOrder = room.restaurants.reduce((max, r) => Math.max(max, r.orderIndex || 0), 0);

  const newRestaurant: Restaurant = {
    id,
    roomId: restaurant.roomId,
    name: restaurant.name,
    category: restaurant.category || '其他',
    priority: Number(restaurant.priority) || 2,
    preferredSlotType: restaurant.preferredSlotType || 'any',
    notes: restaurant.notes || '',
    status: 'pending',
    createdAt: now,
    orderIndex: maxOrder + 1,
  };

  room.restaurants.push(newRestaurant);
  room.updatedAt = now;
  store.rooms[restaurant.roomId] = room;
  writeStore(store);

  return newRestaurant;
}

export function deleteRestaurant(roomId: string, restaurantId: string): void {
  const store = readStore();
  const room = store.rooms[roomId];
  if (!room) return;

  room.restaurants = room.restaurants.filter(r => r.id !== restaurantId);
  room.updatedAt = Date.now();
  store.rooms[roomId] = room;
  writeStore(store);
}

export function scheduleRestaurant(
  roomId: string,
  restaurantId: string,
  date: string,
  slotType: string,
  slotLabel: string
): void {
  const store = readStore();
  const room = store.rooms[roomId];
  if (!room) return;

  const target = room.restaurants.find(r => r.id === restaurantId);
  if (target) {
    target.status = 'scheduled';
    target.scheduledDate = date;
    target.scheduledSlotType = slotType as any;
    target.scheduledSlotLabel = slotLabel;
    room.updatedAt = Date.now();
    store.rooms[roomId] = room;
    writeStore(store);
  }
}

export function skipRestaurant(roomId: string, restaurantId: string): void {
  const store = readStore();
  const room = store.rooms[roomId];
  if (!room) return;

  const target = room.restaurants.find(r => r.id === restaurantId);
  if (target) {
    target.status = 'skipped';
    room.updatedAt = Date.now();
    store.rooms[roomId] = room;
    writeStore(store);
  }
}

export function unscheduleRestaurant(roomId: string, restaurantId: string): void {
  const store = readStore();
  const room = store.rooms[roomId];
  if (!room) return;

  const target = room.restaurants.find(r => r.id === restaurantId);
  if (target) {
    target.status = 'pending';
    target.scheduledDate = undefined;
    target.scheduledSlotType = undefined;
    target.scheduledSlotLabel = undefined;
    room.updatedAt = Date.now();
    store.rooms[roomId] = room;
    writeStore(store);
  }
}

export function resetAllSchedules(roomId: string): void {
  const store = readStore();
  const room = store.rooms[roomId];
  if (!room) return;

  for (const r of room.restaurants) {
    r.status = 'pending';
    r.scheduledDate = undefined;
    r.scheduledSlotType = undefined;
    r.scheduledSlotLabel = undefined;
  }
  room.updatedAt = Date.now();
  store.rooms[roomId] = room;
  writeStore(store);
}
