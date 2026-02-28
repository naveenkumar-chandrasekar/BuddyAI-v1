import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

const WEB_CLIENT_ID = '995905981250-idl1t826qh68l7lkg3rdi7684b5p5tuo.apps.googleusercontent.com';

export function configureGoogleSignIn(): void {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch {
    return null;
  }
}

export async function signInWithGoogle(): Promise<AppUser> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken ?? null;
  if (!idToken) throw new Error('No ID token from Google Sign-In');
  const credential = auth.GoogleAuthProvider.credential(idToken);
  const result = await auth().signInWithCredential(credential);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
  };
}

export async function signOut(): Promise<void> {
  await auth().signOut();
  await GoogleSignin.signOut();
}

export function getCurrentUser(): AppUser | null {
  const user = auth().currentUser;
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export function onAuthStateChanged(
  callback: (user: AppUser | null) => void,
): () => void {
  return auth().onAuthStateChanged(user => {
    callback(user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null);
  });
}
