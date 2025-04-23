import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Switch, StyleSheet } from "react-native";

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

type Filter = "all" | "completed" | "pending";

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [taskInput, setTaskInput] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  const API_URL = "https://mobile-act-appdev.onrender.com/todos/";

  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const storedValue = await AsyncStorage.getItem("darkMode");
        if (storedValue !== null) {
          setDarkMode(storedValue === "true");
        }
      } catch (e) {
        console.error("Failed to load dark mode:", e);
      }
    };

    loadDarkMode();
  }, []);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: Task[]) => setTasks(data))
      .catch((err) => console.error("Error fetching todos:", err));
  }, []);

  const addTask = () => {
    if (taskInput.trim() !== "") {
      const newTask = { title: taskInput, completed: false };
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      })
        .then((res) => res.json())
        .then((createdTask: Task) => {
          setTasks([...tasks, createdTask]);
          setTaskInput("");
        })
        .catch((err) => console.error("Error adding task:", err));
    }
  };

  const toggleTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed };

    fetch(`${API_URL}${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    })
      .then((res) => res.json())
      .then((data: Task) => {
        setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
      })
      .catch((err) => console.error("Error toggling task:", err));
  };

  const deleteTask = (taskId: number) => {
    fetch(`${API_URL}${taskId}`, { method: "DELETE" })
      .then(() => setTasks(tasks.filter((task) => task.id !== taskId)))
      .catch((err) => console.error("Error deleting task:", err));
  };

  const enableEditing = (taskId: number, title: string) => {
    setEditingId(taskId);
    setEditText(title);
  };

  const saveEdit = (taskId: number) => {
    const updatedTask = tasks.find((task) => task.id === taskId);
    if (!updatedTask) return;

    const updatedData = { ...updatedTask, title: editText };

    fetch(`${API_URL}${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    })
      .then((res) => res.json())
      .then((data: Task) => {
        setTasks(tasks.map((task) => (task.id === taskId ? data : task)));
        setEditingId(null);
      })
      .catch((err) => console.error("Error saving edit:", err));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const textColor = { color: darkMode ? "#fff" : "#000" };
  const backgroundColor = darkMode ? "#555" : "#ddd";

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.title, textColor]}>To-do List App</Text>

      <View style={styles.switchContainer}>
        <Text style={textColor}>{darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</Text>
        <Switch
          value={darkMode}
          onValueChange={async () => {
            const newValue = !darkMode;
            setDarkMode(newValue);
            await AsyncStorage.setItem("darkMode", newValue.toString());
          }}
        />
      </View>

      <TextInput
        style={[styles.input, textColor, { borderColor: darkMode ? "#aaa" : "#ccc" }]}
        placeholder="Add a new task"
        placeholderTextColor={darkMode ? "#aaa" : "#888"}
        value={taskInput}
        onChangeText={setTaskInput}
      />

      <TouchableOpacity
        style={[styles.customButton, { backgroundColor }]}
        onPress={addTask}
      >
        <Text style={textColor}>Add Task</Text>
      </TouchableOpacity>

      <View style={styles.filterButtons}>
        {["all", "completed", "pending"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f as Filter)}
            style={[styles.filterButton, { backgroundColor }]}
          >
            <Text style={textColor}>
              {f.charAt(0).toUpperCase() + f.slice(1)} (
              {
                f === "completed"
                  ? tasks.filter((t) => t.completed).length
                  : f === "pending"
                  ? tasks.filter((t) => !t.completed).length
                  : tasks.length
              })
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Switch
              value={item.completed}
              onValueChange={() => toggleTask(item.id)}
            />
            {editingId === item.id ? (
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
              />
            ) : (
              <Text
                style={[
                  item.completed ? styles.completedTask : undefined,
                  textColor, // This applies the correct text color
                ]}
              >
                {item.title}
              </Text>
            )}
            <View style={styles.taskActions}>
              {editingId === item.id ? (
                <TouchableOpacity onPress={() => saveEdit(item.id)} style={styles.actionButton}>
                  <Text style={textColor}>💾</Text>
                </TouchableOpacity>
              ) : (
                !item.completed && (
                  <TouchableOpacity
                    onPress={() => enableEditing(item.id, item.title)}
                    style={styles.actionButton}
                  >
                    <Text style={textColor}>✏️</Text>
                  </TouchableOpacity>
                )
              )}
              <TouchableOpacity
                onPress={() => deleteTask(item.id)}
                style={styles.actionButton}
              >
                <Text style={textColor}>❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  title: {
    fontSize: 25,
    padding: 50,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  customButton: {
    alignItems: "center",
    padding: 12,
    borderRadius: 5,
    marginBottom: 20,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterButton: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  actionButton: {
    padding: 5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    marginRight: 10,
    flex: 1,
  },
});

export default App;
