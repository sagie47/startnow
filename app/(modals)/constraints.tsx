import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConstraints } from '@/hooks/use-constraints';

export default function ConstraintsModal() {
  const router = useRouter();
  const { constraints, loading, updateConstraints } = useConstraints();
  
  const [sleepFloor, setSleepFloor] = useState(7);
  const [workHoursPerDay, setWorkHoursPerDay] = useState(8);
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState(5);
  const [commuteMinutesPerDay, setCommuteMinutesPerDay] = useState(30);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(10);
  const [monthlyBudget, setMonthlyBudget] = useState(100);

  useEffect(() => {
    if (!loading) {
      setSleepFloor(constraints.sleepFloor);
      setWorkHoursPerDay(constraints.workHoursPerDay);
      setWorkDaysPerWeek(constraints.workDaysPerWeek);
      setCommuteMinutesPerDay(constraints.commuteMinutesPerDay);
      setWeeklyGoalHours(constraints.weeklyGoalHours);
      setMonthlyBudget(constraints.monthlyBudget);
    }
  }, [constraints, loading]);

  const handleSave = () => {
    updateConstraints({
      sleepFloor,
      workHoursPerDay,
      workDaysPerWeek,
      commuteMinutesPerDay,
      weeklyGoalHours,
      monthlyBudget,
    });
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>CONSTRAINTS</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  const availableHours = Math.floor(168 - (sleepFloor * 7) - (workHoursPerDay * workDaysPerWeek) - ((commuteMinutesPerDay * workDaysPerWeek) / 60) - 10);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CONSTRAINTS</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TIME CONSTRAINTS</Text>
            <Text style={styles.sectionSubtitle}>Fixed commitments are immovable</Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>SLEEP FLOOR (HOURS/NIGHT)</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{sleepFloor}h</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setSleepFloor(Math.max(5, sleepFloor - 0.5))}
              >
                <Ionicons name="remove" size={20} color="#000000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((sleepFloor - 5) / 7) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setSleepFloor(Math.min(12, sleepFloor + 0.5))}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>WORK HOURS/DAY</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{workHoursPerDay}h</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setWorkHoursPerDay(Math.max(0, workHoursPerDay - 1))}
              >
                <Ionicons name="remove" size={20} color="#000000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${(workHoursPerDay / 12) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setWorkHoursPerDay(Math.min(12, workHoursPerDay + 1))}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>WORK DAYS/WEEK</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{workDaysPerWeek}</Text>
              </View>
            </View>
            <View style={styles.daySelector}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    workDaysPerWeek === day && styles.dayButtonSelected
                  ]}
                  onPress={() => setWorkDaysPerWeek(day)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    workDaysPerWeek === day && styles.dayButtonTextSelected
                  ]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>COMMUTE (MINUTES/DAY)</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{commuteMinutesPerDay}m</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setCommuteMinutesPerDay(Math.max(0, commuteMinutesPerDay - 15))}
              >
                <Ionicons name="remove" size={20} color="#000000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${(commuteMinutesPerDay / 120) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setCommuteMinutesPerDay(Math.min(120, commuteMinutesPerDay + 15))}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GOAL CONSTRAINTS</Text>
            <Text style={styles.sectionSubtitle}>Be honest about your time budget</Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>WEEKLY GOAL HOURS</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{weeklyGoalHours}h</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setWeeklyGoalHours(Math.max(1, weeklyGoalHours - 1))}
              >
                <Ionicons name="remove" size={20} color="#000000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${(weeklyGoalHours / 40) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setWeeklyGoalHours(Math.min(40, weeklyGoalHours + 1))}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputHeader}>
              <Text style={styles.label}>MONTHLY BUDGET ($)</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>${monthlyBudget}</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setMonthlyBudget(Math.max(0, monthlyBudget - 10))}
              >
                <Ionicons name="remove" size={20} color="#000000" />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${(monthlyBudget / 500) * 100}%` }]} />
              </View>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => setMonthlyBudget(Math.min(500, monthlyBudget + 10))}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Available hours/week</Text>
              <Text style={styles.summaryValue}>{availableHours}h</Text>
            </View>
            <View style={[
              styles.summaryDivider,
              weeklyGoalHours <= availableHours * 0.8 ? { backgroundColor: '#4CAF50' } :
              weeklyGoalHours <= availableHours ? { backgroundColor: '#FFA000' } :
              { backgroundColor: '#FF5252' }
            ]} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Your goal hours</Text>
              <Text style={styles.summaryValue}>{weeklyGoalHours}h</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE CONSTRAINTS</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#000000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  formGroup: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#666666',
  },
  valueBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  sliderButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#000000',
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  dayButtonTextSelected: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  summaryDivider: {
    height: 2,
    marginVertical: 12,
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});
