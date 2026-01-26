import { registerAs } from '@nestjs/config';

const authenticationConfig = registerAs('authentication', () => {
  return {
    jwtSecret: process.env.JWT_SECRET,
  };
});

export default authenticationConfig;
