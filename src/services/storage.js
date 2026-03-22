import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firebaseAuth } from './firebase';

const storage = getStorage();
const auth = firebaseAuth;

export const storageService = {
  // Upload image or video file
  async uploadMedia(uri, type = 'image', folder = 'reports') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Create unique filename
      const timestamp = Date.now();
      const extension = uri.split('.').pop();
      const filename = `${folder}/${user.uid}/${timestamp}.${extension}`;
      
      // Convert URI to blob for web compatibility
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create storage reference
      const storageRef = ref(storage, filename);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { 
        success: true, 
        url: downloadURL,
        path: filename,
        size: blob.size,
        type
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload multiple media files
  async uploadMultipleMedia(uris, type = 'image', folder = 'reports') {
    try {
      const uploadPromises = uris.map(uri => this.uploadMedia(uri, type, folder));
      const results = await Promise.all(uploadPromises);
      
      // Check if any uploads failed
      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        return { 
          success: false, 
          error: `${failedUploads.length} uploads failed`,
          results 
        };
      }
      
      return { 
        success: true, 
        urls: results.map(result => result.url),
        paths: results.map(result => result.path)
      };
    } catch (error) {
      console.error('Error uploading multiple media:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete media file
  async deleteMedia(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting media:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete multiple media files
  async deleteMultipleMedia(paths) {
    try {
      const deletePromises = paths.map(path => this.deleteMedia(path));
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('Error deleting multiple media:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload profile image
  async uploadProfileImage(uri) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const result = await this.uploadMedia(uri, 'image', 'profiles');
      
      if (result.success) {
        // Update user profile with new image URL
        // This would be handled by the calling component
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return { success: false, error: error.message };
    }
  }
};