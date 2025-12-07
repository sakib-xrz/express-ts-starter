import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  corsOrigin: string;
  emailSender: {
    email: string;
    app_pass: string;
  };
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
}

const config: Config = {
  port: Number(process.env.PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || '',
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
};

export default config;
