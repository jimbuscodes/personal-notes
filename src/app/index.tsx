import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { initializeApp } from "firebase/app";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBN6ceHeYNnR6tYdM-gW_sAdLzo5-DN54I",
  authDomain: "webdev-class-setup.firebaseapp.com",
  projectId: "webdev-class-setup",
  storageBucket: "webdev-class-setup.firebasestorage.app",
  messagingSenderId: "187086770371",
  appId: "1:187086770371:web:2737b950e7015cc0a4d276",
  measurementId: "G-ST1HN1H3W9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

type Note = {
  title: string;
  text: string;
  favorite: boolean;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [noteTitle, setNoteTitle] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteFilter, setNoteFilter] = useState<"all" | "favorites">("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, (currentUser) =>
      setUser(currentUser),
    );
    return unSubscribe;
  }, []);

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log(error);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>My Notes</Text>
          <Text style={styles.loginSubtitle}>Login to continue...</Text>

          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            placeholderTextColor={styles.loginPlaceholder.color}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          ></TextInput>

          <TextInput
            style={styles.loginInput}
            placeholder="Password"
            placeholderTextColor={styles.loginPlaceholder.color}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          ></TextInput>

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign in</Text>
          </Pressable>

          <Pressable style={styles.createAccountButton} onPress={handleSignup}>
            <Text style={styles.createAccountButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function saveNote() {
    const trimmedTitle = noteTitle.trim();
    const trimmedNote = note.trim();

    if (trimmedTitle === "" || trimmedNote === "") {
      return;
    }

    if (editingNoteIndex === null) {
      setNotes([
        ...notes,
        { title: trimmedTitle, text: trimmedNote, favorite: false },
      ]);
    } else {
      setNotes(
        notes.map((existingNote, index) =>
          index === editingNoteIndex
            ? { ...existingNote, title: trimmedTitle, text: trimmedNote }
            : existingNote,
        ),
      );
    }

    closeNoteModal();
  }

  function openNoteModal() {
    setModalMode("create");
    setEditingNoteIndex(null);
    setNoteTitle("");
    setNote("");
    setIsModalVisible(true);
  }

  function openEditModal(index: number) {
    setModalMode("edit");
    setEditingNoteIndex(index);
    setNoteTitle(notes[index].title);
    setNote(notes[index].text);
    setIsModalVisible(true);
  }

  function openViewModal(index: number) {
    setModalMode("view");
    setEditingNoteIndex(index);
    setNoteTitle(notes[index].title);
    setNote(notes[index].text);
    setIsModalVisible(true);
  }

  function closeNoteModal() {
    setIsModalVisible(false);
    setNoteTitle("");
    setNote("");
    setEditingNoteIndex(null);
    setModalMode("create");
  }

  function deleteNote(index: number) {
    const newNotes = notes.filter((item, itemIndex) => itemIndex !== index);
    setNotes(newNotes);
  }

  function toggleFavorite(index: number) {
    setNotes(
      notes.map((existingNote, noteIndex) =>
        noteIndex === index
          ? { ...existingNote, favorite: !existingNote.favorite }
          : existingNote,
      ),
    );
  }

  const visibleNotes =
    noteFilter === "favorites" ? notes.filter((item) => item.favorite) : notes;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Personal</Text>
            <Text style={styles.title}>Notes</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text>Logout</Text>
          </Pressable>
        </View>
        <Pressable style={styles.button} onPress={openNoteModal}>
          <Text style={styles.buttonText}>New Note</Text>
        </Pressable>
        <View style={styles.notesHeader}>
          <Text style={styles.notesCount}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Text>
          <View style={styles.filterActions}>
            <Pressable
              style={[
                styles.filterButton,
                noteFilter === "all" && styles.activeFilterButton,
              ]}
              onPress={() => setNoteFilter("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  noteFilter === "all" && styles.activeFilterText,
                ]}
              >
                All
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                noteFilter === "favorites" && styles.activeFilterButton,
              ]}
              onPress={() => setNoteFilter("favorites")}
            >
              <Text
                style={[
                  styles.filterText,
                  noteFilter === "favorites" && styles.activeFilterText,
                ]}
              >
                Favorites
              </Text>
            </Pressable>
          </View>
        </View>
        <FlatList
          style={styles.listContainer}
          data={visibleNotes}
          keyExtractor={(item) => `${item.title}-${item.text}`}
          renderItem={({ item: note }) => (
            <View
              style={[
                styles.noteItem,
                colorScheme === "dark" && styles.darkNoteItem,
              ]}
            >
              <Pressable
                style={styles.noteContent}
                onPress={() => openViewModal(notes.indexOf(note))}
              >
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.notePreview} numberOfLines={2}>
                  {note.text}
                </Text>
              </Pressable>
              <View style={styles.noteActions}>
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(notes.indexOf(note))}
                  accessibilityLabel={
                    note.favorite
                      ? "Remove note from favorites"
                      : "Add note to favorites"
                  }
                >
                  <Text
                    style={[
                      styles.favoriteText,
                      note.favorite && styles.favoriteTextActive,
                    ]}
                  >
                    {note.favorite ? "★" : "☆"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.editButton}
                  onPress={() => openEditModal(notes.indexOf(note))}
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteNote(notes.indexOf(note))}
                >
                  <Text style={styles.deleteText}>X</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeNoteModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalMode === "create"
                ? "New Note"
                : modalMode === "edit"
                  ? "Edit Note"
                  : noteTitle}
            </Text>

            {modalMode === "view" ? (
              <Text style={styles.fullNoteText}>{note}</Text>
            ) : (
              <>
                <TextInput
                  style={styles.noteTitleInput}
                  placeholder="Note title"
                  placeholderTextColor="#9aa3b2"
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  autoFocus
                />
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write your note..."
                  placeholderTextColor="#9aa3b2"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                />
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={closeNoteModal}>
                <Text style={styles.cancelButtonText}>
                  {modalMode === "view" ? "Close" : "Cancel"}
                </Text>
              </Pressable>

              {modalMode !== "view" && (
                <Pressable style={styles.saveButton} onPress={saveNote}>
                  <Text style={styles.saveButtonText}>
                    {modalMode === "create" ? "Save Note" : "Save Changes"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    backgroundColor: "#f8f8f8",
    paddingLeft: 20,
    paddingRight: 20,
  },
  titleContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  title: {
    color: "#222",
    fontSize: 45,
    fontFamily: "futura",
    paddingLeft: 20,
    textDecorationLine: "underline",
  },
  textInputStyle: {
    color: "#222",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 15,
    padding: 12,
    width: "100%",
  },
  button: {
    backgroundColor: "#222",
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 10,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: "#d55",
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 5,
    marginBottom: 5,
    position: "absolute",
    right: 0,
    bottom: 40,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "futura",
  },
  listContainer: {
    width: "100%",
  },
  notesHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notesCount: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  filterActions: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#e5e5e5",
  },
  activeFilterButton: {
    backgroundColor: "#222",
  },
  filterText: {
    color: "#555",
    fontSize: 12,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#fff",
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "futura",
  },
  deleteButton: {
    padding: 6,
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteText: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 26,
  },
  favoriteTextActive: {
    color: "#ffd166",
  },
  editButton: {
    backgroundColor: "#d55",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  editText: {
    color: "#222",
    fontSize: 13,
    fontWeight: "600",
  },
  noteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 15,
    backgroundColor: "#222",
    marginTop: 15,
    borderRadius: 5,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  darkNoteItem: {
    backgroundColor: "#333",
    boxShadow: "0px 2px 6px rgba(249, 246, 249, 0.65)",
  },
  noteContent: {
    flex: 1,
    minWidth: 0,
  },
  noteTitle: {
    fontFamily: "futura",
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  notePreview: {
    fontFamily: "futura",
    fontSize: 14,
    color: "#fff",
    marginTop: 4,
    opacity: 0.75,
  },
  noteTitleInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#222",
    marginBottom: 12,
  },
  fullNoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#222",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noteInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#222",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: "#222",
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  heroSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
  },

  code: {
    textTransform: "uppercase",
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: "stretch",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: "#668",
    marginBottom: 24,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: "#668",
  },
  loginPlaceholder: {
    color: "#9aa3b2",
  },
  loginButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  createAccountButton: {
    backgroundColor: "#d55",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    marginLeft: 10,
  },
  createAccountButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
