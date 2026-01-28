import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  Keyboard
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Markdown from 'react-native-markdown-display';
import { chatDialogue, getCaseById } from "../../../src/api/endpoints";
import { Colors } from "../../../src/theme/colors";

// --- RENK VE EMOJİ AYARLARI ---
const MODE_CONFIG = {
  hint: {
    id: "hint",
    label: "Hint",
    desc: "Get a guiding clue",
    emoji: "💡",
    colors: {
      main: "#F59E0B",
      bg: "#FFFBEB",
      border: "#FCD34D",
      dark: "#B45309",
      btnBg: "#FEF3C7"
    }
  },
  explain: {
    id: "explain",
    label: "Explain",
    desc: "Understand the logic",
    emoji: "📖",
    colors: {
      main: "#3B82F6",
      bg: "#EFF6FF",
      border: "#93C5FD",
      dark: "#1D4ED8",
      btnBg: "#DBEAFE"
    }
  },
  teach: {
    id: "teach",
    label: "Teach",
    desc: "Deep dive lesson",
    emoji: "🎓",
    colors: {
      main: "#8B5CF6",
      bg: "#F3E8FF",
      border: "#C4B5FD",
      dark: "#6D28D9",
      btnBg: "#EDE9FE"
    }
  }
};

const MODE_OPTIONS = [MODE_CONFIG.hint, MODE_CONFIG.explain, MODE_CONFIG.teach];

export default function CaseChatPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [isDiscussionClosed, setIsDiscussionClosed] = useState(false);
  const [caseData, setCaseData] = useState(null);

  const [mode, setMode] = useState("hint"); 
  const [userLevel, setUserLevel] = useState("beginner"); 
  const [language, setLanguage] = useState("en"); 

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "I have reviewed the file. You can share your analysis or ask about specific tests.",
      mode: "neutral" 
    },
  ]);
  const [followups, setFollowups] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    getCaseById(String(id)).then(setCaseData).catch(console.error);

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    return () => keyboardDidShowListener.remove();
  }, [id]);

  const send = async (textFromChip) => {
    if (isDiscussionClosed) return;
    const text = (textFromChip ?? input).trim();
    if (!text || busy) return;

    setMessages((p) => [...p, { role: "user", text }]);
    setInput("");
    setBusy(true);

    const currentMode = mode; 

    try {
      const res = await chatDialogue(
        String(id),
        text,
        currentMode,
        userLevel,
        language,
      );

      const answerText =
        typeof res?.answer === "string"
          ? res.answer
          : JSON.stringify(res?.answer ?? "Analysis complete.");

      setMessages((p) => [...p, { role: "ai", text: answerText, mode: currentMode }]);
      setFollowups(res.followups || []);
    } catch (e) {
      setMessages((p) => [
        ...p,
        { role: "ai", text: "Connection error occurred.", mode: "neutral" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const closeDiscussion = () => {
    setIsDiscussionClosed(true);
    setFollowups([]);
  };

  const onChangeMode = (newMode) => {
    setMode(newMode);
    setFollowups([]);
  };

  const renderMessageContent = (item) => {
    if (item.role === 'ai') {
      return (
        <View style={{ width: '100%' }}>
          <Markdown style={markdownStyles}>
            {item.text}
          </Markdown>
        </View>
      );
    }
    return <Text style={styles.userText}>{item.text}</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 1. HEADER (SABİT) */}
      <View style={styles.topActionHeader}>
        <View style={styles.headerLeftGroup}>
          {/* ✅ GERİ DÖNME BUTONU */}
          <Pressable 
            onPress={() => router.push(`/case/${id}`)} 
            style={styles.backBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.accent} />
          </Pressable>
          
          <Pressable
            style={styles.viewReportBtn}
            onPress={() => setReportVisible(true)}
          >
            <Text style={styles.viewReportText}>📄 Report</Text>
          </Pressable>
        </View>

    
      </View>

      {/* 2. KLAVYE ALANI (ESNEK) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
          
          {/* Mode Seçimi */}
          <View style={styles.modeBar}>
            {MODE_OPTIONS.map((m) => {
              const active = mode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => onChangeMode(m.id)}
                  style={({ pressed }) => [
                    styles.modeChip,
                    { 
                      backgroundColor: active ? m.colors.btnBg : Colors.white,
                      borderColor: active ? m.colors.main : Colors.border,
                      opacity: pressed ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                  disabled={busy}
                >
                  <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.modeChipText,
                      { color: active ? m.colors.dark : Colors.textSub }
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          
          <Text style={styles.modeHintText}>
            Mode:{" "}
            <Text style={{ fontWeight: "800", color: MODE_CONFIG[mode].colors.dark }}>
              {MODE_CONFIG[mode].desc}
            </Text>
          </Text>

          {/* Chat Listesi */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            style={{ flex: 1 }} // Listeye esneklik ver
            contentContainerStyle={styles.chatPadding}
            onContentSizeChange={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 50);
            }}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardDismissMode="on-drag" 
            renderItem={({ item }) => {
              const isUser = item.role === "user";
              let bubbleStyle = styles.aiBubble;

              if (!isUser && item.mode && MODE_CONFIG[item.mode]) {
                 const conf = MODE_CONFIG[item.mode].colors;
                 bubbleStyle = {
                   ...styles.aiBubble,
                   backgroundColor: conf.bg,
                   borderColor: conf.border,
                 };
              }

              return (
                <View style={[styles.bubble, isUser ? styles.userBubble : bubbleStyle]}>
                  {renderMessageContent(item)}
                </View>
              );
            }}
            ListFooterComponent={() =>
              followups.length > 0 &&
              !busy && (
                <View style={styles.suggestionArea}>
                  <Text style={styles.suggestionTitle}>Suggested Questions:</Text>
                  {followups.map((f, i) => (
                    <Pressable
                      key={i}
                      onPress={() => send(f)}
                      style={styles.verticalChip}
                    >
                      <Text style={styles.chipText}>{f}</Text>
                      <Text style={styles.chipArrow}>→</Text>
                    </Pressable>
                  ))}
                </View>
              )
            }
          />

          {/* ✅ 3. INPUT ALANI (SEND BUTONU BURADA) */}
          {!isDiscussionClosed ? (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type your analysis..."
                value={input}
                onChangeText={setInput}
                multiline
                editable={!busy}
              />
              <Pressable
                onPress={() => send()}
                style={[
                  styles.sendBtn, 
                  !input.trim() && { opacity: 0.5 },
                  { backgroundColor: MODE_CONFIG[mode].colors.main }
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.discussionClosedFooter}>
              <Text style={styles.closedInfoText}>
                This discussion has ended.
              </Text>
            </View>
          )}

        </View> 
      </KeyboardAvoidingView>

      {/* Modal */}
      <Modal visible={reportVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clinical File</Text>
              <Pressable onPress={() => setReportVisible(false)} hitSlop={20}>
                <Text style={styles.closeModalBtn}>Close</Text>
              </Pressable>
            </View>
            <ScrollView>
              <Text style={styles.reportText}>{caseData?.narrative}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const markdownStyles = {
  body: { fontSize: 15, lineHeight: 24, color: Colors.textMain, width: '100%' },
  paragraph: { flexWrap: 'wrap', marginBottom: 10, width: '100%' },
  list_item: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, width: '100%' },
  bullet_list: { marginBottom: 10, width: '100%' },
  heading1: { color: Colors.primary, fontWeight: 'bold', fontSize: 17, marginTop: 10 },
  heading2: { color: Colors.textMain, fontWeight: 'bold', fontSize: 16, marginTop: 8 },
  strong: { fontWeight: 'bold', color: '#000' },
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  
  topActionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center', 
    padding: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  viewReportBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewReportText: { color: Colors.accent, fontWeight: "700" },
  closeDiscussionBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },

  modeBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: Colors.background,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: 'center',
    borderColor: Colors.border, 
    backgroundColor: Colors.white,
  },
  modeChipText: { 
    fontWeight: "800", 
    fontSize: 13 
  },

  modeHintText: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    color: Colors.textSub,
    fontSize: 12,
    fontStyle: 'italic'
  },

  chatPadding: { padding: 16, paddingBottom: 20 },
  
  bubble: { 
    padding: 14, 
    borderRadius: 20, 
    marginBottom: 12, 
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    maxWidth: "85%", 
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white, 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '75%',
    maxWidth: '90%', 
  },
  
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: Colors.white, fontSize: 15 },
  aiText: { color: Colors.textMain },

  suggestionArea: { marginTop: 10, marginBottom: 20 },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textSub,
    marginBottom: 10,
    marginLeft: 5,
  },
  verticalChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  chipText: {
    color: Colors.textMain,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  chipArrow: { color: Colors.accent, fontWeight: "bold", marginLeft: 10 },

  inputWrapper: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendText: { color: "#fff", fontWeight: "bold" },

  discussionClosedFooter: {
    padding: 25,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  closedInfoText: {
    color: Colors.textSub,
    fontWeight: "600",
    fontStyle: "italic",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 25,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeModalBtn: { color: Colors.danger, fontWeight: "bold" },
  reportText: { fontSize: 15, lineHeight: 24, color: "#334155" },
});