export interface UserDTO {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  tenantId: string;
}
