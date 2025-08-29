import { Component }              from '@angular/core';
import { CommonModule }           from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule }          from '@angular/material/card';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatButtonModule }        from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { LoginModel } from '../../models/login';
import { StateService } from '../../services/state/state.service';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../services/user/user.service';
import { CookieConsentService } from '../../services/cookie-consent/cookie-consent.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  providers: [
    LoginService,
    UserService
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private stateService: StateService,
    private userService: UserService,
    private router: Router,
    private cookieConsentService: CookieConsentService,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.login();
    }
  }

  // Função para decodificar JWT
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  login() {
    if (this.loginForm.valid) {
      // Verificar se os cookies estão permitidos
      if (!this.cookieConsentService.canUseCookies()) {
        this.snackBar.open(
          'Para fazer login, é necessário aceitar o uso de cookies. Os cookies são essenciais para manter você logado.',
          'Fechar',
          {
            duration: 5000,
            panelClass: ['snackbar-warning']
          }
        );
        return;
      }

      const credentials = this.loginForm.value;
      this.loginService.login(credentials as LoginModel).subscribe({
        next: (response) => {

          // Decodificar o token e extrair dados do usuário
          const tokenData = this.decodeJWT(response.data);
          if (tokenData) {
            // Salvar os dados do usuário no StateService (que agora salva em cookies)
            this.stateService.userData = {
              id: tokenData.id,
              email: tokenData.sub, // 'sub' é o email no seu JWT
              nomeCompleto: tokenData.nomeCompleto,
              apelido: tokenData.apelido || '', // adicionar apelido do token ou string vazia
              tipo: tokenData.tipo,
              password: '', // não salvar senha
              dataDeNascimento: '',
              telefone: '',
              menor: ''
            };

            this.stateService.isLoggedIn = true;
            this.stateService.token = response.data;

            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.snackBar.open(
            'Erro ao fazer login. Verifique suas credenciais.',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-error']
            }
          );
        }
      });
    }
  }

  goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/recuperar-senha']);
  }

}
