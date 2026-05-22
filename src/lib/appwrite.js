import { Client, Account, Databases, Query } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6a007fab00241e1b5379';

export const APPWRITE_DATABASE_ID = '6a008029003309693066';
export const APPWRITE_USERS_COLLECTION_ID = 'users';

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export { Query };

// Call this to authenticate the extension with a JWT from the web app
export function setClientJWT(jwt) {
  client.setJWT(jwt);
}
