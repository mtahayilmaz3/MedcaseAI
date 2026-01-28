import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../src/theme/colors";
import { startDialogue } from "../src/api/endpoints";
import { setLastSession } from "../src/api/session_cache";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickTraining = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const res = await startDialogue();
      if (res && res.case) {
        setLastSession(res);
        router.push(`/case/${res.case.id}?session_id=${res.session_id}`);
      }
    } catch (e) {
      console.log("Quick training error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>Dr. John Doe</Text>
            <Text style={styles.university}>Biruni University</Text>
          </View>
          <Pressable style={styles.profileCircle} onPress={() => router.push('/profile')}>
            <Text style={styles.profileInitial}>JD</Text>
          </Pressable>
        </View>

        {/* 2. Clinical Pearl */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={18} color="#CA8A04" />
            <Text style={styles.tipTitle}>Clinical Pearl</Text>
          </View>
          <Text style={styles.tipText}>
            "In patients with suspected PE, always check Wells Criteria before ordering a CTPA."
          </Text>
        </View>

        {/* 3. Main Action Card */}
        <Text style={styles.sectionTitle}>Training Center</Text>
        <Pressable 
          style={[styles.mainCard, isLoading && { opacity: 0.9 }]} 
          onPress={handleQuickTraining}
          disabled={isLoading}
        >
          <View style={styles.mainCardContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainCardTitle}>General Practice</Text>
              <Text style={styles.mainCardSub}>
                {isLoading ? "Preparing analysis..." : "Start a random case analysis."}
              </Text>
            </View>
            <View style={styles.iconCircle}>
              {isLoading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="flash" size={26} color="white" />}
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 25, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 15 },
  welcome: { fontSize: 16, color: "#64748B", fontWeight: "500", marginTop: 120 },
  name: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginTop: 2 },
  university: { fontSize: 13, color: Colors.accent, fontWeight: "600", marginTop: 2 },
  profileCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginTop: 110 },
  profileInitial: { color: 'white', fontWeight: '800', fontSize: 16 },

  tipCard: { backgroundColor: "#FEFCE8", padding: 18, borderRadius: 22, marginBottom: 30, borderWidth: 1, borderColor: "#FEF08A" },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tipTitle: { fontSize: 11, fontWeight: '900', color: "#854D0E", textTransform: 'uppercase' },
  tipText: { fontSize: 14, color: "#713F12", lineHeight: 20, fontStyle: 'italic' },

  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B", marginBottom: 15, marginTop: 10 },
  mainCard: { backgroundColor: Colors.accent, padding: 25, borderRadius: 30, elevation: 4, marginBottom: 30 },
  mainCardContent: { flexDirection: "row", alignItems: "center" },
  mainCardTitle: { color: "white", fontSize: 22, fontWeight: "800" },
  mainCardSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Skills Section
  skillsContainer: { backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 10 },
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  skillLabel: { width: 80, fontSize: 12, fontWeight: '700', color: '#64748B' },
  skillBarBg: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginHorizontal: 10 },
  skillBarFill: { height: '100%', borderRadius: 3 },
  skillPercent: { width: 35, fontSize: 12, fontWeight: '800', color: '#1E293B', textAlign: 'right' },
});