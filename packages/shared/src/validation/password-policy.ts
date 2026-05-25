export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_SPECIAL_CHARACTERS = '@$!%*?&';

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.{8,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain 8-128 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
