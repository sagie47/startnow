import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useConstraints } from '@/hooks/use-constraints';
import { useSettings } from '@/hooks/use-settings';
import { useAI } from '@/hooks/use-ai';

export default function ProfileScreen() {
  const router = useRouter();
  const { constraints, loading: constraintsLoading } = useConstraints();
  const { settings, loading: settingsLoading } = useSettings();
  const { isEnabled: aiEnabled, isLoading: aiLoading, loadAISetting, toggleAI } = useAI();

  useEffect(() => {
    loadAISetting();
  }, [loadAISetting]);

  if (constraintsLoading || settingsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const availableHours = Math.floor(
    168 -
    (constraints.sleepFloor * 7) -
    (constraints.workHoursPerDay * constraints.workDaysPerWeek) -
    ((constraints.commuteMinutesPerDay * constraints.workDaysPerWeek) / 60) -
    10
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(modals)/constraints')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="time" size={24} color="#000000" />
            <View style={styles.menuItemText}>
              <Text style={styles.menuItemTitle}>Constraints</Text>
              <Text style={styles.menuItemSubtitle}>
                {constraints.weeklyGoalHours}h/week • ${constraints.monthlyBudget}/mo
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR TIME BUDGET</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Available/week</Text>
            <Text style={styles.summaryValue}>{availableHours}h</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sleep floor</Text>
            <Text style={styles.summaryValue}>{constraints.sleepFloor}h</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Work</Text>
            <Text style={styles.summaryValue}>{constraints.workHoursPerDay}h × {constraints.workDaysPerWeek}d</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Commute</Text>
            <Text style={styles.summaryValue}>{constraints.commuteMinutesPerDay}m/d</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI ASSISTANT</Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelColumn}>
              <Text style={styles.settingLabel}>AI Assistant</Text>
              <Text style={styles.settingCaption}>Uses Gemini for suggestions. Scheduling remains deterministic.</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, aiEnabled && styles.toggleOn]}
              onPress={toggleAI}
              disabled={aiLoading}
            >
              <View style={[styles.toggleCircle, aiEnabled && styles.toggleCircleOn]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Timezone</Text>
            <Text style={styles.settingValue}>{settings.timezone}</Text>
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Week starts on</Text>
            <Text style={styles.settingValue}>{settings.weekStart.charAt(0).toUpperCase() + settings.weekStart.slice(1)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
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
  content: {
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
  },
  summaryCard: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  settingsCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  settingValue: {
    fontSize: 14,
    color: '#666666',
  },
  settingLabelColumn: {
    flex: 1,
  },
  settingCaption: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#000000',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  toggleCircleOn: {
    transform: [{ translateX: 20 }],
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});
