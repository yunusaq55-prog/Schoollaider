import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors.js';
import type { JwtPayload, LoginRequest, RegisterRequest } from '@schoollaider/shared';
import type { Role } from '@schoollaider/shared';

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export async function login({ email, password }: LoginRequest) {
  console.log(`[AUTH] Login poging voor: ${email}`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`[AUTH] Gebruiker NIET gevonden: ${email}`);
    throw new UnauthorizedError('Ongeldige inloggegevens');
  }
  if (!user.active) {
    console.log(`[AUTH] Gebruiker INACTIEF: ${email}`);
    throw new UnauthorizedError('Ongeldige inloggegevens');
  }

  console.log(`[AUTH] Gebruiker gevonden: ${user.naam} (${user.role})`);
  console.log(`[AUTH] Hash uit DB: ${user.passwordHash.substring(0, 20)}...`);
  console.log(`[AUTH] Wachtwoord lengte: ${password?.length ?? 'undefined'}`);

  const valid = await bcrypt.compare(password, user.passwordHash);
  console.log(`[AUTH] bcrypt.compare resultaat: ${valid}`);

  if (!valid) {
    console.log(`[AUTH] Wachtwoord ONGELDIG voor: ${email}`);
    throw new UnauthorizedError('Ongeldige inloggegevens');
  }

  console.log(`[AUTH] Login GESLAAGD voor: ${email}`);

  const payload: JwtPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as Role,
    schoolId: user.schoolId,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: user.id,
      email: user.email,
      naam: user.naam,
      role: user.role as Role,
      tenantId: user.tenantId,
      schoolId: user.schoolId,
      active: user.active,
    },
  };
}

export async function register(tenantId: string, data: RegisterRequest) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError('E-mailadres is al in gebruik');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      tenantId,
      email: data.email,
      passwordHash,
      naam: data.naam,
      role: data.role,
      schoolId: data.schoolId ?? null,
    },
  });

  return {
    id: user.id,
    email: user.email,
    naam: user.naam,
    role: user.role as Role,
    tenantId: user.tenantId,
    schoolId: user.schoolId,
    active: user.active,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) {
      throw new UnauthorizedError('Gebruiker niet gevonden of inactief');
    }

    const newPayload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as Role,
      schoolId: user.schoolId,
    };

    return { accessToken: generateAccessToken(newPayload) };
  } catch {
    throw new UnauthorizedError('Ongeldige refresh token');
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Gebruiker');

  return {
    id: user.id,
    email: user.email,
    naam: user.naam,
    role: user.role as Role,
    tenantId: user.tenantId,
    schoolId: user.schoolId,
    active: user.active,
  };
}
