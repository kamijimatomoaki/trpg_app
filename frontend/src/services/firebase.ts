import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// 各サービスへの参照を取得
export const auth = getAuth(app);
export const db = getFirestore(app);

// 認証状態の監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('ログイン状態:', user.uid);
  } else {
    console.log('ログアウト状態');
  }
});
