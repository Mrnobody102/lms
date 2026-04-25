import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  it('should reject weak replacement passwords', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = 'OldPassword123!';
    dto.newPassword = '12345678';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'newPassword')).toBe(true);
  });

  it('should accept strong replacement passwords', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = 'OldPassword123!';
    dto.newPassword = 'NewPassword123!';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
