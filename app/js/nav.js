/* Bivvo — contexto de navegação compartilhado (evita importações circulares). */
import { today } from './util.js';
export const ctx = { route: 'inicio', month: today().slice(0, 7), params: {}, demo: false };
const hooks = {};
export const setHooks = h => Object.assign(hooks, h);
export const go = (route, params) => hooks.go?.(route, params);
export const enterDemo = () => hooks.enterDemo?.();
export const leaveDemo = toSignup => hooks.leaveDemo?.(toSignup);
export const rerender = () => hooks.render?.(false);
