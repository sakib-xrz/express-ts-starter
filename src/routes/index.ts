import express from 'express';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
