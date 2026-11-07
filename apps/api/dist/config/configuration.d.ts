export declare const configuration: () => {
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string;
    };
    bcrypt: {
        saltRounds: number;
    };
    admin: {
        email: string | undefined;
        password: string | undefined;
    };
};
