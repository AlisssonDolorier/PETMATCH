import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { LEGAL_VERSION } from '../config/legal.js';
import { ApiError } from '../utils/api-error.js';
import { signToken } from '../middleware/authenticate.js';
import * as userModel from '../models/user.model.js';
import { sendVerification } from './account.service.js';

/**
 * Hash válido pero inalcanzable, usado sólo para igualar el coste del login
 * cuando el correo no existe. No corresponde a ninguna contraseña utilizable.
 */
const TIMING_GUARD_HASH = '$2b$04$714GUoh/nZpXbiar2xo/zeAuo3.3hR13d2zttTghCBM62F0scbOhu';

/** Proyección pública del usuario: nunca incluye el hash de la contraseña. */
export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function register(input) {
  const normalizedEmail = String(input.email ?? '').trim().toLowerCase();
  const role = input.role ?? 'ADOPTANTE';
  const firstName = String(input.firstName ?? '').trim();
  const lastName = String(input.lastName ?? '').trim();
  const dni = role === 'ADOPTANTE' ? String(input.dni ?? '').trim() : undefined;
  const shelterName = role === 'REFUGIO' ? String(input.shelterName ?? '').trim() : undefined;
  const responsibleName = role === 'REFUGIO' ? String(input.responsibleName ?? '').trim() : undefined;
  const ruc = role === 'REFUGIO' ? String(input.ruc ?? '').trim() : undefined;
  const responsibleDni = role === 'REFUGIO' ? String(input.responsibleDni ?? '').trim() : undefined;
  const normalizedFirstName = role === 'REFUGIO' ? (firstName || shelterName || 'Refugio') : firstName;
  const normalizedLastName = role === 'REFUGIO' ? (lastName || responsibleName || '') : lastName;

  if (role === 'ADMINISTRADOR') {
    throw ApiError.unprocessable('No puedes crear una cuenta de administrador');
  }

  if (role === 'ADOPTANTE' && !/^\d{8}$/.test(dni)) {
    throw ApiError.unprocessable('El DNI es obligatorio para crear una cuenta de adoptante');
  }

  if (role === 'REFUGIO') {
    if (!shelterName) {
      throw ApiError.unprocessable('El nombre del refugio es obligatorio para crear una cuenta de refugio');
    }
    if (!responsibleName) {
      throw ApiError.unprocessable('El nombre del responsable es obligatorio para crear una cuenta de refugio');
    }
    if ((!ruc || !/^\d{11}$/.test(ruc)) && (!responsibleDni || !/^\d{8}$/.test(responsibleDni))) {
      throw ApiError.unprocessable('Debe indicar un RUC del refugio o el DNI del responsable');
    }
  }

  if (input.acceptedTerms !== true || input.acceptedPrivacy !== true) {
    throw ApiError.unprocessable('Debes aceptar los términos y la política de privacidad');
  }

  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) throw ApiError.conflict('El correo ya está registrado');

  const passwordHash = await bcrypt.hash(input.password, env.bcryptRounds);
  // La versión legal aceptada se guarda junto a la cuenta: así queda
  // constancia de a qué texto concreto se comprometió cada persona.
  const user = await userModel.create(
    {
      ...input,
      firstName: normalizedFirstName || undefined,
      lastName: normalizedLastName || undefined,
      email: normalizedEmail,
      role,
      dni: dni || undefined,
      shelterName: shelterName || undefined,
      responsibleName: responsibleName || undefined,
      ruc: ruc || undefined,
      responsibleDni: responsibleDni || undefined,
      legalVersion: LEGAL_VERSION
    },
    passwordHash
  );

  // El correo de confirmación no bloquea el registro: si el envío falla, la
  // cuenta ya existe y siempre puede pedirse otro enlace.
  await sendVerification(user).catch(() => {});

  return { user: toPublicUser(user), token: signToken(user) };
}

export async function login({ email, password }) {
  const user = await userModel.findByEmail(String(email ?? '').trim().toLowerCase());

  // Se compara siempre contra un hash — aunque el usuario no exista — para no
  // revelar por tiempo de respuesta qué correos están registrados.
  const matches = await bcrypt.compare(password, user?.passwordHash ?? TIMING_GUARD_HASH);

  if (!user || !matches) {
    throw ApiError.unauthorized('El correo o contraseña son incorrectos');
  }
  if (user.status !== 'ACTIVO') {
    throw ApiError.forbidden('Tu cuenta está suspendida');
  }

  return { user: toPublicUser(user), token: signToken(user) };
}

export async function changePassword(user, { currentPassword, newPassword }) {
  const stored = await userModel.findByEmail(user.email);
  const matches = await bcrypt.compare(currentPassword, stored.passwordHash);
  if (!matches) throw ApiError.unauthorized('La contraseña actual no es correcta');

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);
  await userModel.updatePassword(stored.id, passwordHash);
}
