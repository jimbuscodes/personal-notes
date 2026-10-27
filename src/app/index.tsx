import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [item, setItem] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);

  function addItem() {
    if (item.trim() === "") {
      return;
    }
    setTasks([...tasks, item.trim()]);
    setItem("");
  }

  function deleteItem(index: number) {
    const newTasks = tasks.filter((item, itemIndex) => itemIndex !== index);
    setTasks(newTasks);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Todo List</Text>
        <TextInput
          style={styles.textInputStyle}
          placeholder="Add a task..."
          value={item}
          onChangeText={setItem}
        />
        <Pressable style={styles.button} onPress={addItem}>
          <Text style={styles.buttonText}>New Task</Text>
        </Pressable>
        <FlatList
          style={styles.listContainer}
          data={tasks}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.taskItem,
                colorScheme === "dark" && styles.darkTaskItem,
              ]}
            >
              <Text style={styles.taskText}>{item}</Text>
              <Pressable onPress={() => deleteItem(index)}>
                <Text style={styles.deleteText}>X</Text>
              </Pressable>
            </View>
          )}
        />
      </SafeAreaView>
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
  },
  title: {
    color: "#45c6f1",
    fontSize: 45,
    fontFamily: "futura",
    marginBottom: 20,
    padding: 20,
    textDecorationLine: "underline",
  },
  textInputStyle: {
    color: "#45c6f1",
    borderWidth: 1,
    borderColor: "#45c6f1",
    borderRadius: 15,
    padding: 12,
    width: "100%",
  },
  button: {
    backgroundColor: "#1f8cb0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "futura",
  },
  listContainer: {
    width: "100%",
  },
  deleteText: {
    color: "#fff",
    marginLeft: 15,
    fontSize: 16,
    fontFamily: "futura",
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 15,
    backgroundColor: "#1f8cb0",
    marginTop: 15,
    borderRadius: 5,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  darkTaskItem: {
    boxShadow: "0px 2px 6px rgba(249, 246, 249, 0.65)",
  },
  taskText: {
    fontFamily: "futura",
    fontSize: 16,
    color: "#fff",
    textDecorationLine: "underline",
  },
  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
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
});
