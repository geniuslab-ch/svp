import bcrypt from "bcryptjs";

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// Used to keep login timing similar whether or not the account exists.
export const DUMMY_HASH = "$2b$12$fFOGHCBFG.IQq52/r.v6ouoEPJVxwr8I908es5jD5G7OyTZcC21j2";
