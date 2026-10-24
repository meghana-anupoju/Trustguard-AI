const database = process.env.DATABASE_URL
  ? await import('./database-postgres.js')
  : await import('./database-sqlite.js');

export const initializeDatabase = database.initializeDatabase;
export const loadBrandProfile = database.loadBrandProfile;
export const persistBrandProfile = database.persistBrandProfile;
export const persistScan = database.persistScan;
export const getScanHistory = database.getScanHistory;
export const getScanById = database.getScanById;
export const persistCandidates = database.persistCandidates;
export const getCandidates = database.getCandidates;
export const saveInvestigation = database.saveInvestigation;
export const getInvestigation = database.getInvestigation;
export const getInvestigations = database.getInvestigations;
export const closeDatabase = database.closeDatabase;
