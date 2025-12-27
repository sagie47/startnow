import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBlocks } from '@/hooks/use-blocks';
import { useAI } from '@/hooks/use-ai';
import { useConstraints } from '@/hooks/use-constraints';
import { generateDebrief, buildGenerateDebriefInput, validateDebriefResponse } from '@/services/debrief';
import { mapDebriefToStorage, saveDebrief, getDebriefForDate } from '@/utils/storage';
import type { Block } from '@/utils/storage';

export default function DebriefModal() {
  const router = useRouter();
  const { blocks, updateBlocks } = useBlocks();
  const { isEnabled: aiEnabled } = useAI();
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [existingDebrief, setExistingDebrief] = useState<any>(null);
  const [debriefResponse, setDebriefResponse] = useState<any>(null);

  useEffect(() => {
    loadTodayDebrief();
  }, []);

  const loadTodayDebrief = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const debrief = await getDebriefForDate(today);
      setExistingDebrief(debrief);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load debrief:', error);
      setLoading(false);
    }
  };

  const handleGenerateDebrief = async () => {
    if (!aiEnabled) {
      Alert.alert('AI Not Enabled', 'Enable AI in Profile to generate debrief.');
      return;
    }

    const plannedCount = blocks.length;
    const doneCount = blocks.filter(b => b.completed).length;
    const plannedMinutes = blocks.reduce((sum, b) => sum + b.duration, 0);
    const doneMinutes = blocks.filter(b => b.completed).reduce((sum, b) => sum + b.duration, 0);

    const input = buildGenerateDebriefInput({
      plannedCount,
      doneCount,
      plannedMinutes,
      doneMinutes,
      skippedCount: 0,
      shrunkCount: 0,
      driftMinutes: 0,
    });

    try {
      setAiLoading(true);
      const response = await generateDebrief(input);
      const validated = validateDebriefResponse(response);
      setDebriefResponse(validated);
    } catch (error: any) {
      console.error('Debrief generation failed:', error);
      Alert.alert('Error', error.message || 'Failed to generate debrief');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyDebrief = async () => {
    const today = new Date().toISOString().split('T')[0];
    const inputs = {
      plannedCount: blocks.length,
      doneCount: blocks.filter(b => b.completed).length,
      plannedMinutes: blocks.reduce((sum, b) => sum + b.duration, 0),
      doneMinutes: blocks.filter(b => b.completed).reduce((sum, b) => sum + b.duration, 0),
      driftMinutes: 0,
      skippedCount: 0,
      shrunkCount: 0,
    };

    const storageDebrief = mapDebriefToStorage({
      date: today,
      createdAt: Date.now(),
      inputs,
      ai: debriefResponse || {
        streakStatus: 'maintained',
        blocksCompleted: inputs.doneCount,
        blocksPlanned: inputs.plannedCount,
        completionPercent: Math.round((inputs.doneMinutes / Math.max(1, inputs.plannedMinutes)) * 100),
        tomorrowRule: 'Review your plan',
        oneChange: 'Track time better',
        keepDoing: 'Keep your Deep blocks',
        insights: [],
        recommendations: [],
      },
    });

    try {
      await saveDebrief(storageDebrief);
      setExistingDebrief(storageDebrief);
      Alert.alert('Debrief Saved', 'Your daily review has been recorded.');
    } catch (error: any) {
      console.error('Failed to save debrief:', error);
      Alert.alert('Error', 'Failed to save debrief');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>DEBRIEF</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading debrief...</Text>
          </View>
        </View>
      </View>
    );
  }

  const plannedCount = blocks.length;
  const doneCount = blocks.filter(b => b.completed).length;
  const plannedMinutes = blocks.reduce((sum, b) => sum + b.duration, 0);
  const doneMinutes = blocks.filter(b => b.completed).reduce((sum, b) => sum + b.duration, 0);
  const completionPercent = plannedMinutes > 0 ? Math.round((doneMinutes / plannedMinutes) * 100) : 0;

  const displayDebrief = existingDebrief || debriefResponse;

  type Recommendation = {
    title: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DEBRIEF</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statNumber}>{plannedCount}</Text>
              <Text style={styles.statLabel}>PLANNED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statNumber}>{doneCount}</Text>
              <Text style={styles.statLabel}>DONE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={[styles.statNumber, completionPercent >= 80 && styles.statGood, completionPercent >= 50 && styles.statWarning]}>
                {completionPercent}%
              </Text>
              <Text style={styles.statLabel}>COMPLETION</Text>
            </View>
          </View>

          {aiEnabled && !existingDebrief && (
            <TouchableOpacity
              style={[styles.generateButton, aiLoading && styles.generateButtonDisabled]}
              onPress={handleGenerateDebrief}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>GENERATE DEBRIEF</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {displayDebrief && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TOMORROW'S RULE</Text>
                <View style={styles.ruleCard}>
                  <Text style={styles.ruleText}>{displayDebrief.outputs.tomorrowRule}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ONE CHANGE</Text>
                <View style={styles.card}>
                  <Text style={styles.cardText}>{displayDebrief.outputs.oneChange}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>KEEP DOING</Text>
                <View style={styles.card}>
                  <Text style={styles.cardText}>{displayDebrief.outputs.keepDoing}</Text>
                </View>
              </View>

              {displayDebrief.outputs.insights && displayDebrief.outputs.insights.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>INSIGHTS</Text>
                  {(displayDebrief.outputs.insights as string[]).map((insight: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <Ionicons name="arrow-forward" size={16} color="#666666" />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

                  {displayDebrief.outputs.recommendations && displayDebrief.outputs.recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>RECOMMENDATIONS</Text>
                  {(displayDebrief.outputs.recommendations as Recommendation[]).map((rec: Recommendation, index: number) => (
                    <View key={index} style={[styles.recommendationCard, rec.priority === 'high' && styles.recHigh, rec.priority === 'medium' && styles.recMedium]}>
                      <View style={styles.recHeader}>
                        <Text style={styles.recTitle}>{rec.title}</Text>
                        <View style={[
                          styles.recPriorityDot,
                          rec.priority === 'high' && styles.recPriorityHigh,
                          rec.priority === 'medium' && styles.recPriorityMedium,
                          rec.priority === 'low' && styles.recPriorityLow
                        ]} />
                      </View>
                      <Text style={styles.recAction}>{rec.action}</Text>
                    </View>
                  ))}
                </View>
              )}

              {!existingDebrief && (
                <TouchableOpacity
                  style={[styles.applyButton, (!displayDebrief || aiLoading) && styles.applyButtonDisabled]}
                  onPress={handleApplyDebrief}
                  disabled={!displayDebrief || aiLoading}
                >
                  <Text style={styles.applyButtonText}>APPLY & SAVE DEBRIEF</Text>
                </TouchableOpacity>
              )}

              {existingDebrief && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.savedText}>Debrief saved for {existingDebrief.date}</Text>
                </View>
              )}
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  statsCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  statGood: {
    color: '#4CAF50',
  },
  statWarning: {
    color: '#FFA000',
  },
  generateButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  generateButtonDisabled: {
    opacity: 0.3,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 12,
  },
  ruleCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 20,
    backgroundColor: '#000000',
  },
  ruleText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  card: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  cardText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  recommendationCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 12,
  },
  recHigh: {
    borderColor: '#FF5252',
  },
  recMedium: {
    borderColor: '#FFA000',
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  recPriorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recPriorityHigh: {
    backgroundColor: '#FF5252',
  },
  recPriorityMedium: {
    backgroundColor: '#FFA000',
  },
  recPriorityLow: {
    backgroundColor: '#4CAF50',
  },
  recAction: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  applyButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonDisabled: {
    opacity: 0.3,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F1F8F1',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  savedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
