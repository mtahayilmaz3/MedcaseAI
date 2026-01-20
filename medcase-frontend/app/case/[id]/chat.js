import { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, Pressable, FlatList, 
  KeyboardAvoidingView, Platform, ActivityIndicator, 
  StyleSheet, Modal, ScrollView 
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Markdown from 'react-native-markdown-display'; 
// askTutor fonksiyonunu import ettik
import { chatDialogue, getCaseById, askTutor } from "../../../src/api/endpoints"; 
import { Colors } from "../../../src/theme/colors";

export default function CaseChatPage() {
  const { id } = useLocalSearchParams();
  
  // --- STATE TANIMLARI ---
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [isDiscussionClosed, setIsDiscussionClosed] = useState(false);
  const [caseData, setCaseData] = useState(null);
  
  // YENİ: Hangi ajanla konuşuyoruz? 'dialogue' (Varsayılan) veya 'tutor'
  const [activeAgent, setActiveAgent] = useState('dialogue');

  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "Merhaba! Dosyayı inceledim. Ayırıcı tanıların neler? (Simülasyon Modu)",
      sender: 'MedCase AI'
    }
  ]);
  const [followups, setFollowups] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    getCaseById(String(id)).then(setCaseData).catch(console.error);
  }, [id]);

  // --- MESAJ GÖNDERME FONKSİYONU ---
  const send = async (textFromChip) => {
    // Tutor her zaman konuşabilir, Dialogue ise sadece tartışma açıkken konuşur
    if (isDiscussionClosed && activeAgent === 'dialogue') return;
    
    const text = (textFromChip ?? input).trim();
    if (!text || busy) return;

    // Kullanıcı mesajını ekle
    setMessages(p => [...p, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      let res;
      
      // --- AJAN SEÇİM MANTIĞI ---
      if (activeAgent === 'dialogue') {
         // 1. Simülasyon Modu: Dialogue Agent'a sor
         res = await chatDialogue(String(id), text);
      } else {
         // 2. Hoca Modu: Tutor Agent'a sor
         // "explain" modu ile detaylı açıklama istiyoruz
         res = await askTutor(String(id), text, "explain");
      }
      
      // AI cevabını ekle
      setMessages(p => [...p, { 
        role: "ai", 
        text: res.answer || "Cevap alınamadı.",
        // Gönderen ismini moda göre değiştir
        sender: activeAgent === 'tutor' ? 'Prof. AI 🎓' : 'MedCase AI'
      }]);
      
      setFollowups(res.followups || []);

    } catch (e) {
      console.error(e);
      setMessages(p => [...p, { role: "ai", text: "⚠️ Bağlantı hatası oluştu." }]);
    } finally {
      setBusy(false);
    }
  };

  const closeDiscussion = () => {
    setIsDiscussionClosed(true);
    setFollowups([]);
  };

  // Mesaj İçeriği (Markdown vs Text)
  const renderMessageContent = (item) => {
    if (item.role === 'ai') {
      return (
        <View>
          {/* Gönderen İsmi (Örn: Prof. AI) */}
          {item.sender && (
            <Text style={styles.senderName}>{item.sender}</Text>
          )}
          <Markdown 
            style={{
              body: { color: Colors.textMain, fontSize: 15 },
              heading1: { color: Colors.primary, fontWeight: 'bold' },
              strong: { fontWeight: 'bold', color: '#000' }
            }}
          >
            {item.text}
          </Markdown>
        </View>
      );
    }
    return <Text style={styles.userText}>{item.text}</Text>;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      keyboardVerticalOffset={100}
    >
      {/* --- ÜST AKSİYON BARI --- */}
      <View style={styles.topActionHeader}>
        
        {/* Mod Değiştirici (Switch) */}
        <View style={styles.modeSwitchContainer}>
            <Pressable 
                style={[styles.modeBtn, activeAgent === 'dialogue' && styles.modeBtnActive]}
                onPress={() => setActiveAgent('dialogue')}
            >
                <Text style={styles.modeEmoji}>🩺</Text>
            </Pressable>
            <Pressable 
                style={[styles.modeBtn, activeAgent === 'tutor' && styles.modeBtnActive]}
                onPress={() => setActiveAgent('tutor')}
            >
                <Text style={styles.modeEmoji}>🎓</Text>
            </Pressable>
        </View>

        <Pressable style={styles.viewReportBtn} onPress={() => setReportVisible(true)}>
          <Text style={styles.viewReportText}>📄 Rapor</Text>
        </Pressable>
        
        {!isDiscussionClosed ? (
          <Pressable style={styles.closeDiscussionBtn} onPress={closeDiscussion}>
            <Text style={styles.closeDiscussionText}>Bitir</Text>
          </Pressable>
        ) : (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Bitti</Text>
          </View>
        )}
      </View>

      {/* Mesaj Listesi */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.chatPadding}
        renderItem={({ item }) => (
          <View style={[
            styles.bubble, 
            item.role === 'user' ? styles.userBubble : styles.aiBubble,
            // Tutor mesajlarını hafif farklı renklendirebiliriz
            (item.role === 'ai' && item.sender === 'Prof. AI 🎓') && styles.tutorBubbleBorder
          ]}>
            {renderMessageContent(item)}
          </View>
        )}
        ListFooterComponent={() => (
          followups.length > 0 && !busy && (
            <View style={styles.suggestionArea}>
              <Text style={styles.suggestionTitle}>Önerilen Sorular:</Text>
              {followups.map((f, i) => (
                <Pressable key={i} onPress={() => send(f)} style={styles.verticalChip}>
                  <Text style={styles.chipText}>{f}</Text>
                  <Text style={styles.chipArrow}>→</Text>
                </Pressable>
              ))}
            </View>
          )
        )}
      />

      {/* Giriş Alanı */}
      {(!isDiscussionClosed || activeAgent === 'tutor') ? (
        <View style={styles.inputWrapper}>
          <TextInput 
            style={styles.input} 
            // Placeholder moda göre değişsin
            placeholder={activeAgent === 'tutor' ? "Hocaya bir soru sor..." : "Klinik yorumunu yaz..."} 
            value={input} 
            onChangeText={setInput}
            multiline
            editable={!busy}
          />
          <Pressable onPress={() => send()} style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Gönder</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={styles.discussionClosedFooter}>
          <Text style={styles.closedInfoText}>
            Klinik tartışma bitti. Devam etmek için yukarıdan 🎓 Hoca Moduna geçebilirsin.
          </Text>
        </View>
      )}

      {/* Rapor Modalı */}
      <Modal visible={reportVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalWrapper}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vaka Hikayesi</Text>
              <Pressable onPress={() => setReportVisible(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>Kapat</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{padding: 20}}>
              <Text style={styles.reportText}>{caseData?.narrative}</Text>
            </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Header Düzeni
  topActionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border 
  },

  // Mod Switch Stilleri
  modeSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 2,
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeEmoji: {
    fontSize: 18
  },

  // Butonlar
  viewReportBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  viewReportText: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
  closeDiscussionBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  closeDiscussionText: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  closedBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  closedBadgeText: { color: Colors.textSub, fontWeight: '700' },
  
  // Chat Balonları
  chatPadding: { padding: 16, paddingBottom: 30 },
  bubble: { padding: 14, borderRadius: 16, marginBottom: 12, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  
  // Tutor için özel stil (İsteğe bağlı - hafif sarı border)
  tutorBubbleBorder: { borderColor: '#FCD34D', borderWidth: 2 },

  senderName: { fontSize: 11, color: Colors.textSub, fontWeight: 'bold', marginBottom: 4 },
  userText: { color: Colors.white, fontSize: 15, lineHeight: 22 },

  // Öneriler
  suggestionArea: { marginTop: 10, marginBottom: 20 },
  suggestionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textSub, marginBottom: 10, marginLeft: 5 },
  verticalChip: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.white, padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  chipText: { color: Colors.textMain, fontSize: 14, fontWeight: '500', flex: 1 },
  chipArrow: { color: Colors.accent, fontWeight: 'bold', marginLeft: 10 },

  // Input
  inputWrapper: { flexDirection: 'row', padding: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 16 },
  sendBtn: { backgroundColor: Colors.accent, width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  
  // Footer
  discussionClosedFooter: { padding: 25, backgroundColor: '#F1F5F9', alignItems: 'center' },
  closedInfoText: { color: Colors.textSub, fontWeight: '600', fontStyle: 'italic', textAlign: 'center', fontSize: 13 },

  // Modal
  modalWrapper: { flex: 1, backgroundColor: '#fff', marginTop: 20 },
  modalHeader: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeModalBtn: { backgroundColor: '#eee', padding: 8, borderRadius: 8 },
  closeModalText: { fontWeight: 'bold' },
  reportText: { fontSize: 16, lineHeight: 26, color: '#334155' }
});