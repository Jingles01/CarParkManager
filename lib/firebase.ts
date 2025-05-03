import { initializeApp} from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc,  
  getDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { VehicleData, ParkingSpotData, UserProfile } from '@/types';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};


  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export const storage = getStorage(app);

  export const usersCollection = collection(db, 'users');
  export const customersCollection = collection(db, 'customers');
  export const vehiclesCollection = collection(db, 'vehicles');
  export const parkingSpotsCollection = collection(db, 'parkingSpots');
  export const parkingLotsCollection = collection(db, 'parkingLots');
  export const transactionsCollection = collection(db, 'transactions');

  export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) {
        console.error("getUserProfile called with no userId");
        return null;
    }

    const userDocRef = doc(usersCollection, userId);
    console.log(`getUserProfile: Fetching doc /users/${userId}`);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log(`getUserProfile: Data found for ${userId}`, data);
            const profileData: UserProfile = {
                uid: data.uid || userId,
                role: data.role || null,
                name: data.name || '',
                phoneNumber: data.phoneNumber || '',
                email: data.email || '',
                createdAt: data.createdAt || undefined
            };
            return profileData;
        } else {
            console.log(`getUserProfile: No profile document found for userId: ${userId}`);
            return null;
        }
     } catch (error) {
         console.log(`getUserProfile: Error fetching profile for ${userId}:`, error);
         return null;
     }
};
  
  export const getVehiclesByCustomer = (customerId: string) => {
    return query(vehiclesCollection, where('customerId', '==', customerId));
  };
  
  export const getActiveVehicles = () => {
    return query(
      vehiclesCollection, 
      where('status', '==', 'checked-in'), 
      orderBy('checkInTime', 'desc')
    );
  };
  
  export const getAvailableParkingSpots = (lotId: string = 'lot1') => {
    return query(
      parkingSpotsCollection,
      where('status', '==', 'available'),
      where('lotId', '==', lotId)
    );
  };
  
  export const getVehicleByLicensePlate = (licensePlate: string) => {
    return query(
      vehiclesCollection,
      where('licensePlate', '==', licensePlate),
      where('status', '==', 'checked-in'),
      limit(1)
    );
  };

  export const addCustomer = async ( data: {
    name: string;
    phoneNumber: string;
    email: string;
  }) => {
    try {
      const docData = {
        ...data,
        name_lowercase: data.name.toLowerCase(),
        createdAt: Timestamp.now()
      };
      const docRef = await addDoc(customersCollection, docData);
      console.log("Customer added with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding customer: ", error);
      return null;
    }
  };

  export const addVehicle = async (
    data: Omit<VehicleData, 'checkInTime' | 'actualCheckOutTime' | 'status' | 'parkingSpotLabel'> & { parkingSpotId: string }
): Promise<string | null> => {
    const spotDocRef = doc(parkingSpotsCollection, data.parkingSpotId);

    try {
        console.log(`addVehicle: Fetching spot data for ${data.parkingSpotId}`);
        const spotSnap = await getDoc(spotDocRef);
        let spotLabel = data.parkingSpotId;

        if (spotSnap.exists()) {
            const spotData = spotSnap.data() as Partial<ParkingSpotData>;
            spotLabel = spotData.label || data.parkingSpotId;
            console.log(`addVehicle: Found spot label: ${spotLabel}`);
            
        } else {
             console.warn(`addVehicle: Spot document ${data.parkingSpotId} not found! Using ID as label.`);

        }
        const vehicleData: VehicleData = {
            ...data,
            parkingSpotLabel: spotLabel,
            checkInTime: Timestamp.now(),
            actualCheckOutTime: null,
            status: 'checked-in'
        };

        console.log("addVehicle: Adding vehicle document:", vehicleData);
        const docRef = await addDoc(vehiclesCollection, vehicleData);
        console.log(`addVehicle: Vehicle added successfully with ID: ${docRef.id}`);

      
        console.log(`addVehicle: Updating spot ${data.parkingSpotId} status to occupied`);
        await updateDoc(spotDocRef, { status: 'occupied' });


        return docRef.id;

    } catch (error) {
        console.error("Error during addVehicle process: ", error);
        return null;
    }
};

export const checkOutVehicle = async (vehicleId: string, parkingSpotId: string): Promise<void> => {
    const vehicleDocRef = doc(vehiclesCollection, vehicleId);
    const spotDocRef = doc(parkingSpotsCollection, parkingSpotId);

    console.log(`check out vehicle ${vehicleId} from spot ${parkingSpotId}`);

    try {
        await runTransaction(db, async (transaction) => {

          transaction.update(vehicleDocRef, {
            status: 'checked-out',
            actualCheckOutTime: Timestamp.now()
          } as Partial<VehicleData>);

            transaction.update(spotDocRef, {
              status: 'available',
              currentVehicleId: null
            } as Partial<ParkingSpotData>);
        });
        console.log(`Transaction successful: Vehicle ${vehicleId} checked out, Spot ${parkingSpotId} available.`);

    } catch (error) {
        console.error(`Transaction failed for checking out vehicle ${vehicleId}: `, error);
        throw new Error('Failed to check out vehicle.');
    }
};