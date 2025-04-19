import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Data & hooks
import { useJournalData } from '@/hooks/useJournalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { JournalEntry } from '@/services/journalService';

// Константы для дизайн-системы
const COLORS = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    text: '#1A1A1A',
    secondaryText: '#6E6E6E',
    primary: '#E53935',
    success: '#4CAF50',
    warning: '#FF9800',
    neutral: '#607D8B',
    separator: '#E0E0E0',
    tag: 'rgba(229, 57, 53, 0.1)',
    tagText: '#E53935',
    searchBackground: '#EEEEEE',
  },
  dark: {
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#F5F5F5',
    secondaryText: '#AAAAAA',
    primary: '#FF5252',
    success: '#66BB6A',
    warning: '#FFA726',
    neutral: '#78909C',
    separator: '#333333',
    tag: 'rgba(255, 82, 82, 0.2)',
    tagText: '#FF5252',
    searchBackground: '#2C2C2C',
  },
};

// Base Card component
const Card = ({ children, style }: { children: React.ReactNode, style?: any }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.cardBackground },
      style
    ]}>
      {children}
    </View>
  );
};

// Journal entry card component
const JournalEntryCard = ({ 
  entry, 
  onPress, 
  onLongPress 
}: { 
  entry: JournalEntry, 
  onPress: () => void,
  onLongPress: () => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  // Get sentiment color
  const getSentimentColor = () => {
    if (!entry.aiAnalysis?.sentiment) return colors.neutral;
    
    const sentiment = entry.aiAnalysis.sentiment;
    if (sentiment > 0.3) return colors.success;
    if (sentiment < -0.3) return colors.primary;
    return colors.neutral;
  };
  
  return (
    <TouchableOpacity
      style={[styles.entryCard, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.entryHeader}>
        <Text style={[styles.entryTitle, { color: colors.text }]} numberOfLines={1}>
          {entry.title}
        </Text>
        <View style={[styles.sentimentIndicator, { backgroundColor: getSentimentColor() }]} />
      </View>
      
      <Text style={[styles.entryContent, { color: colors.secondaryText }]} numberOfLines={3}>
        {entry.content}
      </Text>
      
      <View style={styles.entryFooter}>
        <Text style={[styles.entryDate, { color: colors.secondaryText }]}>
          {formatDate(entry.timestamp)}
        </Text>
        
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {entry.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.tag }]}>
                <Text style={[styles.tagText, { color: colors.tagText }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {entry.tags.length > 2 && (
              <Text style={[styles.moreTagsText, { color: colors.secondaryText }]}>
                +{entry.tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Tag selector component
const TagSelector = ({ 
  tags, 
  selectedTag, 
  onSelectTag 
}: { 
  tags: string[], 
  selectedTag: string | null, 
  onSelectTag: (tag: string | null) => void 
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tagSelectorContainer}
    >
      <TouchableOpacity
        style={[
          styles.tagSelectorItem,
          !selectedTag && [
            styles.tagSelectorItemActive,
            { backgroundColor: colors.primary }
          ]
        ]}
        onPress={() => onSelectTag(null)}
      >
        <Text 
          style={[
            styles.tagSelectorText,
            { color: !selectedTag ? '#FFFFFF' : colors.secondaryText }
          ]}
        >
          Все
        </Text>
      </TouchableOpacity>
      
      {tags.map((tag, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tagSelectorItem,
            selectedTag === tag && [
              styles.tagSelectorItemActive,
              { backgroundColor: colors.primary }
            ]
          ]}
          onPress={() => onSelectTag(tag)}
        >
          <Text 
            style={[
              styles.tagSelectorText,
              { color: selectedTag === tag ? '#FFFFFF' : colors.secondaryText }
            ]}
          >
            {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Insights component
const InsightsCard = ({ 
  insights,
  onRefresh
}: { 
  insights: string[], 
  onRefresh: () => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <Card style={styles.insightsCard}>
      <View style={styles.insightsHeader}>
        <Text style={[styles.insightsTitle, { color: colors.text }]}>
          Инсайты из ваших записей
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {insights.length > 0 ? (
        <View style={styles.insightsList}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Ionicons name="bulb-outline" size={18} color={colors.primary} />
              <Text style={[styles.insightText, { color: colors.secondaryText }]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyInsightsText, { color: colors.secondaryText }]}>
          Добавьте больше записей в дневник для получения инсайтов.
        </Text>
      )}
    </Card>
  );
};

// Entry editor modal
const EntryEditorModal = ({
  visible,
  onClose,
  initialEntry,
  onSave
}: {
  visible: boolean,
  onClose: () => void,
  initialEntry?: Partial<JournalEntry>,
  onSave: (entry: Partial<JournalEntry>) => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [mood, setMood] = useState<number | undefined>(initialEntry?.mood);
  
  // Reset form when initialEntry changes
  useEffect(() => {
    setTitle(initialEntry?.title || '');
    setContent(initialEntry?.content || '');
    setTags(initialEntry?.tags || []);
    setMood(initialEntry?.mood);
  }, [initialEntry]);
  
  // Add a tag to the list
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Remove a tag from the list
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  // Handle save and close
  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Ошибка', 'Заголовок и содержание не могут быть пустыми');
      return;
    }
    
    onSave({
      id: initialEntry?.id,
      title,
      content,
      tags,
      mood
    });
    
    onClose();
  };
  
  // Render mood selector
  const renderMoodSelector = () => {
    const moods = [
      { value: 1, icon: '😞', label: 'Очень плохо' },
      { value: 3, icon: '😔', label: 'Плохо' },
      { value: 5, icon: '😐', label: 'Нейтрально' },
      { value: 7, icon: '🙂', label: 'Хорошо' },
      { value: 10, icon: '😄', label: 'Отлично' },
    ];
    
    return (
      <View style={styles.moodSelector}>
        <Text style={[styles.moodSelectorLabel, { color: colors.text }]}>
          Настроение:
        </Text>
        <View style={styles.moodSelectorButtons}>
          {moods.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.moodButton,
                mood === item.value && {
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}20`
                }
              ]}
              onPress={() => setMood(item.value)}
            >
              <Text style={styles.moodButtonText}>{item.icon}</Text>
              <Text style={[styles.moodButtonLabel, { color: colors.secondaryText }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {initialEntry?.id ? 'Редактировать запись' : 'Новая запись'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveButton, { color: colors.primary }]}>Сохранить</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.separator }]}
            placeholder="Заголовок"
            placeholderTextColor={colors.secondaryText}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <TextInput
            style={[styles.contentInput, { color: colors.text }]}
            placeholder="Что у вас на уме?"
            placeholderTextColor={colors.secondaryText}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          
          {renderMoodSelector()}
          
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsSectionTitle, { color: colors.text }]}>
              Теги:
            </Text>
            
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.tagInput, { 
                  color: colors.text, 
                  backgroundColor: colors.searchBackground
                }]}
                placeholder="Добавить тег..."
                placeholderTextColor={colors.secondaryText}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity 
                style={[styles.addTagButton, { backgroundColor: colors.primary }]}
                onPress={addTag}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {tags.length > 0 && (
              <View style={styles.selectedTags}>
                {tags.map((tag, index) => (
                  <View key={index} style={[styles.selectedTag, { backgroundColor: colors.tag }]}>
                    <Text style={[styles.selectedTagText, { color: colors.tagText }]}>
                      {tag}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => removeTag(index)}
                      style={styles.removeTagButton}
                    >
                      <Ionicons name="close-circle" size={16} color={colors.tagText} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Entry viewer modal with AI reflection
const EntryViewerModal = ({
  visible,
  onClose,
  entry,
  reflection,
  loadingReflection,
  onEdit,
  onDelete
}: {
  visible: boolean,
  onClose: () => void,
  entry: JournalEntry | null,
  reflection: string | null,
  loadingReflection: boolean,
  onEdit: () => void,
  onDelete: () => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const [showReflection, setShowReflection] = useState(false);
  
  // Reset state when entry changes
  useEffect(() => {
    setShowReflection(false);
  }, [entry]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get mood emoji
  const getMoodEmoji = (moodValue?: number) => {
    if (!moodValue) return '';
    
    if (moodValue <= 2) return '😞';
    if (moodValue <= 4) return '😔';
    if (moodValue <= 6) return '😐';
    if (moodValue <= 8) return '🙂';
    return '😄';
  };
  
  if (!entry) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.secondaryText} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
            {entry.title}
          </Text>
          <View style={styles.entryViewerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={onEdit}>
              <Ionicons name="create-outline" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={onDelete}>
              <Ionicons name="trash-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.entryMetadata}>
            <Text style={[styles.entryDateTime, { color: colors.secondaryText }]}>
              {formatDate(entry.timestamp)}
            </Text>
            {entry.mood && (
              <View style={styles.entryMood}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                <Text style={[styles.moodValue, { color: colors.secondaryText }]}>
                  {entry.mood}/10
                </Text>
              </View>
            )}
          </View>
          
          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.entryTagsContainer}>
              {entry.tags.map((tag, index) => (
                <View key={index} style={[styles.entryTag, { backgroundColor: colors.tag }]}>
                  <Text style={[styles.entryTagText, { color: colors.tagText }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          <Text style={[styles.entryContentFull, { color: colors.text }]}>
            {entry.content}
          </Text>
          
          {entry.aiAnalysis && (
            <View style={[styles.analysisSection, { borderTopColor: colors.separator }]}>
              <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                Анализ
              </Text>
              
              {entry.aiAnalysis.insights && entry.aiAnalysis.insights.length > 0 && (
                <View style={styles.insightsSection}>
                  <Text style={[styles.insightsSectionTitle, { color: colors.secondaryText }]}>
                    Ключевые инсайты:
                  </Text>
                  {entry.aiAnalysis.insights.map((insight, index) => (
                    <View key={index} style={styles.entryInsightItem}>
                      <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                      <Text style={[styles.entryInsightText, { color: colors.text }]}>
                        {insight}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {entry.aiAnalysis.keywords && entry.aiAnalysis.keywords.length > 0 && (
                <View style={styles.keywordsSection}>
                  <Text style={[styles.keywordsSectionTitle, { color: colors.secondaryText }]}>
                    Ключевые слова:
                  </Text>
                  <View style={styles.keywordsContainer}>
                    {entry.aiAnalysis.keywords.map((keyword, index) => (
                      <View key={index} style={[styles.keywordChip, { backgroundColor: `${colors.primary}15` }]}>
                        <Text style={[styles.keywordChipText, { color: colors.primary }]}>
                          {keyword}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
          
          <View style={[styles.reflectionSection, { borderTopColor: colors.separator }]}>
            <TouchableOpacity 
              style={styles.reflectionToggle}
              onPress={() => setShowReflection(!showReflection)}
            >
              <Text style={[styles.reflectionToggleText, { color: colors.text }]}>
                {showReflection ? 'Скрыть рефлексию' : 'Показать AI-рефлексию'}
              </Text>
              <Ionicons 
                name={showReflection ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.secondaryText} 
              />
            </TouchableOpacity>
            
            {showReflection && (
              <View style={styles.reflectionContent}>
                {loadingReflection ? (
                  <ActivityIndicator color={colors.primary} style={styles.reflectionLoader} />
                ) : reflection ? (
                  <Text style={[styles.reflectionText, { color: colors.text }]}>
                    {reflection}
                  </Text>
                ) : (
                  <Text style={[styles.noReflectionText, { color: colors.secondaryText }]}>
                    Не удалось загрузить рефлексию.
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Main Journal Screen
export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Journal data hook
  const { 
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
  } = useJournalData();
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  
  // Filter entries by tag and search
  useEffect(() => {
    filterEntries();
  }, [entries, selectedTag, searchResults, isSearching]);
  
  // Filter entries based on selected tag and search
  const filterEntries = async () => {
    if (isSearching) {
      setFilteredEntries(searchResults);
      return;
    }
    
    if (selectedTag) {
      const taggedEntries = await getEntriesByTag(selectedTag);
      setFilteredEntries(taggedEntries);
    } else {
      setFilteredEntries(entries);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };
  
  // Handle tag selection
  const handleSelectTag = (tag: string | null) => {
    setSelectedTag(tag);
    // Clear search if tag is selected
    if (tag) {
      setSearchQuery('');
      clearSearch();
    }
  };
  
  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      searchEntries(text);
    } else {
      clearSearch();
    }
  };
  
  // Open entry editor for new entry
  const openNewEntryEditor = () => {
    setCurrentEntry(null);
    setEditorVisible(true);
  };
  
  // Open entry editor for existing entry
  const openEditEntryEditor = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setViewerVisible(false);
    setEditorVisible(true);
  };
  
  // Save entry (create or update)
  const saveEntry = async (entryData: Partial<JournalEntry>) => {
    if (entryData.id) {
      await updateEntry(entryData.id, entryData);
    } else {
      await createEntry(entryData);
    }
  };
  
  // Open entry viewer
  const openEntryViewer = async (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setReflection(null);
    setViewerVisible(true);
    
    // Load reflection
    setLoadingReflection(true);
    try {
      const entryReflection = await getEntryReflection(entry.id);
      setReflection(entryReflection);
    } catch (error) {
      console.error(`Failed to load reflection for entry ${entry.id}:`, error);
    } finally {
      setLoadingReflection(false);
    }
  };
  
  // Confirm and delete entry
  const confirmDeleteEntry = () => {
    if (!currentEntry) return;
    
    Alert.alert(
      'Удаление записи',
      'Вы уверены, что хотите удалить эту запись?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive', 
          onPress: async () => {
            await deleteEntry(currentEntry.id);
            setViewerVisible(false);
          }
        }
      ]
    );
  };
  
  // Refresh insights
  const refreshInsights = () => {
    loadInsights();
  };
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 70, // Учитываем tab bar
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Дневник
        </Text>
        <TouchableOpacity onPress={openNewEntryEditor}>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'CC']} // Полупрозрачный градиент
            style={styles.newEntryButton}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBar,
          { backgroundColor: colors.searchBackground }
        ]}>
          <Ionicons name="search" size={18} color={colors.secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Поиск записей..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                clearSearch();
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tag Selector */}
      {tags.length > 0 && (
        <TagSelector
          tags={tags}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
        />
      )}
      
      {/* Insights Card (if available) */}
      {insights.length > 0 && !isSearching && !selectedTag && (
        <View style={styles.insightsContainer}>
          <InsightsCard 
            insights={insights}
            onRefresh={refreshInsights}
          />
        </View>
      )}
      
      {/* Entries List */}
      <FlatList
        data={filteredEntries}
        renderItem={({ item }) => (
          <JournalEntryCard 
            entry={item}
            onPress={() => openEntryViewer(item)}
            onLongPress={() => openEditEntryEditor(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.entriesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Ionicons 
              name="book-outline" 
              size={48} 
              color={colors.secondaryText} 
            />
            <Text style={[styles.emptyListTitle, { color: colors.text }]}>
              {isSearching 
                ? 'Ничего не найдено' 
                : selectedTag 
                  ? `Нет записей с тегом "${selectedTag}"` 
                  : 'Нет записей в дневнике'}
            </Text>
          </View>
        )}
      />

      {/* Editor Modal */}
      <EntryEditorModal
        visible={editorVisible}
        onClose={() => setEditorVisible(false)}
        initialEntry={currentEntry ?? undefined}
        onSave={saveEntry}
      />

      {/* Viewer Modal */}
      <EntryViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        entry={currentEntry}
        reflection={reflection}
        loadingReflection={loadingReflection}
        onEdit={() => openEditEntryEditor(currentEntry!)}
        onDelete={confirmDeleteEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    newEntryButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 40,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
    },
    tagSelectorContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    tagSelectorItem: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: '#ccc',
      marginRight: 8,
    },
    tagSelectorItemActive: {
      backgroundColor: '#FF5252',
    },
    tagSelectorText: {
      fontSize: 14,
    },
    insightsContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    insightsCard: {
      padding: 16,
      borderRadius: 12,
    },
    insightsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    insightsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    refreshButton: {
      padding: 4,
    },
    insightsList: {
      gap: 8,
    },
    insightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    insightText: {
      fontSize: 14,
    },
    emptyInsightsText: {
      fontSize: 14,
      fontStyle: 'italic',
    },
    entriesList: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    emptyListContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 60,
    },
    emptyListTitle: {
      marginTop: 12,
      fontSize: 16,
      textAlign: 'center',
    },
    entryCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    entryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
    },
    sentimentIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginLeft: 8,
    },
    entryContent: {
      marginTop: 4,
      fontSize: 14,
    },
    entryFooter: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    entryDate: {
      fontSize: 12,
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 4,
    },
    tagText: {
      fontSize: 12,
    },
    moreTagsText: {
      fontSize: 12,
    },
    modalContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    saveButton: {
      fontSize: 16,
      fontWeight: '500',
    },
    modalContent: {
      flex: 1,
    },
    titleInput: {
      fontSize: 18,
      borderBottomWidth: 1,
      marginBottom: 12,
      paddingVertical: 4,
    },
    contentInput: {
      fontSize: 16,
      minHeight: 120,
      marginBottom: 16,
    },
    moodSelector: {
      marginBottom: 16,
    },
    moodSelectorLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    moodSelectorButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    moodButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      minWidth: 60,
    },
    moodButtonText: {
      fontSize: 20,
    },
    moodButtonLabel: {
      fontSize: 12,
    },
    tagsSection: {
      marginBottom: 16,
    },
    tagsSectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    tagInput: {
      flex: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    addTagButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    selectedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      marginRight: 6,
      marginBottom: 6,
    },
    selectedTagText: {
      fontSize: 14,
      marginRight: 4,
    },
    removeTagButton: {
      marginLeft: 4,
    },
    entryMetadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    entryDateTime: {
      fontSize: 12,
    },
    entryMood: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    moodEmoji: {
      fontSize: 18,
    },
    moodValue: {
      fontSize: 14,
    },
    entryTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    entryTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
    },
    entryTagText: {
      fontSize: 12,
    },
    entryContentFull: {
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 20,
    },
    analysisSection: {
      paddingTop: 12,
      borderTopWidth: 1,
      marginBottom: 20,
    },
    analysisSectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    insightsSection: {
      marginBottom: 12,
    },
    insightsSectionTitle: {
      fontSize: 14,
      marginBottom: 4,
    },
    entryInsightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    entryInsightText: {
      fontSize: 14,
    },
    keywordsSection: {
      marginBottom: 12,
    },
    keywordsSectionTitle: {
      fontSize: 14,
      marginBottom: 4,
    },
    keywordsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    keywordChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
    },
    keywordChipText: {
      fontSize: 12,
    },
    reflectionSection: {
      borderTopWidth: 1,
      paddingTop: 12,
      marginBottom: 40,
    },
    reflectionToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    reflectionToggleText: {
      fontSize: 16,
      fontWeight: '500',
    },
    reflectionContent: {
      paddingVertical: 8,
    },
    reflectionText: {
      fontSize: 14,
      lineHeight: 20,
    },
    noReflectionText: {
      fontSize: 14,
      fontStyle: 'italic',
    },
    reflectionLoader: {
      marginVertical: 16,
    },
    entryViewerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerAction: {
      padding: 4,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
      
  });
  
  