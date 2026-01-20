import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from '../../theme/colors';

export const StatsDashboard = ({ totalSolved, avgScore, dailyStreak }) => (
  <View style={styles.statsContainer}>
    <View style={[styles.statBox, { backgroundColor: '#EEF2FF' }]}>
      <Ionicons name="analytics" size={20} color={Colors.accent} />
      <Text style={styles.statNum}>{totalSolved || 0}</Text>
      <Text style={styles.statLabel}>Vaka Çözüldü</Text>
    </View>
    <View style={[styles.statBox, { backgroundColor: '#ECFDF5' }]}>
      <Ionicons name="medal" size={20} color={Colors.success} />
      <Text style={styles.statNum}>%{Math.round(avgScore) || 0}</Text>
      <Text style={styles.statLabel}>Başarı Oranı</Text>
    </View>
    <View style={[styles.statBox, { backgroundColor: '#FFF7ED' }]}>
      <Ionicons name="flame" size={20} color={Colors.warning} />
      <Text style={styles.statNum}>{dailyStreak || 0}</Text>
      <Text style={styles.statLabel}>Günlük Seri</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 25, marginTop: 10 },
  statBox: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginVertical: 4 },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textAlign: 'center' },
});