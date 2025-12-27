import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConstraints } from '@/hooks/use-constraints';
import { useAI } from '@/hooks/use-ai';
import { calculateFeasibility, generatePlanVariants } from '@/utils/storage';
import { optimizeGoal } from '@/services/ai-optimizer';
import { useBlocks } from '@/hooks/use-blocks';
import type { Block } from '@/utils/storage';

export default function GoalOptimizerModal() {
  const router = useRouter();
  const { constraints, loading } = useConstraints();
  const { isEnabled: aiEnabled, loadAISetting } = useAI();
  const { addBlock } = useBlocks();
  const [goalText, setGoalText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<'mvg' | 'standard' | 'aggressive' | null>(null);

  useEffect(() => {
    loadAISetting();
  }, [loadAISetting]);

  const handleAnalyze = async () => {
    if (!goalText.trim()) return;
    setAnalyzed(true);
    setAiError(null);

    if (aiEnabled) {
      try {
        setAiLoading(true);
        const response = await optimizeGoal(goalText, constraints);
        setAiResponse(response);
      } catch (error: any) {
        console.error('AI optimization failed:', error);
        setAiError(error.message || 'Failed to generate AI plan');
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleApplyVariant = (variant: 'mvg' | 'standard' | 'aggressive') => {
    const blocks = aiResponse?.variants?.[variant]?.blocks || [];
    
    if (blocks.length === 0) {
      Alert.alert('No blocks to apply', 'This variant has no time blocks defined.');
      return;
    }

    blocks.forEach((block: any, index: number) => {
      const startTime = '09:00';
      const newBlock: Block = {
        id: `block_${Date.now()}_${index}`,
        title: block.title,
        type: block.type,
        startTime,
        duration: block.durationMinutes,
        fixed: block.fixed,
        completed: false,
        priority: block.priority,
      };
      addBlock(newBlock);
    });

    Alert.alert('Plan Applied', `${blocks.length} blocks added to your schedule.`);
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>GOAL OPTIMIZER</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading constraints...</Text>
          </View>
        </View>
      </View>
    );
  }

  const variants = generatePlanVariants(goalText, constraints);
  const mvgVariant = variants.find(v => v.level === 'mvg');
  const standardVariant = variants.find(v => v.level === 'standard');
  const aggressiveVariant = variants.find(v => v.level === 'aggressive');
  
  const mvgFeasibility = calculateFeasibility(mvgVariant?.hours || 0, constraints);
  const standardFeasibility = calculateFeasibility(standardVariant?.hours || 0, constraints);
  const aggressiveFeasibility = calculateFeasibility(aggressiveVariant?.hours || 0, constraints);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GOAL OPTIMIZER</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>YOUR GOAL</Text>
            <TextInput
              style={styles.goalInput}
              value={goalText}
              onChangeText={setGoalText}
              placeholder="What do you want to achieve?"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.analyzeButton, !goalText.trim() && styles.analyzeButtonDisabled]}
              onPress={handleAnalyze}
              disabled={!goalText.trim()}
            >
              {aiLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.analyzeButtonText}>{aiEnabled ? 'AI ANALYZE' : 'ANALYZE'}</Text>
              )}
            </TouchableOpacity>
            {aiEnabled && (
              <Text style={styles.aiStatusText}>AI {aiLoading ? 'generating plan...' : 'enabled'}</Text>
            )}
          </View>

          {analyzed && (
            <View style={styles.resultsSection}>
              {aiError && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{aiError}</Text>
                </View>
              )}

              <View style={styles.availableHoursCard}>
                <View style={styles.availableHoursRow}>
                  <Text style={styles.availableHoursLabel}>Available hours/week</Text>
                  <Text style={styles.availableHoursValue}>{constraints.weeklyGoalHours}h</Text>
                </View>
                <Text style={styles.availableHoursHint}>
                  Based on your: {constraints.sleepFloor}h sleep, {constraints.workHoursPerDay}h work, {constraints.workDaysPerWeek} days
                </Text>
              </View>

              <View style={styles.variantsSection}>
                <TouchableOpacity
                  style={[
                    styles.variantCard,
                    styles.mvgCard,
                    mvgFeasibility.status === 'green' && styles.variantCardGreen,
                    mvgFeasibility.status === 'yellow' && styles.variantCardYellow,
                    mvgFeasibility.status === 'red' && styles.variantCardRed,
                    selectedVariant === 'mvg' && styles.variantCardSelected,
                  ]}
                  onPress={() => setSelectedVariant('mvg')}
                >
                  <View style={styles.variantHeader}>
                    <Text style={styles.variantTitle}>MVG</Text>
                    <View style={[
                      styles.statusDot,
                      mvgFeasibility.status === 'green' && { backgroundColor: '#4CAF50' },
                      mvgFeasibility.status === 'yellow' && { backgroundColor: '#FFA000' },
                      mvgFeasibility.status === 'red' && { backgroundColor: '#FF5252' },
                    ]} />
                  </View>
                  <Text style={styles.variantHours}>{mvgVariant?.hours}h/week</Text>
                  <Text style={styles.variantDescription}>{mvgVariant?.description}</Text>
                  {aiResponse?.variants?.mvg?.blocks && (
                    <>
                      <Text style={styles.blocksCount}>{aiResponse.variants.mvg.blocks.length} blocks</Text>
                      {selectedVariant === 'mvg' && (
                        <View style={styles.blocksList}>
                          {aiResponse.variants.mvg.blocks.map((block: any, idx: number) => (
                            <View key={idx} style={styles.blockItem}>
                              <Text style={styles.blockTitle}>{block.title}</Text>
                              <Text style={styles.blockMeta}>{block.type} • {block.durationMinutes}m</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyVariant('mvg')}
                      >
                        <Text style={styles.applyButtonText}>APPLY MVG</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.variantCard,
                    styles.standardCard,
                    standardFeasibility.status === 'green' && styles.variantCardGreen,
                    standardFeasibility.status === 'yellow' && styles.variantCardYellow,
                    standardFeasibility.status === 'red' && styles.variantCardRed,
                    selectedVariant === 'standard' && styles.variantCardSelected,
                  ]}
                  onPress={() => setSelectedVariant('standard')}
                >
                  <View style={styles.variantHeader}>
                    <Text style={styles.variantTitle}>STANDARD</Text>
                    <View style={[
                      styles.statusDot,
                      standardFeasibility.status === 'green' && { backgroundColor: '#4CAF50' },
                      standardFeasibility.status === 'yellow' && { backgroundColor: '#FFA000' },
                      standardFeasibility.status === 'red' && { backgroundColor: '#FF5252' },
                    ]} />
                  </View>
                  <Text style={styles.variantHours}>{standardVariant?.hours}h/week</Text>
                  <Text style={styles.variantDescription}>{standardVariant?.description}</Text>
                  {aiResponse?.variants?.standard?.blocks && (
                    <>
                      <Text style={styles.blocksCount}>{aiResponse.variants.standard.blocks.length} blocks</Text>
                      {selectedVariant === 'standard' && (
                        <View style={styles.blocksList}>
                          {aiResponse.variants.standard.blocks.map((block: any, idx: number) => (
                            <View key={idx} style={styles.blockItem}>
                              <Text style={styles.blockTitle}>{block.title}</Text>
                              <Text style={styles.blockMeta}>{block.type} • {block.durationMinutes}m</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyVariant('standard')}
                      >
                        <Text style={styles.applyButtonText}>APPLY STANDARD</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.variantCard,
                    styles.aggressiveCard,
                    aggressiveFeasibility.status === 'green' && styles.variantCardGreen,
                    aggressiveFeasibility.status === 'yellow' && styles.variantCardYellow,
                    aggressiveFeasibility.status === 'red' && styles.variantCardRed,
                    selectedVariant === 'aggressive' && styles.variantCardSelected,
                  ]}
                  onPress={() => setSelectedVariant('aggressive')}
                >
                  <View style={styles.variantHeader}>
                    <Text style={styles.variantTitle}>AGGRESSIVE</Text>
                    <View style={[
                      styles.statusDot,
                      aggressiveFeasibility.status === 'green' && { backgroundColor: '#4CAF50' },
                      aggressiveFeasibility.status === 'yellow' && { backgroundColor: '#FFA000' },
                      aggressiveFeasibility.status === 'red' && { backgroundColor: '#FF5252' },
                    ]} />
                  </View>
                  <Text style={styles.variantHours}>{aggressiveVariant?.hours}h/week</Text>
                  <Text style={styles.variantDescription}>{aggressiveVariant?.description}</Text>
                  {aiResponse?.variants?.aggressive?.blocks && (
                    <>
                      <Text style={styles.blocksCount}>{aiResponse.variants.aggressive.blocks.length} blocks</Text>
                      {selectedVariant === 'aggressive' && (
                        <View style={styles.blocksList}>
                          {aiResponse.variants.aggressive.blocks.map((block: any, idx: number) => (
                            <View key={idx} style={styles.blockItem}>
                              <Text style={styles.blockTitle}>{block.title}</Text>
                              <Text style={styles.blockMeta}>{block.type} • {block.durationMinutes}m</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyVariant('aggressive')}
                      >
                        <Text style={styles.applyButtonText}>APPLY AGGRESSIVE</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
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
  loadingContainer: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 8,
  },
  goalInput: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    marginBottom: 12,
  },
  analyzeButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.3,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  aiStatusText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#FF5252',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
  },
  resultsSection: {
    gap: 16,
  },
  availableHoursCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
  },
  availableHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  availableHoursLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  availableHoursValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  availableHoursHint: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  variantsSection: {
    gap: 12,
  },
  variantCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
  },
  mvgCard: {
    backgroundColor: '#F5F5F5',
  },
  standardCard: {
    backgroundColor: '#FFFFFF',
  },
  aggressiveCard: {
    backgroundColor: '#000000',
  },
  variantCardGreen: {
    borderColor: '#4CAF50',
  },
  variantCardYellow: {
    borderColor: '#FFA000',
  },
  variantCardRed: {
    borderColor: '#FF5252',
  },
  variantCardSelected: {
    borderWidth: 3,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  variantHours: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  variantDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  blocksCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
    marginBottom: 8,
  },
  blocksList: {
    marginTop: 8,
    gap: 8,
  },
  blockItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  blockMeta: {
    fontSize: 12,
    color: '#666666',
  },
  applyButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});
