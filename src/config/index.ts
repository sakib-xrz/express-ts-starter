import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  corsOrigin: string;
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    passwordResetTokenExpiresIn: string;
  };
  emailSender: {
    email: string;
    app_pass: string;
  };
  frontendBaseUrl: string;
  digitalOcean: {
    spaces_endpoint?: string;
    spaces_region?: string;
    spaces_access_key?: string;
    spaces_secret_key?: string;
    spaces_bucket?: string;
  };
  cloudinary: {
    cloud_name?: string;
    api_key?: string;
    api_secret?: string;
  };
  cloudflareR2: {
    account_id?: string;
    access_key_id?: string;
    secret_access_key?: string;
    bucket_name?: string;
    public_url?: string;
  };
}

const config: Config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || '',
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || '',
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || '',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '',
    passwordResetTokenExpiresIn:
      process.env.JWT_PASSWORD_RESET_TOKEN_EXPIRES_IN || '',
  },
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || '',
  emailSender: {
    email: process.env.EMAIL_SENDER_EMAIL || '',
    app_pass: process.env.EMAIL_SENDER_APP_PASS || '',
  },
  digitalOcean: {
    spaces_endpoint: process.env.DO_SPACES_ENDPOINT,
    spaces_region: process.env.DO_SPACES_REGION,
    spaces_access_key: process.env.DO_SPACES_ACCESS_KEY,
    spaces_secret_key: process.env.DO_SPACES_SECRET_KEY,
    spaces_bucket: process.env.DO_SPACES_BUCKET,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  cloudflareR2: {
    account_id: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secret_access_key: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket_name: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    public_url: process.env.CLOUDFLARE_R2_PUBLIC_URL,
  },
};

export default config;
