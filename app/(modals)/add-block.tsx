import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBlocks } from '@/hooks/use-blocks';
import { useAI } from '@/hooks/use-ai';
import { assistBlock } from '@/services/block-assist';
import { useConstraints } from '@/hooks/use-constraints';
import type { Block } from '@/utils/storage';

type BlockType = Block['type'];

const BLOCK_TYPES: BlockType[] = ['Deep', 'Admin', 'Health', 'Learning', 'Social', 'Errand', 'Other'];

const TYPE_COLORS: Record<BlockType, string> = {
  Deep: '#FF6B6B',
  Admin: '#4ECDC4',
  Health: '#45B7D1',
  Learning: '#FFA07A',
  Social: '#9B59B6',
  Errand: '#95A5A6',
  Other: '#7F8C8D',
};

export default function AddBlockModal() {
  const router = useRouter();
  const { block } = useLocalSearchParams<{ block: string }>();
  const { addBlock, updateBlock, deleteBlock, blocks } = useBlocks();
  const { constraints } = useConstraints();
  const { isEnabled: aiEnabled } = useAI();
  const editingBlock: Block | null = block ? JSON.parse(block) : null;
  
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<BlockType>('Deep');
  const [duration, setDuration] = useState('60');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [fallbackMinutes, setFallbackMinutes] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  useEffect(() => {
    if (editingBlock) {
      setTitle(editingBlock.title);
      setSelectedType(editingBlock.type as BlockType);
      setDuration(editingBlock.duration.toString());
      setPriority(editingBlock.priority || 2);
      setFallbackMinutes(editingBlock.fallbackMinutes?.toString() || '');
      setIsProtected(editingBlock.protected || false);
    }
  }, [editingBlock]);

  const handleAutoFill = async () => {
    if (!aiEnabled) {
      Alert.alert('AI Not Enabled', 'Enable AI in Profile to use auto-fill.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Enter Title', 'Enter a partial title to get AI suggestions.');
      return;
    }

    try {
      setAiLoading(true);
      setAiRationale(null);
      
      const response = await assistBlock(
        title,
        undefined,
        constraints,
        blocks.map((b) => ({
          title: b.title,
          type: b.type,
          durationMinutes: b.duration,
        }))
      );

      if (response.suggestions && response.suggestions.length > 0) {
        const suggestion = response.suggestions[0];
        setSelectedType(suggestion.type);
        setDuration(suggestion.durationMinutes.toString());
        setPriority(suggestion.priority);
        setFallbackMinutes('');
        setAiRationale(suggestion.notes);
      }
    } catch (error: any) {
      console.error('AI assist failed:', error);
      Alert.alert('AI Error', error.message || 'Failed to get suggestions. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    
    if (editingBlock) {
      updateBlock(editingBlock.id, {
        title,
        type: selectedType,
        duration: parseInt(duration),
        priority,
        fallbackMinutes: fallbackMinutes ? parseInt(fallbackMinutes) : undefined,
        protected: isProtected,
      });
    } else {
      addBlock({
        title,
        type: selectedType,
        startTime: calculateStartTime(),
        duration: parseInt(duration),
        fixed: false,
        completed: false,
        priority,
        fallbackMinutes: fallbackMinutes ? parseInt(fallbackMinutes) : undefined,
        protected: isProtected,
      });
    }
    router.back();
  };

  const handleDelete = () => {
    if (editingBlock) {
      deleteBlock(editingBlock.id);
      router.back();
    }
  };

  const calculateStartTime = (): string => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={() => router.back()} 
        activeOpacity={1}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{editingBlock ? 'EDIT BLOCK' : 'ADD BLOCK'}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What are you working on?"
              placeholderTextColor="#999999"
              autoFocus={!editingBlock}
            />
            {aiEnabled && !editingBlock && (
              <TouchableOpacity
                style={styles.autoFillButton}
                onPress={handleAutoFill}
                disabled={aiLoading || !title.trim()}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#000000" />
                    <Text style={styles.autoFillButtonText}>Auto-fill with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {aiRationale && (
              <View style={styles.aiRationale}>
                <Text style={styles.aiRationaleLabel}>AI Rationale:</Text>
                <Text style={styles.aiRationaleText}>{aiRationale}</Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>TYPE</Text>
            <View style={styles.typeGrid}>
              {BLOCK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && { backgroundColor: TYPE_COLORS[type] }
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[
                    styles.typeText,
                    selectedType === type && styles.typeTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>DURATION (MINUTES)</Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setDuration(Math.max(15, parseInt(duration) - 15).toString())}
              >
                <Ionicons name="remove" size={20} color="#000000" />
              </TouchableOpacity>
              <TextInput
                style={styles.durationInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setDuration((parseInt(duration) + 15).toString())}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>PRIORITY</Text>
            <View style={styles.prioritySelector}>
              {[1, 2, 3].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonSelected
                  ]}
                  onPress={() => setPriority(p as 1 | 2 | 3)}
                >
                  <Text style={[
                    styles.priorityText,
                    priority === p && styles.priorityTextSelected
                  ]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>FALLBACK MINUTES (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={fallbackMinutes}
              onChangeText={setFallbackMinutes}
              placeholder="Min duration if blocked (e.g., 30)"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.protectedToggle}
              onPress={() => setIsProtected(!isProtected)}
            >
              <View style={[
                styles.checkbox,
                isProtected && styles.checkboxChecked
              ]}>
                {isProtected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.protectedLabel}>Protect (don&apos;t skip in replan)</Text>
            </TouchableOpacity>
          </View>

          {editingBlock && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#FF6B6B" />
              <Text style={styles.deleteButtonText}>DELETE BLOCK</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.addButton,
              !title.trim() && styles.addButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.addButtonText}>{editingBlock ? 'UPDATE BLOCK' : 'ADD BLOCK'}</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#000000',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 12,
    marginTop: 8,
  },
  autoFillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  aiRationale: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginTop: 8,
  },
  aiRationaleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 4,
  },
  aiRationaleText: {
    fontSize: 13,
    color: '#000000',
    lineHeight: 18,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  typeTextSelected: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  sliderButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  durationInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    paddingVertical: 14,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  priorityTextSelected: {
    color: '#FFFFFF',
  },
  protectedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
  },
  protectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    marginTop: 24,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FF6B6B',
  },
});
