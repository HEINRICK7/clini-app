export function passwordsMatch(password: string, confirmation: string) {
  return password === confirmation;
}

export function canSubmitNewPassword(password: string, confirmation: string) {
  return password.length >= 8 && confirmation.length >= 8 && passwordsMatch(password, confirmation);
}
