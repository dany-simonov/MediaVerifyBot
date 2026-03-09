import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('69a9d60e00230f1aceb2');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const APPWRITE_CONFIG = {
  databaseId: 'istochnik',
  checksCollectionId: 'checks',
  uploadsBucketId: 'uploads',
  analyzeFunctionId: 'analyze',
};

export { ID } from 'appwrite';
