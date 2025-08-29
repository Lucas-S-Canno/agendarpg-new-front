import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserModel } from '../../models/user';
import { CookieConsentService } from '../cookie-consent/cookie-consent.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly TOKEN_COOKIE = 'auth_token';
  private readonly USER_COOKIE = 'user_data';

  private _isLoggedIn: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookieConsentService: CookieConsentService
  ) {
    this.initializeFromCookies();
  }

  private initializeFromCookies(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Só inicializa se o usuário consentiu com cookies
    if (!this.cookieConsentService.canUseCookies()) {
      return;
    }

    const token = this.getTokenFromCookie();
    const userData = this.getUserDataFromCookie();

    if (token && userData) {
      this._isLoggedIn = true;
    }
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  set isLoggedIn(value: boolean) {
    this._isLoggedIn = value;
    if (!value) {
      this.clearCookies();
    }
  }

  get token(): string {
    if (!this.cookieConsentService.canUseCookies()) {
      return '';
    }
    return this.getTokenFromCookie() || '';
  }

  set token(value: string) {
    if (!this.cookieConsentService.canUseCookies()) {
      console.warn('Não é possível salvar token: consentimento de cookies não foi dado');
      return;
    }

    if (value) {
      // Cookie expira quando o navegador fechar (session cookie)
      this.setCookie(this.TOKEN_COOKIE, value, {
        secure: location.protocol === 'https:', // Apenas HTTPS em produção
        sameSite: 'strict' // Proteção CSRF
      });
    } else {
      this.deleteCookie(this.TOKEN_COOKIE);
    }
  }

  get userData(): UserModel {
    if (!this.cookieConsentService.canUseCookies()) {
      return {} as UserModel;
    }
    return this.getUserDataFromCookie() || {} as UserModel;
  }

  set userData(value: UserModel) {
    if (!this.cookieConsentService.canUseCookies()) {
      console.warn('Não é possível salvar dados do usuário: consentimento de cookies não foi dado');
      return;
    }

    if (value && Object.keys(value).length > 0) {
      // Criptografar dados sensíveis antes de salvar
      const encryptedData = this.encryptUserData(value);
      this.setCookie(this.USER_COOKIE, encryptedData, {
        secure: location.protocol === 'https:',
        sameSite: 'strict'
      });
    } else {
      this.deleteCookie(this.USER_COOKIE);
    }
  }

  private setCookie(name: string, value: string, options: any = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options.secure) {
      cookieString += '; Secure';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    // Session cookie (sem expires/max-age)
    cookieString += '; Path=/';

    document.cookie = cookieString;
  }

  private getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const nameEQ = name + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  private deleteCookie(name: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  private getTokenFromCookie(): string | null {
    return this.getCookie(this.TOKEN_COOKIE);
  }

  private getUserDataFromCookie(): UserModel | null {
    const encryptedData = this.getCookie(this.USER_COOKIE);
    if (encryptedData) {
      try {
        return this.decryptUserData(encryptedData);
      } catch (error) {
        console.error('Erro ao descriptografar dados do usuário:', error);
        this.clearCookies();
        return null;
      }
    }
    return null;
  }

  private encryptUserData(userData: UserModel): string {
    if (!isPlatformBrowser(this.platformId)) {
      return JSON.stringify(userData);
    }

    // Implementação simples de "criptografia" (Base64)
    // Em produção, use uma biblioteca de criptografia real
    const jsonString = JSON.stringify(userData);
    return btoa(jsonString);
  }

  private decryptUserData(encryptedData: string): UserModel {
    if (!isPlatformBrowser(this.platformId)) {
      return JSON.parse(encryptedData);
    }

    // Descriptografar dados
    const jsonString = atob(encryptedData);
    return JSON.parse(jsonString);
  }

  private clearCookies(): void {
    this.deleteCookie(this.TOKEN_COOKIE);
    this.deleteCookie(this.USER_COOKIE);
  }

  logout(): void {
    this.isLoggedIn = false;
    this.token = '';
    this.userData = {} as UserModel;
  }

  /**
   * Verifica se o login é possível (requer consentimento de cookies)
   */
  canLogin(): boolean {
    return this.cookieConsentService.canUseCookies();
  }

  /**
   * Retorna a mensagem de aviso quando cookies não são permitidos
   */
  getLoginRestrictionMessage(): string {
    return 'Para fazer login, é necessário aceitar o uso de cookies. ' +
           'Os cookies são essenciais para manter você logado entre as sessões.';
  }
}
