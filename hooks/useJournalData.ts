import { useState, useEffect } from 'react';
import { journalService, JournalEntry } from '@/services/journalService';

/**
 * Hook for working with journal entries
 */
export function useJournalData() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load journal data
  const loadData = async () => {
    setLoading(true);
    try {
      // Get entries
      const journalEntries = await journalService.getAllEntries();
      setEntries(journalEntries);
      
      // Get tags
      const journalTags = await journalService.getAllTags();
      setTags(journalTags);
      
      // Get insights (optional on initial load)
      if (journalEntries.length >= 3) {
        loadInsights();
      }
    } catch (error) {
      console.error('Failed to load journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load insights specifically
  const loadInsights = async () => {
    try {
      const journalInsights = await journalService.getJournalInsights();
      setInsights(journalInsights);
    } catch (error) {
      console.error('Failed to load journal insights:', error);
    }
  };

  // Create a new journal entry
  const createEntry = async (entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    setLoading(true);
    try {
      const newEntry = await journalService.createEntry(entryData);
      
      // Update local state
      setEntries(prevEntries => [newEntry, ...prevEntries]);
      
      // Update tags if new ones were added
      if (entryData.tags && entryData.tags.length > 0) {
        const updatedTags = await journalService.getAllTags();
        setTags(updatedTags);
      }
      
      return newEntry;
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing journal entry
  const updateEntry = async (entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry> => {
    setLoading(true);
    try {
      const updatedEntry = await journalService.updateEntry(entryId, updates);
      
      // Update local state
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId ? updatedEntry : entry
        )
      );
      
      // Update tags if they changed
      if (updates.tags) {
        const updatedTags = await journalService.getAllTags();
        setTags(updatedTags);
      }
      
      return updatedEntry;
    } catch (error) {
      console.error(`Failed to update journal entry ${entryId}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a journal entry
  const deleteEntry = async (entryId: string): Promise<void> => {
    setLoading(true);
    try {
      await journalService.deleteEntry(entryId);
      
      // Update local state
      setEntries(prevEntries => 
        prevEntries.filter(entry => entry.id !== entryId)
      );
      
      // Update tags
      const updatedTags = await journalService.getAllTags();
      setTags(updatedTags);
    } catch (error) {
      console.error(`Failed to delete journal entry ${entryId}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get AI reflection on a specific entry
  const getEntryReflection = async (entryId: string): Promise<string> => {
    setLoading(true);
    try {
      return await journalService.getEntryReflection(entryId);
    } catch (error) {
      console.error(`Failed to get reflection for entry ${entryId}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Search for entries
  const searchEntries = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setLoading(true);
    try {
      const results = await journalService.searchEntries(query);
      setSearchResults(results);
    } catch (error) {
      console.error(`Failed to search entries with query "${query}":`, error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const clearSearch = (): void => {
    setSearchResults([]);
    setIsSearching(false);
  };

  // Get entries by tag
  const getEntriesByTag = async (tag: string): Promise<JournalEntry[]> => {
    setLoading(true);
    try {
      const taggedEntries = await journalService.getEntriesByTag(tag);
      return taggedEntries;
    } catch (error) {
      console.error(`Failed to get entries by tag ${tag}:`, error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  return {
    entries,
    tags,
    insights,
    loading,
    searchResults,
    isSearching,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntryReflection,
    searchEntries,
    clearSearch,
    getEntriesByTag,
    refreshData,
    loadInsights
  };
}