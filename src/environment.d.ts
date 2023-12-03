export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string
      LEADERBOARD_ID: string
      DB_CONNECTION_STRING: string
    }
  }
}
