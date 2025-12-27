import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBlocks } from '@/hooks/use-blocks';
import { generateReplan, generateSalvageStreakReplan, generateHardResetReplan, type ReplanResult } from '@/utils/replan';

type ReplanMode = 'keep-priorities' | 'salvage-streak' | 'hard-reset';

export default function ReplanModal() {
  const router = useRouter();
  const { blocks, updateBlocks } = useBlocks();
  
  const [mode, setMode] = useState<ReplanMode>('keep-priorities');
  const [replanResult, setReplanResult] = useState<ReplanResult | null>(null);
  const [preview, setPreview] = useState(false);

  const generatePlan = () => {
    let result: ReplanResult;
    
    switch (mode) {
      case 'salvage-streak':
        result = generateSalvageStreakReplan(blocks);
        break;
      case 'hard-reset':
        result = generateHardResetReplan(blocks);
        break;
      default:
        result = generateReplan(blocks);
    }
    
    setReplanResult(result);
    setPreview(true);
  };

  const handleApply = () => {
    if (!replanResult) return;
    
    updateBlocks(replanResult.blocks);
    router.back();
  };

  const formatMinutesBehind = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'moved': return 'arrow-forward';
      case 'shrunk': return 'contract';
      case 'skipped': return 'close-circle';
      default: return 'checkmark-circle';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'moved': return '#4CAF50';
      case 'shrunk': return '#FFA000';
      case 'skipped': return '#FF5252';
      default: return '#E0E0E0';
    }
  };

  if (!preview) {
    const tempResult = generateReplan(blocks);
    
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>REPLAN</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Ionicons name="alert-circle" size={20} color="#FF5252" />
                <Text style={styles.statusText}>
                  You&apos;re {formatMinutesBehind(tempResult.minutesBehind)} behind.
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>REPLAN MODE</Text>

            <TouchableOpacity
              style={[styles.modeCard, mode === 'keep-priorities' && styles.modeCardSelected]}
              onPress={() => setMode('keep-priorities')}
            >
              <View style={styles.modeLeft}>
                <View style={styles.modeIcon}>
                  <Ionicons name="list" size={24} color="#000000" />
                </View>
                <View style={styles.modeText}>
                  <Text style={styles.modeTitle}>Keep Priorities</Text>
                  <Text style={styles.modeSubtitle}>Default • maintain priority order</Text>
                </View>
              </View>
              {mode === 'keep-priorities' && (
                <Ionicons name="checkmark-circle" size={24} color="#000000" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, mode === 'salvage-streak' && styles.modeCardSelected]}
              onPress={() => setMode('salvage-streak')}
            >
              <View style={styles.modeLeft}>
                <View style={styles.modeIcon}>
                  <Ionicons name="flame" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.modeText}>
                  <Text style={styles.modeTitle}>Salvage Streak</Text>
                  <Text style={styles.modeSubtitle}>More shrinking, fewer skips</Text>
                </View>
              </View>
              {mode === 'salvage-streak' && (
                <Ionicons name="checkmark-circle" size={24} color="#000000" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, mode === 'hard-reset' && styles.modeCardSelected]}
              onPress={() => setMode('hard-reset')}
            >
              <View style={styles.modeLeft}>
                <View style={styles.modeIcon}>
                  <Ionicons name="refresh" size={24} color="#4ECDC4" />
                </View>
                <View style={styles.modeText}>
                  <Text style={styles.modeTitle}>Hard Reset</Text>
                  <Text style={styles.modeSubtitle}>Clear except fixed + protected</Text>
                </View>
              </View>
              {mode === 'hard-reset' && (
                <Ionicons name="checkmark-circle" size={24} color="#000000" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.generateButton} onPress={generatePlan}>
              <Text style={styles.generateButtonText}>GENERATE PLAN</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  if (!replanResult) return null;

  const movedCount = replanResult.actions.filter(a => a.action === 'moved').length;
  const shrunkCount = replanResult.actions.filter(a => a.action === 'shrunk').length;
  const skippedCount = replanResult.actions.filter(a => a.action === 'skipped').length;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPreview(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PREVIEW</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="arrow-forward" size={20} color="#4CAF50" />
                <Text style={styles.summaryNumber}>{movedCount}</Text>
                <Text style={styles.summaryLabel}>Moved</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="contract" size={20} color="#FFA000" />
                <Text style={styles.summaryNumber}>{shrunkCount}</Text>
                <Text style={styles.summaryLabel}>Shrunk</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="close-circle" size={20} color="#FF5252" />
                <Text style={styles.summaryNumber}>{skippedCount}</Text>
                <Text style={styles.summaryLabel}>Skipped</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>CHANGES</Text>

          <View style={styles.actionsList}>
            {replanResult.actions.map((action) => {
              const block = blocks.find(b => b.id === action.blockId);
              if (!block || action.action === 'unchanged') return null;

              const actionText = action.action === 'moved' && action.newStartTime
                ? `→ ${action.newStartTime}`
                : action.action === 'shrunk'
                ? `${action.originalDuration}m → ${action.newDuration}m`
                : '';

              return (
                <View key={action.blockId} style={styles.actionItem}>
                  <Ionicons 
                    name={getActionIcon(action.action) as any} 
                    size={20} 
                    color={getActionColor(action.action)} 
                  />
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{block.title}</Text>
                    <Text style={styles.actionDetail}>{actionText}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>APPLY PLAN</Text>
          </TouchableOpacity>
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
  backButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: '#FF5252',
    padding: 16,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5252',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
    marginBottom: 16,
  },
  modeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 12,
  },
  modeCardSelected: {
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
  },
  modeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  generateButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  summaryCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
  },
  actionsList: {
    gap: 12,
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  actionDetail: {
    fontSize: 12,
    color: '#666666',
  },
  applyButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});
