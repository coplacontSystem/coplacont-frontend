export const USERSENDPOINTS = {
  // Usuarios
  GET_USERS: '/user',
  GET_USER: '/user/:id',
  CREATE_USER: '/user',
  UPDATE_USER: '/user/:id',
  DISABLE_USER: '/user/:id/disable',
  ENABLE_USER: '/user/:id/enable',
  UPDATE_USER_PASSWORD: '/user/:id/password',
  
  // Empresas con usuarios
  CREATE_EMPRESA_CON_USUARIO: '/user/empresa-con-usuario',
  CREATE_USER_FOR_PERSONA: '/user/persona/:idPersona',
  DISABLE_PERSONA_AND_USERS: '/user/persona/:idPersona/disabled',
  
  // Personas/Empresas (nuevo controlador)
  GET_PERSONAS_WITH_USERS: '/persona',
  GET_PERSONA_WITH_USERS: '/persona/:id',
  UPDATE_PERSONA: '/persona/:id',
  DISABLE_PERSONA: '/persona/:id/disable',
  ENABLE_PERSONA: '/persona/:id/enable',
} as const;