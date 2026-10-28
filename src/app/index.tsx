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
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
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

function requiredFirebaseEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    "EXPO_PUBLIC_FIREBASE_API_KEY",
  ),
  authDomain: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  ),
  projectId: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  ),
  storageBucket: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ),
  messagingSenderId: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ),
  measurementId: requiredFirebaseEnv(
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID",
  ),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

type Note = {
  id: string;
  title: string;
  text: string;
  favorite: boolean;
  createdAt: Timestamp | null;
};

function formatNoteDate(createdAt: Timestamp | null) {
  return createdAt ? createdAt.toDate().toLocaleDateString() : "Saving...";
}

function getFirestoreErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return fallback;
  }

  switch (String(error.code)) {
    case "permission-denied":
      return "Firestore denied this request. Deploy firestore.rules and verify you are signed in.";
    case "failed-precondition":
      return "Firestore is not enabled for the webdev-class-setup project.";
    case "unauthenticated":
      return "Your session expired. Sign in again before saving.";
    default:
      return `${fallback} (${String(error.code)})`;
  }
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [noteTitle, setNoteTitle] = useState("");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesError, setNotesError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
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

  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    setNotesError("");
    const notesQuery = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
    );

    return onSnapshot(
      notesQuery,
      (snapshot) => {
        const loadedNotes = snapshot.docs
          .map((noteDocument) => {
            const data = noteDocument.data();
            return {
              id: noteDocument.id,
              title: String(data.title ?? ""),
              text: String(data.content ?? ""),
              favorite: data.favorite === true,
              createdAt: (data.createdAt as Timestamp | null) ?? null,
            };
          })
          .sort(
            (first, second) =>
              (second.createdAt?.toMillis() ?? 0) -
              (first.createdAt?.toMillis() ?? 0),
          );
        setNotes(loadedNotes);
      },
      (error) => {
        setNotesError(
          getFirestoreErrorMessage(error, "Unable to load your notes."),
        );
      },
    );
  }, [user]);

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

  async function saveNote() {
    const trimmedTitle = noteTitle.trim();
    const trimmedNote = note.trim();

    if (!user) {
      setNotesError("You must be signed in to save a note.");
      return;
    }

    if (trimmedTitle === "" || trimmedNote === "") {
      setNotesError("Enter both a note title and note content.");
      return;
    }

    setNotesError("");
    setIsSavingNote(true);

    if (editingNoteIndex === null) {
      try {
        await addDoc(collection(db, "notes"), {
          title: trimmedTitle,
          content: trimmedNote,
          favorite: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        setNotesError(
          getFirestoreErrorMessage(error, "Unable to save the note."),
        );
        setIsSavingNote(false);
        return;
      }
    } else {
      const existingNote = notes[editingNoteIndex];
      if (!existingNote) {
        return;
      }

      try {
        await updateDoc(doc(db, "notes", existingNote.id), {
          title: trimmedTitle,
          content: trimmedNote,
        });
      } catch (error) {
        setNotesError(
          getFirestoreErrorMessage(error, "Unable to update the note."),
        );
        setIsSavingNote(false);
        return;
      }
    }

    setIsSavingNote(false);
    closeNoteModal();
  }

  function openNoteModal() {
    setNotesError("");
    setModalMode("create");
    setEditingNoteIndex(null);
    setNoteTitle("");
    setNote("");
    setIsModalVisible(true);
  }

  function openEditModal(index: number) {
    setNotesError("");
    setModalMode("edit");
    setEditingNoteIndex(index);
    setNoteTitle(notes[index].title);
    setNote(notes[index].text);
    setIsModalVisible(true);
  }

  function openViewModal(index: number) {
    setNotesError("");
    setModalMode("view");
    setEditingNoteIndex(index);
    setNoteTitle(notes[index].title);
    setNote(notes[index].text);
    setIsModalVisible(true);
  }

  function closeNoteModal() {
    setIsModalVisible(false);
    setIsSavingNote(false);
    setNotesError("");
    setNoteTitle("");
    setNote("");
    setEditingNoteIndex(null);
    setModalMode("create");
  }

  async function deleteNote(noteId: string) {
    try {
      await deleteDoc(doc(db, "notes", noteId));
    } catch (error) {
      setNotesError(
        getFirestoreErrorMessage(error, "Unable to delete the note."),
      );
    }
  }

  async function toggleFavorite(noteId: string, favorite: boolean) {
    try {
      await updateDoc(doc(db, "notes", noteId), { favorite: !favorite });
    } catch (error) {
      setNotesError(
        getFirestoreErrorMessage(error, "Unable to update favorite status."),
      );
    }
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
          <View style={styles.notesCountBadge}>
            <Text style={styles.notesCountLabel}>Total notes</Text>
            <Text style={styles.notesCount}>{notes.length}</Text>
          </View>
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
        {notesError ? (
          <Text style={styles.notesError}>{notesError}</Text>
        ) : null}
        <FlatList
          style={styles.listContainer}
          data={visibleNotes}
          keyExtractor={(item) => item.id}
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
                <Text style={styles.noteDate}>
                  {formatNoteDate(note.createdAt)}
                </Text>
              </Pressable>
              <View style={styles.noteActions}>
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(note.id, note.favorite)}
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
                  onPress={() => deleteNote(note.id)}
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

            {notesError ? (
              <Text style={styles.modalError}>{notesError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={closeNoteModal}
                disabled={isSavingNote}
              >
                <Text style={styles.cancelButtonText}>
                  {modalMode === "view" ? "Close" : "Cancel"}
                </Text>
              </Pressable>

              {modalMode !== "view" && (
                <Pressable
                  style={styles.saveButton}
                  onPress={saveNote}
                  disabled={isSavingNote}
                >
                  <Text style={styles.saveButtonText}>
                    {isSavingNote
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Save Note"
                        : "Save Changes"}
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
    color: "#222",
    fontSize: 14,
    fontWeight: "700",
  },
  notesCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#e5e5e5",
  },
  notesCountLabel: {
    color: "#666",
    fontSize: 12,
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
    color: "#222",
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
    backgroundColor: "#fff",
    marginTop: 15,
    borderRadius: 5,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  darkNoteItem: {
    backgroundColor: "#fff",
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
    color: "#222",
  },
  notePreview: {
    fontFamily: "futura",
    fontSize: 14,
    color: "#222",
    marginTop: 4,
    opacity: 0.75,
  },
  noteDate: {
    fontSize: 11,
    color: "#222",
    marginTop: 6,
    opacity: 0.6,
  },
  notesError: {
    width: "100%",
    color: "#b42318",
    fontSize: 13,
    marginBottom: 4,
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
  modalError: {
    color: "#b42318",
    fontSize: 13,
    marginTop: 12,
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
