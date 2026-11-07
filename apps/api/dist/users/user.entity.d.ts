export declare enum UserRole {
    ADMIN = "ADMIN",
    STUDENT = "STUDENT"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
}
