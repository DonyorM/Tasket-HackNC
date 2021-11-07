import {
  Button,
  Container,
  Box,
  Paper,
  Typography,
  ThemeProvider,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField
} from "@mui/material";
import {
  doc,
  collection,
  getFirestore,
  query,
  where,
  updateDoc,
} from "@firebase/firestore";
import { DataGrid } from "@mui/x-data-grid";
import {
  useDocument,
  useCollection,
} from "react-firebase-hooks/firestore";
import { getAuth } from "@firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import theme from "../Themes";
import moment from "moment";
import { Fragment, useEffect, useState } from "react";

const db = getFirestore();
const auth = getAuth();
const functions = getFunctions();
const getUser = httpsCallable(functions, "getUser");

const padding = {mt: 1, mb: 1};

//https://stackoverflow.com/a/1527820/2719960
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function MemberDialog({ open, handleClose, members, setMembers, group }) {
  const [email, setEmail] = useState("");
  function updateEmail(e) {
    setEmail(e.target.value);
  }
  function addMember() {
    const newMembers = [...group.data().members, email];
    updateDoc(group.ref, {
      members: newMembers
    });
    handleClose();
  }
  return (
    <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Subscribe</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Enter the email of the new member
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Email Address"
        type="email"
        fullWidth
        variant="standard"
        onChange={updateEmail}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={addMember}>Add Member</Button>
    </DialogActions>
  </Dialog>
  );
}

function Group({ groupName, email, onClose }) {
  const [group, groupLoading, groupError] = useDocument(
    doc(db, "groups", groupName)
  );
  const [taskDocs, tasksLoading, tasksError] = useCollection(
    query(collection(db, "tasks"), where("group", "==", groupName))
  );
  const [viewMembers, setViewMembers] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(async () => {
    if (!group) {
      return;
    }
    const members = await Promise.all(
      group.data().members.map(async (email) => {
        const result = await getUser({ email: email });
        return result.data.name ? result.data.name : "Error getting name";
      })
    );
    setMemberList(members);
  }, [group]);

  if (groupLoading || tasksLoading) {
    return <Typography variant="body">Loading...</Typography>;
  }
  const groupData = group.data();

  const isAdmin = groupData.admin == email;
  const taskData = taskDocs.docs.map((doc) => doc.data());
  const yourTask = taskData.filter((task) => task.assigned == email)[0];

  const rows = taskData
    .map((task, index) => {
      const startDate = groupData.activeDate
        ? moment(groupData.activeDate, "YYYY-MM-DD")
        : moment();
      const dueDate = startDate
        .clone()
        .weekday(task.weekday ? task.weekday : 6);
      let taskState = "Incomplete";
      if (task.completed) {
        taskState = "Completed";
      } else if (moment().isAfter(dueDate, "day")) {
        taskState = "Overdue";
      }
      return {
        id: task.assigned ? task.assigned : index,
        task: task.name,
        assigned: task.assignedName ? task.assignedName : "Task Unassigned",
        completed: taskState,
        dueDate: dueDate.format("MM/DD"),
      };
    });

  const assignTasks = async () => {
    const members = [...groupData.members];
    taskDocs.forEach((doc) => {
      let newMember = null;
      if (members.length > 0) {
        newMember = members.splice(getRandomInt(0, members.length - 1), 1)[0];
      }
      let assignedName = null;

      function actuallyUpdate() {
        updateDoc(doc.ref, {
          assigned: newMember,
          assignedName: assignedName,
          completed: false,
          activeDate: moment().weekday(0).format("YYYY-MM-DD"),
        });
      }

      if (newMember) {
        getUser({ email: newMember }).then((record) => {
          assignedName = record.data.name
            ? record.data.name
            : "Error Finding User";
          actuallyUpdate();
        });
      } else {
        actuallyUpdate();
      }
    });
  };

  const completeTask = () => {
    const yourTaskDoc = taskDocs.docs.filter(
      (task) => task.data().assigned == email
    )[0];
    updateDoc(yourTaskDoc.ref, {
      completed: true,
    });
  };

  const columns = [
    {
      field: "task",
      headerName: "Task",
      flex: 0.5,
    },
    {
      field: "assigned",
      headerName: "Assigned",
      flex: 0.3,
    },
    {
      field: "completed",
      headerName: "Completed",
      flex: 0.1,
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      flex: 0.1,
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography sx={padding} variant="h3">{groupName}</Typography>
      {isAdmin ? (
        <Button onClick={assignTasks} variant="contained">
          Assign Tasks
        </Button>
      ) : (
        ""
      )}
      <Box sx={padding} >
        <Typography variant="h4">
          Your Task: {yourTask ? yourTask.name : "Tasks not assigned"}
        </Typography>
      </Box>
      {yourTask ? (
        <Box sx={{ display: "flex", justifyContent: "space-evenly", mt:1, mb: 1 }}>
          <Typography variant="body">
            Task Status: {yourTask.completed ? "Complete!" : "Incomplete"}
          </Typography>
          {!yourTask.completed ? (
            <Button variant="contained" onClick={completeTask}>
              Mark Task Complete
            </Button>
          ) : (
            ""
          )}
        </Box>
      ) : (
        ""
      )}
      <Divider sx={padding}  />
      <Typography sx={padding}  variant="h5" sx={{ alignSelf: "flex-start" }}>
        Tasks
      </Typography>
      <DataGrid sx={padding} 
        rows={rows}
        columns={columns}
        style={{ height: "400px", width: "100%" }}
      />
      {viewMembers ? (
        <Fragment>
          <Typography sx={padding}  variant="h5">Members</Typography>
          <List sx={{borderRadius: 1, border: 1, borderColor: 'grey.300', mt: 1, mb: 1}}>
            {memberList.map((member) => {
              return (
                <Fragment>
                  <ListItem>
                    <ListItemText primary={member} />
                  </ListItem>
                  <Divider />
                </Fragment>
              );
            })}
          </List>
          <Box sx={{display: "flex", justifyContent: "flex-end", mt: 1, mb: 1}}>
            <Button variant="contained" onClick={() => setShowAddMember(true)}>Add Member</Button>
          </Box>
        </Fragment>
      ) : (
        ""
      )}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, mb: 1 }}>
        <Box sx={{ display: "flex" }}>
          <Button
            variant="contained"
            onClick={() => setViewMembers(!viewMembers)}
          >
            {viewMembers ? "Hide" : "Show"} Members
          </Button>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={() => (onClose ? onClose() : "")}
          >
            Back
          </Button>
        </Box>
      </Box>
      <MemberDialog open={showAddMember} handleClose={setShowAddMember} members={memberList} setMembers={setMemberList} group={group} />
    </Paper>
  );
}

export default Group;
