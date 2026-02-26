export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export const generateMockTenants = (count: number = 45): Tenant[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-id-${i + 1}`,
    name: `Trung tâm Mẫu số ${i + 1}`,
    slug: `mock-tenant-${i + 1}`,
    domain: i % 3 === 0 ? `lms${i + 1}.edu.vn` : null,
    settings: {},
    isActive: i % 5 !== 0,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
};
