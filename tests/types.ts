export enum Role {
    Diner = 'diner',
    Franchisee = 'franchisee',
    Admin = 'admin',
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    roles: { role: Role }[];
}