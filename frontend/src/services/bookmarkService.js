import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Get all bookmarks
export const getBookmarks = async () => {
  try {
    const response = await axios.get(API_ENDPOINTS.BOOKMARKS);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
};

// Add a bookmark
export const addBookmark = async (bookmarkData) => {
  try {
    const response = await axios.post(API_ENDPOINTS.BOOKMARKS, bookmarkData);
    return response.data;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

// Remove a bookmark by URL
export const removeBookmark = async (url) => {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await axios.delete(`${API_ENDPOINTS.BOOKMARKS}/url/${encodedUrl}`);
    return response.data;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

// Check if article is bookmarked
export const checkBookmark = async (url) => {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await axios.get(`${API_ENDPOINTS.BOOKMARKS}/check/${encodedUrl}`);
    return response.data;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    throw error;
  }
};

// Get bookmarks by company
export const getBookmarksByCompany = async (company) => {
  try {
    const encodedCompany = encodeURIComponent(company);
    const response = await axios.get(`${API_ENDPOINTS.BOOKMARKS}/company/${encodedCompany}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company bookmarks:', error);
    throw error;
  }
};

// Clear all bookmarks
export const clearAllBookmarks = async () => {
  try {
    const response = await axios.delete(`${API_ENDPOINTS.BOOKMARKS}/clear`);
    return response.data;
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
    throw error;
  }
};
