import { z } from 'zod';
import { dni, email, optionalText, password, phone, text } from './common.schema.js';

const ruc = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'Ingresa un RUC válido')
  .optional()
  .transform((value) => (value === '' ? undefined : value));

/**
 * Registro público (§24).
 *
 * Sólo se permite crear cuentas ADOPTANTE o REFUGIO: el rol ADMINISTRADOR
 * se otorga desde el seed o desde otra cuenta administrativa, nunca por
 * autoservicio (§88.10).
 */
export const registerSchema = z
  .object({
    firstName: text(2, 80, 'El nombre').optional().transform((value) => (value === '' ? undefined : value)),
    lastName: text(2, 80, 'Los apellidos').optional().transform((value) => (value === '' ? undefined : value)),
    email,
    password,
    phone,
    dni: dni.optional(),
    shelterName: text(2, 160, 'El nombre del refugio').optional(),
    responsibleName: text(2, 120, 'El nombre del responsable').optional(),
    ruc,
    responsibleDni: dni.optional(),
    address: optionalText(300, 'La dirección'),
    city: text(2, 100, 'La ciudad'),
    role: z.enum(['ADOPTANTE', 'REFUGIO']).default('ADOPTANTE'),

    // §32 aplicado al registro: la aceptación debe ser un acto afirmativo y
    // explícito, no una casilla premarcada ni un consentimiento tácito.
    acceptedTerms: z.literal(true, {
      message: 'Debes aceptar los términos y condiciones para crear una cuenta'
    }),
    acceptedPrivacy: z.literal(true, {
      message: 'Debes aceptar la política de privacidad para crear una cuenta'
    })
  })
  .superRefine((value, ctx) => {
    if (value.role === 'ADOPTANTE') {
      if (!value.firstName) {
        ctx.addIssue({
          path: ['firstName'],
          code: 'custom',
          message: 'El nombre es obligatorio para crear una cuenta de adoptante'
        });
      }

      if (!value.lastName) {
        ctx.addIssue({
          path: ['lastName'],
          code: 'custom',
          message: 'Los apellidos son obligatorios para crear una cuenta de adoptante'
        });
      }

      const normalized = String(value.dni ?? '').trim();
      const valid = /^\d{8}$/.test(normalized);
      if (!valid) {
        ctx.addIssue({
          path: ['dni'],
          code: 'custom',
          message: 'El DNI es obligatorio para crear una cuenta de adoptante'
        });
      }
    }

    if (value.role === 'REFUGIO') {
      if (!value.shelterName) {
        ctx.addIssue({
          path: ['shelterName'],
          code: 'custom',
          message: 'El nombre del refugio es obligatorio para crear una cuenta de refugio'
        });
      }

      if (!value.responsibleName) {
        ctx.addIssue({
          path: ['responsibleName'],
          code: 'custom',
          message: 'El nombre del responsable es obligatorio para crear una cuenta de refugio'
        });
      }

      const hasRuc = /^\d{11}$/.test(String(value.ruc ?? ''));
      const hasResponsibleDni = /^\d{8}$/.test(String(value.responsibleDni ?? ''));
      if (!hasRuc && !hasResponsibleDni) {
        ctx.addIssue({
          path: ['ruc'],
          code: 'custom',
          message: 'Debe indicar un RUC del refugio o el DNI del responsable'
        });
      }
    }
  });

export const loginSchema = z.object({
  email,
  password: z.string({ message: 'La contraseña es obligatoria' }).min(1, 'Ingresa tu contraseña')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: password
});
