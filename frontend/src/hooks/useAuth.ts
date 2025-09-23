import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useGameStore } from '../store/gameStore';

export const useAuth = () => {
  const [isAuthLoading, setAuthLoading] = useState(true);
  const setAuthInStore = useGameStore((state) => state.setAuth);

  useEffect(() => {
    // 認証状態の変化を監視するリスナーを登録
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ユーザーがログインしている場合
        try {
          const idToken = await user.getIdToken();
          // Zustandストアに認証情報を保存
          setAuthInStore({ uid: user.uid, idToken });
        } catch (error) {
          console.error('IDトークンの取得に失敗しました', error);
        }
      } else {
        // ユーザーがログインしていない場合、匿名でサインインする
        try {
          const userCredential = await signInAnonymously(auth);
          const idToken = await userCredential.user.getIdToken();
          // Zustandストアに認証情報を保存
          setAuthInStore({ uid: userCredential.user.uid, idToken });
        } catch (error) {
          console.error('匿名認証に失敗しました', error);
        }
      }
      setAuthLoading(false);
    });

    // コンポーネントがアンマウントされる際にリスナーを解除
    return () => unsubscribe();
  }, [setAuthInStore]);

  return { isAuthLoading };
};
