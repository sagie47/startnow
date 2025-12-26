import { View, Text, StyleSheet } from 'react-native';

export default function SprintsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SPRINTS</Text>
      <Text style={styles.placeholder}>Week view coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#000000',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#666666',
  },
});
