import express from 'express';
import { UploadRoutes } from '../modules/upload/upload.route';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  {
    path: '/upload',
    route: UploadRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
