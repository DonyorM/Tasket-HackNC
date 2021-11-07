import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  Paper,
  Typography,
  ListItemButton,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import {
  doc,
  setDoc,
  getFirestore,
  addDoc,
  collection,
  getDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { HOME } from "../States";

const db = getFirestore();
const auth = getAuth();

const boxStyle = {
  display: "flex",
  flexDirection: "column",
  mt: 2,
  mb: 2,
};

const paddingStyle = {
  m: 2,
};

function TaskDialog({ open, handleClose, tasks, setTasks }) {
  const [name, setName] = useState("");
  const [weekday, setWeekday] = useState(null);
  const addTask = () => {
    const newTasks = [...tasks, { name: name, weekday: weekday }];
    setTasks(newTasks);
    setName("");
    setWeekday(null);
    handleClose();
  };
  function updateName(e) {
    setName(e.target.value);
  }
  function handleWeekDayChange(e) {
      setWeekday(e.target.value);
  }
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Create Task</DialogTitle>
      <DialogContent>
        <DialogContentText>Enter the task name</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Task Name"
          fullWidth
          variant="standard"
          value={name}
          onChange={updateName}
        />
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Due Day of the Week</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={weekday}
            label="Age"
            onChange={handleWeekDayChange}
          >
            <MenuItem value={0}>Sunday</MenuItem>
            <MenuItem value={1}>Monday</MenuItem>
            <MenuItem value={2}>Tuesday</MenuItem>
            <MenuItem value={3}>Wednesday</MenuItem>
            <MenuItem value={4}>Thursday</MenuItem>
            <MenuItem value={5}>Friday</MenuItem>
            <MenuItem value={6}>Saturday</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={addTask}>Add Task</Button>
      </DialogActions>
    </Dialog>
  );
}

function CreateGroup({ setCurrentState }) {
  const [user, loading, error] = useAuthState(auth);
  const [tasks, setTasks] = useState([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");

  async function saveTask(task) {
    await addDoc(collection(db, "tasks"), {
      ...task,
      group: groupName,
    });
  }

  async function saveGroup() {
    const groupRef = doc(db, "groups", groupName);
    const memberList = members.split(",");
    memberList.push(user.email);

    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      alert("That name is already used for a group, choose a new one");
      return;
    } else {
      setDoc(groupRef, {
        name: groupName,
        admin: user.email,
        members: memberList,
      });
    }

    tasks.forEach((task) => {
      saveTask(task);
    });

    setCurrentState(HOME);
  }

  function removeTask(index) {
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  }

  return (
    <Paper sx={boxStyle} component="form">
      <TextField
        label="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        sx={paddingStyle}
      />
      <TextField
        label="Members"
        helperText="A comma separated list of member emails"
        value={members}
        onChange={(e) => setMembers(e.target.value)}
        sx={paddingStyle}
      />
      <Typography variant="h6">Tasks</Typography>
      <List sx={paddingStyle}>
        {tasks.map((task, idx) => {
          return (
            <ListItem
              key={idx}
              secondaryAction={
                <IconButton onClick={() => removeTask(idx)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={task.name} />
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <Button onClick={() => setTaskOpen(true)} sx={paddingStyle}>
          Add Task
        </Button>
      </Box>
      <TaskDialog
        open={taskOpen}
        handleClose={() => setTaskOpen(false)}
        tasks={tasks}
        setTasks={setTasks}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={saveGroup}>Save Group</Button>
        <Button onClick={() => setCurrentState(HOME)}>Back</Button>
      </Box>
    </Paper>
  );
}

export default CreateGroup;
