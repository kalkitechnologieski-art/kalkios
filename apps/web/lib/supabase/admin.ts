import { createAdminClient as serverAdmin } from './server'
export async function getAdminClient() { return serverAdmin() }
