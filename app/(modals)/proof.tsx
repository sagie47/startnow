import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBlocks } from '@/hooks/use-blocks';
import type { Block } from '@/utils/storage';

export default function ProofModal() {
  const router = useRouter();
  const { block } = useLocalSearchParams<{ block: string }>();
  const { addProof, updateBlock } = useBlocks();
  const blockData: Block | null = block ? JSON.parse(block) : null;
  
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [rubricChecked, setRubricChecked] = useState(false);

  const handleSubmit = () => {
    if (!rubricChecked) {
      Alert.alert('Required', 'Please confirm the proof meets the criteria');
      return;
    }
    
    if (blockData) {
      addProof({
        blockId: blockData.id,
        link: link || undefined,
        note: note || undefined,
      });
      
      updateBlock(blockData.id, { completed: true });
    }
    
    router.back();
  };

  const handleSkip = () => {
    router.back();
  };

  if (!blockData) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PROOF OF WORK</Text>
            <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Block not found</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROOF OF WORK</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.blockPreview}>
            <View style={styles.blockPreviewContent}>
              <Text style={styles.blockTitle}>{blockData.title}</Text>
              <View style={styles.blockMeta}>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: blockData.type === 'Deep' ? '#FF6B6B' : 
                                   blockData.type === 'Admin' ? '#4ECDC4' : 
                                   blockData.type === 'Health' ? '#45B7D1' : '#FFA07A' }
                ]}>
                  <Text style={styles.typeText}>{blockData.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.durationText}>{blockData.duration}m</Text>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>LINK (OPTIONAL)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="link" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={link}
                onChangeText={setLink}
                placeholder="Paste link to work"
                placeholderTextColor="#999999"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="What did you accomplish?"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.rubricSection}>
            <Text style={styles.rubricTitle}>DONE MEANS:</Text>
            <TouchableOpacity
              style={styles.rubricOption}
              onPress={() => setRubricChecked(!rubricChecked)}
            >
              <View style={[
                styles.checkbox,
                rubricChecked && styles.checkboxChecked
              ]}>
                {rubricChecked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.rubricText}>I completed the planned outcome</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>SKIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !rubricChecked && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!rubricChecked}
            >
              <Text style={styles.submitButtonText}>SUBMIT PROOF</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#000000',
    maxHeight: '90%',
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
  blockPreview: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 24,
  },
  blockPreviewContent: {
    padding: 16,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  blockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    height: 100,
  },
  rubricSection: {
    marginBottom: 24,
  },
  rubricTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 12,
  },
  rubricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
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
  rubricText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  actions: {
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
  },
});
