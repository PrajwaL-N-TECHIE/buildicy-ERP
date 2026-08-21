import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6uR_FnGSDSXLopyUe-cDDaCUFCbmdR3U",
  authDomain: "erp-buildicy.firebaseapp.com",
  projectId: "erp-buildicy",
  storageBucket: "erp-buildicy.firebasestorage.app",
  messagingSenderId: "614662467194",
  appId: "1:614662467194:web:394acfa091f253217a15c3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USERS = [
  { id: 'user-1', fullName: 'Prajwal N', email: 'prajwal@company.com', title: 'Founder / CEO', roleTier: 'admin', active: true },
  { id: 'user-2', fullName: 'Mayur P', email: 'mayur@company.com', title: 'Co Founder / CTO', roleTier: 'admin', active: true },
  { id: 'user-3', fullName: 'Mizbha Fathima M', email: 'mizbha@company.com', title: 'Creative Lead', roleTier: 'reviewer', active: true },
  { id: 'user-4', fullName: 'Lathika J', email: 'lathika@company.com', title: 'CSL', roleTier: 'reviewer', active: true },
  { id: 'user-5', fullName: 'Shivasakthivel L', email: 'shiva@company.com', title: 'AI Engineer Intern', roleTier: 'contributor', active: true },
  { id: 'user-6', fullName: 'Rajeshwari M', email: 'rajeshwari@company.com', title: 'SDE Intern', roleTier: 'contributor', active: true },
  { id: 'user-7', fullName: 'Mohamed Parishkhan K', email: 'parish@company.com', title: 'AI Engineer Intern', roleTier: 'contributor', active: true },
  { id: 'user-8', fullName: 'Bhuvana Sree S', email: 'bhuvana@company.com', title: 'SDE Intern', roleTier: 'contributor', active: true },
  { id: 'user-9', fullName: 'Jamuna Rani', email: 'jamuna@company.com', title: 'SDE Intern', roleTier: 'contributor', active: true }
];

async function seedFirestore() {
  console.log('🌱 Seeding real team members to Firebase Firestore (erp-buildicy)...');
  for (const user of USERS) {
    await setDoc(doc(db, 'users', user.id), user);
    console.log(`✅ User seeded: ${user.fullName} (${user.title})`);
  }
  console.log('🎉 Firestore database seeding complete!');
}

seedFirestore().catch(console.error);
