/**
 * Password validation rules for the new Firebase Auth flow.
 *
 * The seed accounts created in functions/scripts/seedAuthUsers.js use
 * default passwords that satisfy these rules. After the first login,
 * users are encouraged (Phase 9: enforced) to change their password via
 * `useAuth().changePassword(...)`.
 */

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'min-length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'has-letter',
    label: 'Contains at least one letter',
    test: (p) => /[A-Za-z]/.test(p),
  },
  {
    id: 'has-number',
    label: 'Contains at least one number',
    test: (p) => /\d/.test(p),
  },
];

export interface PasswordValidation {
  isValid: boolean;
  failures: PasswordRule[];
}

export function validatePassword(password: string): PasswordValidation {
  const failures = PASSWORD_RULES.filter((rule) => !rule.test(password));
  return { isValid: failures.length === 0, failures };
}
