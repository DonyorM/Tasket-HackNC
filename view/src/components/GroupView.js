import {
  Button,
  Container,
  Box,
  Paper,
  Typography,
  ThemeProvider,
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
  useDocumentDataOnce,
  useCollection,
} from "react-firebase-hooks/firestore";
import { getAuth } from "@firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import theme from "../Themes";
import moment from "moment";

const db = getFirestore();
const auth = getAuth();
const functions = getFunctions();
const getUser = httpsCallable(functions, "getUser");

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

function Group({ groupName, email, onClose }) {
  const [groupData, groupLoading, groupError] = useDocumentDataOnce(
    doc(db, "groups", groupName)
  );
  const [taskDocs, tasksLoading, tasksError] = useCollection(
    query(collection(db, "tasks"), where("group", "==", groupName))
  );

  if (groupLoading || tasksLoading) {
    return <Typography variant="body">Loading...</Typography>;
  }

  const isAdmin = groupData.admin == email;
  const taskData = taskDocs.docs.map((doc) => doc.data());
  const yourTask = taskData.filter((task) => task.assigned == email)[0];

  const rows = taskData
    .filter((task) => task.assigned != email)
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
    <Paper>
      <Typography variant="h3">{groupName}</Typography>
      {isAdmin ? (
        <Button onClick={assignTasks} variant="contained">
          Assign Tasks
        </Button>
      ) : (
        ""
      )}
      <Box>
        <Typography variant="h4">
          Your Task: {yourTask ? yourTask.name : "Tasks not assigned"}
        </Typography>
      </Box>
      {yourTask ? (
        <Box sx={{ display: "flex", justifyContent: "space-evenly" }}>
          <Typography variant="body">
            Task Status: {yourTask.completed ? "Complete!" : "Incomplete"}
          </Typography>
          {!yourTask.completed ? (
            <Button variant="contained" onClick={completeTask}>
              Complete
            </Button>
          ) : (
            ""
          )}
        </Box>
      ) : (
        ""
      )}
      <DataGrid
        rows={rows}
        columns={columns}
        style={{ height: "400px", width: "100%" }}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={() => (onClose ? onClose() : "")}>
          Back
        </Button>
      </Box>
    </Paper>
  );
}

export default Group;
