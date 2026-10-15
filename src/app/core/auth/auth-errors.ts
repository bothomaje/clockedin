export const getAuthErrorMessage = (err: unknown): string => {
  const code = (err as { code?: string })?.code;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return "That email address doesn't look valid.";
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/invalid-action-code':
      return 'This verification link is invalid or has already been used. Please request a new one.';
    case 'auth/expired-action-code':
      return 'This verification link has expired. Please request a new one.';
    default:
      return 'Something went wrong. Please try again.';
  }
};
