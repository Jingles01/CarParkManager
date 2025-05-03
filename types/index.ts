import { Timestamp } from "firebase/firestore";
import { UserRole } from "@/context/AuthContext";

export interface VehicleData {
  customerId: string;
  make: string;
    model: string;
    color: string;
    licensePlate: string;
    expectedCheckOutTime: Timestamp;
    parkingSpotId: string;
    parkingSpotLabel?: string;
    valetId: string;
    photos?: string[];
    checkInTime: Timestamp;
    actualCheckOutTime: Timestamp | null;
    status: 'checked-in' | 'checked-out' | 'lost-ticket' | string;
    id?: string;
  }

  export interface ParkingSpotData {
    id?: string;
    label: string;
    status: 'available' | 'occupied' | 'reserved' | 'unavailable' | string;
    lotId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    internalId?: string;
    currentVehicleId?: string | null;
    notes?: string;
}

export interface UserProfile {
  id?: string,
  uid: string;
  role: UserRole;
  name: string;
  phoneNumber: string;
  email: string;
  createdAt?: Timestamp;
}

export interface CustomerData {
  id?: string;
  name: string;
  phoneNumber: string;
  email: string;
  name_lowercase?: string;
  createdAt?: Timestamp;
}

export interface UserCreationPayload {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phoneNumber: string;
}