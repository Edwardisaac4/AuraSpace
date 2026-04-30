interface AuthState{
    isSignedIn: Boolean;
    userName: string | null;
    userId: string | null;
}

type AuthContext = {
    isSignedIn: Boolean;
    userName: string | null;
    userId: string | null;
    refreshAuth: () => Promise<Boolean>;
    signIn: () => Promise<Boolean>
    signOut : () => Promise<Boolean>
}