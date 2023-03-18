import * as dotenv from 'dotenv';

dotenv.config();

export const defaults = {
  port: process.env.PORT || 8080,
};
