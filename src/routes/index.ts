import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
