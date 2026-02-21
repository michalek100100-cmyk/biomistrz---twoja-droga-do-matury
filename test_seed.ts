import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// TODO: paste config here

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Seeding...");
  for(let i=100; i<150; i++) {
    await setDoc(doc(db, "rankings", "user_" + i), {
      elo: 1000 - i,
      wins: 10,
      losses: 5
    });
    await setDoc(doc(db, "users", "user_" + i), {
      name: "Test User " + i,
      stats: { xp: i * 10, streak: 1 }
    });
  }
  console.log("Done");
}
// seed();
