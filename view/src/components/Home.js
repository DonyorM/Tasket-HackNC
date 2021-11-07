import { CREATE_GROUP } from "../States";
import {
  Button,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, getFirestore, query, where } from "@firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { useState } from "react";
import GroupView from "./GroupView";
const auth = getAuth();
const db = getFirestore();

function WithAuth({ email, setCurrentState }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDocs, tasksLoading, tasksError] = useCollection(
    query(collection(db, "groups"), where("members", "array-contains", email))
  );

  if (tasksLoading) {
    return <p>Loading...</p>;
  }

  const createGroup = () => {
    setCurrentState(CREATE_GROUP);
  };

  const groupData = groupDocs.docs.map((doc) => doc.data());

  if (selectedGroup) {
    return (
      <Container>
        <GroupView
          groupName={selectedGroup}
          email={email}
          onClose={() => setSelectedGroup(null)}
        />
      </Container>
    );
  }

  function handleListItemClick(index) {
    setSelectedGroup(groupData[index].name);
  }

  return (
    <Container>
      <List>
        {groupData.map((task, index) => {
          return (
            <ListItemButton
              onClick={() => handleListItemClick(index)}
              key={index}
            >
              <ListItemText primary={task.name} />
            </ListItemButton>
          );
        })}
      </List>
      <Button onClick={createGroup} variant="contained">Create Group</Button>
    </Container>
  );
}

function Home({ setCurrentState }) {
  const [user, authLoading, authError] = useAuthState(auth);

  if (!user || authLoading) {
    return <Typography variant="body">Loading...</Typography>;
  } else {
    return <WithAuth email={user.email} setCurrentState={setCurrentState} />;
  }
}

export default Home;
