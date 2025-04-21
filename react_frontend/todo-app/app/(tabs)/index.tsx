import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Switch } from "react-native";
import { StyleSheet } from "react-native";

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
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem("darkMode") === "true");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  const API_URL = "https://mobile-act-appdev.onrender.com/todos/";

  // Fetch tasks from backend on mount
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

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={styles.title}>React Native TODO App</Text>

      <View style={styles.switchContainer}>
        <Text>{darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</Text>
        <Switch value={darkMode} onValueChange={() => setDarkMode(!darkMode)} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Add a new task"
        value={taskInput}
        onChangeText={setTaskInput}
      />
      <Button title="Add Task" onPress={addTask} />

      <View style={styles.filterButtons}>
        <TouchableOpacity onPress={() => setFilter("all")} style={styles.filterButton}>
          <Text>All ({tasks.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("completed")} style={styles.filterButton}>
          <Text>Completed ({tasks.filter((task) => task.completed).length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("pending")} style={styles.filterButton}>
          <Text>Pending ({tasks.filter((task) => !task.completed).length})</Text>
        </TouchableOpacity>
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
              <Text style={item.completed ? styles.completedTask : undefined}>{item.title}</Text>
            )}
            <View style={styles.taskActions}>
              {editingId === item.id ? (
                <Button title="💾" onPress={() => saveEdit(item.id)} />
              ) : (
                !item.completed && (
                  <Button title="✏️" onPress={() => enableEditing(item.id, item.title)} />
                )
              )}
              <Button title="❌" onPress={() => deleteTask(item.id)} />
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
    fontSize: 24,
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
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterButton: {
    padding: 10,
    backgroundColor: "#ddd",
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
  editInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    marginRight: 10,
    flex: 1,
  },
});

export default App;
