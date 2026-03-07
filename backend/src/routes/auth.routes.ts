import { Router } from 'express';
import * as authService from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
});

router.post('/register', authenticate, async (req, res, next) => {
  try {
    const user = await authService.register(req.user!.tenantId, req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'Geen refresh token' });
      return;
    }
    const result = await authService.refreshAccessToken(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ message: 'Uitgelogd' });
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
