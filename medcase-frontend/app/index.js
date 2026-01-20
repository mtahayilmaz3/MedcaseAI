import { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { listCases } from "../src/api/endpoints";
import { CaseCard } from "../src/components/common/CaseCard";
import { Colors } from "../src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { StatsDashboard } from "../src/components/home/StatsDashboard";
import { getGlobalStats } from "../src/api/database";

export default function HomePage() {
const router = useRouter();
const [cases, setCases] = useState([]);
const [loading, setLoading] = useState(true);
const [activeCategory, setActiveCategory] = useState("Hepsi");
const [stats, setStats] = useState({ totalSolved: 0, avgScore: 0 });

// 1. DB'deki vaka verilerini ve kategorileri çek
useEffect(() => {
// SQLite istatistikleri
try {
const data = getGlobalStats();
if (data) setStats({ totalSolved: data.totalSolved || 0, avgScore: data.avgScore || 0 });
} catch (e) { console.log("Stats DB henüz hazır değil."); }

// Vaka listesi
listCases().then(res => {
const enriched = res.map(c => ({ ...c, status: c.status || 'Çözülecek' }));
setCases(enriched);
}).finally(() => setLoading(false));
}, []);

// 2. Dinamik Kategori Listesi (DB'deki specialty alanlarından benzersiz olanları al)
const dynamicCategories = useMemo(() => {
const specs = cases.map(c => c.specialty).filter(Boolean);
return ["Hepsi", ...new Set(specs)];
}, [cases]);

// 3. Filtrelenmiş Vakalar
const filteredCases = useMemo(() => {
let result = activeCategory === "Hepsi"
? cases
: cases.filter(c => c.specialty === activeCategory);
return [...result].sort((a, b) => (a.status === 'Çözüldü' ? 1 : -1));
}, [cases, activeCategory]);

// 4. Kategoriye Özel Hızlı Antrenman Yönlendirmesi
const handleQuickTraining = () => {
if (filteredCases.length === 0) {
Alert.alert("Hata", "Bu kategoride vaka bulunamadı.");
return;
}
const randomIndex = Math.floor(Math.random() * filteredCases.length);
const selectedCase = filteredCases[randomIndex];
// Raporu okuması için önce Patient Record (Detay) sayfasına yönlendiriyoruz
router.push({
pathname: `/case/${selectedCase.id}`,
params: { mode: 'training' }
});
};

if (loading) return <ActivityIndicator size="large" color={Colors.accent} style={{ flex: 1 }} />;

return (
<SafeAreaView style={styles.container}>
<ScrollView showsVerticalScrollIndicator={false}>
<View style={styles.topSection}>
<View>
<Text style={styles.welcomeText}>Merhaba, Dr. John Doe</Text>
<Text style={styles.subWelcome}>Veritabanında {cases.length} vaka hazır.</Text>
</View>
<Pressable style={styles.avatarCircle} onPress={() => router.push('/profile')}>
<Text style={styles.avatarInitial}>JD</Text>
</Pressable>
</View>

<StatsDashboard totalSolved={stats.totalSolved} avgScore={stats.avgScore} />

{/* Dinamik Kategoriler - Yatay Scroll */}
<View style={styles.categoryWrapper}>
<Text style={styles.sectionTitle}>Uzmanlık Alanları</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
{dynamicCategories.map((cat) => (
<Pressable
key={cat}
onPress={() => setActiveCategory(cat)}
style={[styles.catBadge, activeCategory === cat && styles.catBadgeActive]}
>
<Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
</Pressable>
))}
</ScrollView>
</View>

{/* Kategoriye Duyarlı Hızlı Antrenman Kartı */}
<View style={styles.actionSection}>
<Pressable style={styles.randomCard} onPress={handleQuickTraining}>
<View style={styles.randomCardContent}>
<View style={{ flex: 1 }}>
<Text style={styles.randomTitle}>
{activeCategory === "Hepsi" ? "Hızlı Antrenman" : `${activeCategory} Pratiği`}
</Text>
<Text style={styles.randomSub}>
{activeCategory === "Hepsi"
? "Rastgele bir vaka ile genel yeteneklerini test et."
: `${activeCategory} alanından seçilen rastgele bir vakayı incele.`}
</Text>
</View>
<View style={styles.iconCircle}>
<Ionicons name="medical" size={26} color="white" />
</View>
</View>
</Pressable>
</View>

<Text style={styles.sectionTitle}>Vaka Listesi ({filteredCases.length})</Text>
<View style={styles.listContainer}>
{filteredCases.map((item) => {
// getStatusDetails fonksiyonunun burada çağrıldığını varsayıyoruz (stil için)
return (
<View key={item.id} style={styles.cardContainer}>
<CaseCard item={item} onPress={() => router.push(`/case/${item.id}`)} />
<View style={styles.statusBadge}>
<Text style={styles.statusText}>{item.status}</Text>
</View>
</View>
);
})}
</View>

</ScrollView>
</SafeAreaView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#F8FAFC' },
topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
welcomeText: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
subWelcome: { fontSize: 13, color: '#64748B' },
avatarCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
avatarInitial: { color: 'white', fontWeight: 'bold' },
categoryWrapper: { marginBottom: 15 },
sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', paddingHorizontal: 20, marginBottom: 12 },
categoryContainer: { paddingHorizontal: 20, gap: 10 },
catBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' },
catBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
catText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
catTextActive: { color: 'white' },
actionSection: { marginBottom: 20 },
randomCard: { backgroundColor: '#1E293B', marginHorizontal: 20, padding: 20, borderRadius: 24, elevation: 4 },
randomCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
randomTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
randomSub: { color: '#94A3B8', fontSize: 12, marginTop: 4, lineHeight: 18 },
iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },

listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
cardContainer: { position: 'relative', marginBottom: 10 },
statusBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
statusText: { fontSize: 10, fontWeight: '800', color: '#64748B' }
});