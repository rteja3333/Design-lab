import { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, GeoPoint, setDoc, getDoc, increment } from 'firebase/firestore';
import { firebaseDb, firebaseAuth } from './firebase';
import { locationService } from './location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = firebaseDb || getFirestore();
const auth = firebaseAuth;

// Database Schema Design:
// 
// COLLECTIONS:
// 1. users - User profiles and settings
// 2. reports - User-generated reports  
// 3. requests - Admin-generated location requests
// 4. categories - Report categories with instructions
// 5. notifications - Push notifications log
//
// USERS SCHEMA:
// {
//   uid: string,
//   phoneNumber: string,
//   displayName: string,
//   profileImage: string,
//   location: GeoPoint,
//   createdAt: timestamp,
//   totalReports: number,
//   reputation: number
// }
//
// REPORTS SCHEMA:
// {
//   id: string,
//   userId: string,
//   title: string,
//   description: string,
//   category: string,
//   tags: string[],
//   images: string[], // Firebase Storage URLs
//   videos: string[], // Firebase Storage URLs
//   location: GeoPoint,
//   address: string,
//   status: 'pending' | 'approved' | 'rejected',
//   createdAt: timestamp,
//   requestId?: string // If fulfilling an admin request
// }
//
// REQUESTS SCHEMA:
// {
//   id: string,
//   adminId: string,
//   title: string,
//   description: string,
//   category: string,
//   tags: string[],
//   location: GeoPoint,
//   radius: number, // in meters
//   status: 'active' | 'closed' | 'expired',
//   targetCount: number,
//   currentCount: number,
//   createdAt: timestamp,
//   expiresAt: timestamp,
//   instructions: string
// }

// USER OPERATIONS
export const userService = {
  // Create user profile
  async createUser(userData) {
    try {
      const userRef = doc(db, 'users', userData.uid);
      await setDoc(userRef, {
        ...userData,
        email: userData.email || '',
        city: userData.city || '',
        state: userData.state || '',
        bio: userData.bio || '',
        createdAt: serverTimestamp(),
        totalReports: 0,
        reputation: 0
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user profile
  async getUser(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      if (error?.message?.toLowerCase()?.includes('offline')) {
        console.warn('User profile fetch skipped: client offline');
      } else {
        console.error('Error getting user:', error);
      }
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateUser(uid, updateData) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }
};

// REPORT OPERATIONS
export const reportService = {
  // Create new report
  async createReport(reportData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const withTimeout = (promise, timeoutMs = 30000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Check internet and try again.')), timeoutMs)
          ),
        ]);
      };

      const report = {
        ...reportData,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await withTimeout(addDoc(collection(db, 'reports'), report));
      
      // Update user's report count
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          totalReports: increment(1),
        },
        { merge: true }
      );

      // Increment request's currentCount if report is linked to a request
      if (reportData.requestId) {
        const requestRef = doc(db, 'requests', reportData.requestId);
        await updateDoc(requestRef, {
          currentCount: increment(1),
        });
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating report:', error);
      const errorCode = error?.code || '';
      const errorMessage = (error?.message || '').toLowerCase();

      if (errorCode === 'permission-denied') {
        return {
          success: false,
          error: 'Firestore rules blocked write access. Update your Firestore rules to allow authenticated users to create reports.',
        };
      }

      const isNetworkIssue =
        errorMessage.includes('offline') ||
        errorCode.includes('unavailable') ||
        errorCode.includes('failed-precondition');

      if (errorMessage.includes('timed out')) {
        return {
          success: false,
          error: 'Request timed out while connecting to Firestore. Please check internet and Firebase project setup, then try again.',
        };
      }

      if (isNetworkIssue) {
        try {
          const user = auth.currentUser;
          const queuedReport = {
            ...reportData,
            userId: user?.uid || null,
            status: 'queued',
            createdAtLocal: new Date().toISOString(),
            localId: `local-${Date.now()}`,
          };

          const existing = await AsyncStorage.getItem('pending_reports');
          const pendingReports = existing ? JSON.parse(existing) : [];
          pendingReports.push(queuedReport);
          await AsyncStorage.setItem('pending_reports', JSON.stringify(pendingReports));

          return {
            success: true,
            queued: true,
            id: queuedReport.localId,
            message: 'Saved offline. Will sync when network is available.',
          };
        } catch (queueError) {
          return { success: false, error: queueError.message || error.message };
        }
      }

      return { success: false, error: error.message };
    }
  },

  // Get user's reports
  async getUserReports(uid) {
    try {
      const q = query(
        collection(db, 'reports'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Also include any locally queued/offline reports saved in AsyncStorage
      try {
        const existing = await AsyncStorage.getItem('pending_reports');
        const pending = existing ? JSON.parse(existing) : [];
        const userPending = pending
          .filter(r => r.userId === uid || (!r.userId && uid))
          .map(r => {
            // Normalize local queued report to match Firestore shape
            const createdAtSecs = r.createdAtLocal
              ? Math.floor(new Date(r.createdAtLocal).getTime() / 1000)
              : Math.floor(Date.now() / 1000);
            return {
              id: r.localId || `local-${createdAtSecs}`,
              ...r,
              createdAt: { seconds: createdAtSecs },
            };
          });

        const combined = [...userPending, ...reports];
        // Sort combined list by createdAt seconds desc (handles both local and server timestamps)
        combined.sort((a, b) => {
          const aSec = a.createdAt?.seconds || 0;
          const bSec = b.createdAt?.seconds || 0;
          return bSec - aSec;
        });

        return { success: true, data: combined };
      } catch (localErr) {
        // If reading local queued reports fails, fall back to Firestore-only results
        console.warn('Failed reading pending_reports from AsyncStorage:', localErr);
        return { success: true, data: reports };
      }
    } catch (error) {
      console.error('Error getting user reports:', error);
      return { success: false, error: error.message };
    }
  },

  // Get reports by location
  async getReportsByLocation(location, radius = 1000) {
    try {
      // Note: For production, you'd want to use Firestore's geohash queries
      // For now, we'll fetch all and filter (not efficient for large datasets)
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: reports };
    } catch (error) {
      console.error('Error getting reports by location:', error);
      return { success: false, error: error.message };
    }
  },

  // Get reports linked to a specific request
  async getReportsByRequestId(requestId) {
    try {
      const q = query(
        collection(db, 'reports'),
        where('requestId', '==', requestId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: reports };
    } catch (error) {
      console.error('Error getting request reports:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin review action for a report tied to requests
  async reviewReport(reportId, reviewData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: reviewData.status,
        adminFeedback: reviewData.feedback || '',
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error reviewing report:', error);
      return { success: false, error: error.message };
    }
  }
};

// REQUEST OPERATIONS
export const requestService = {
  // Create admin request
  async createRequest(requestData) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const request = {
        ...requestData,
        adminId: user.uid,
        status: 'active',
        currentCount: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'requests'), request);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating request:', error);
      return { success: false, error: error.message };
    }
  },

  // Get active requests for location
  async getActiveRequests(userLocation, radius = 5000) {
    try {
      const q = query(
        collection(db, 'requests'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const now = Date.now();
      const filtered = requests.filter((request) => {
        const expiresAtMs = request.expiresAt?.seconds
          ? request.expiresAt.seconds * 1000
          : request.expiresAt?.toDate
            ? request.expiresAt.toDate().getTime()
            : request.expiresAt
              ? new Date(request.expiresAt).getTime()
              : null;

        if (expiresAtMs && expiresAtMs < now) {
          return false;
        }

        if (!userLocation || !request.location) {
          return true;
        }

        const distance = locationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          request.location.latitude,
          request.location.longitude
        );

        return distance <= (request.radius || radius);
      });

      return { success: true, data: filtered };
    } catch (error) {
      console.error('Error getting active requests:', error);
      return { success: false, error: error.message };
    }
  },

  // Update request status
  async updateRequestStatus(requestId, status) {
    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, { status });
      return { success: true };
    } catch (error) {
      console.error('Error updating request status:', error);
      return { success: false, error: error.message };
    }
  },

  // Get requests created by specific admin user
  async getRequestsByAdmin(adminId) {
    try {
      const q = query(
        collection(db, 'requests'),
        where('adminId', '==', adminId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: requests };
    } catch (error) {
      console.error('Error getting admin requests:', error);
      return { success: false, error: error.message };
    }
  }
};

// CATEGORY OPERATIONS
export const categoryService = {
  // Get all categories
  async getCategories() {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: false, error: error.message };
    }
  }
};