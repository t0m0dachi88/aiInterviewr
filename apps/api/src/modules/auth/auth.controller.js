import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  CSRF_COOKIE_NAME,
  clearCsrfCookie,
  clearRefreshCookie,
  setCsrfCookie,
  setRefreshCookie,
  REFRESH_COOKIE_NAME,
} from "./cookie.service.js";
import * as AuthService from "./auth.service.js";

function applyAuthCookies(res, refreshToken) {
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
}

function clearAuthCookies(res) {
  clearRefreshCookie(res);
  clearCsrfCookie(res);
}

export const AuthController = {
  register: asyncHandler(async (req, res) => {
    const result = await AuthService.registerUser(req.validated, req);
    applyAuthCookies(res, result.refreshToken);
    return sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      {},
      201,
    );
  }),

  login: asyncHandler(async (req, res) => {
    const result = await AuthService.loginUser(req.validated, req);
    applyAuthCookies(res, result.refreshToken);
    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    const result = await AuthService.refreshSession(raw, req);
    applyAuthCookies(res, result.refreshToken);
    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    await AuthService.logoutCurrentSession(raw, req.user?.sessionId);
    clearAuthCookies(res);
    return sendSuccess(res, { loggedOut: true });
  }),

  logoutAll: asyncHandler(async (req, res) => {
    await AuthService.logoutAllSessions(req.user.id);
    clearAuthCookies(res);
    return sendSuccess(res, { loggedOut: true });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user.id);
    return sendSuccess(res, {
      user,
      csrfToken: req.cookies?.[CSRF_COOKIE_NAME] || null,
    });
  }),
};
