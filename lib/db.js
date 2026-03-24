import { init } from '@instantdb/core';
import schema from '../instant.schema';

const APP_ID = import.meta.env?.VITE_INSTANT_APP_ID ?? '1817d86b-3637-4bb4-8996-099b553f92bf';

export const db = init({ appId: APP_ID, schema });
