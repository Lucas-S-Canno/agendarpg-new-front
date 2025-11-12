import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { StateService } from '../services/state/state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private stateService: StateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Verificar se o usuário está logado
    if (!this.stateService.isLoggedIn) {
      this.snackBar.open(
        'Você precisa estar logado para acessar esta página.',
        'Fechar',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      this.router.navigate(['/login']);
      return of(false);
    }

    // Mock de validação de permissão com delay
    // Aqui você substituirá pelo endpoint real da API
    return this.validateAdminPermission().pipe(
      map(isAdmin => {
        if (!isAdmin) {
          this.snackBar.open(
            'Você não tem permissão para acessar esta página.',
            'Fechar',
            { duration: 3000, panelClass: ['snackbar-error'] }
          );
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * Mock de validação de permissão de administrador
   * Substitua este método por uma chamada real à API:
   *
   * validateAdminPermission(): Observable<boolean> {
   *   const token = this.stateService.token;
   *   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
   *   return this.http.get<ResponseModel<boolean>>(
   *     `${this.API_URL}/validate-admin`,
   *     { headers }
   *   ).pipe(
   *     map(response => response.data)
   *   );
   * }
   */
  private validateAdminPermission(): Observable<boolean> {
    // Mock: verifica localmente se o usuário é CRD ou ADM
    const userType = this.stateService.userData?.tipo || '';
    const adminTypes = ['CRD', 'ADM'];
    const isAdmin = adminTypes.includes(userType);

    // Simula delay de requisição para mostrar o efeito de loading
    return of(isAdmin).pipe(delay(800));
  }
}
