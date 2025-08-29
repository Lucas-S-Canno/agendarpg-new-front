import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StateService } from '../../services/state/state.service';
import { UserService } from '../../services/user/user.service';
import { UserModel } from '../../models/user';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isEditing = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private stateService: StateService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  get isMinor(): boolean {
    return this.profileForm.get('menor')?.value === 'S';
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      id: [''],
      nomeCompleto: [{ value: '', disabled: true }],
      apelido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: [''],
      dataDeNascimento: [{ value: '', disabled: true }],
      tipo: [{ value: '', disabled: true }],
      menor: [''],
      password: [''],
      responsavel: [''],
      telefoneResponsavel: ['']
    });
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response.data) {
          this.profileForm.patchValue({
            id: response.data.id,
            nomeCompleto: response.data.nomeCompleto,
            apelido: response.data.apelido,
            email: response.data.email,
            telefone: response.data.telefone,
            dataDeNascimento: response.data.dataDeNascimento,
            tipo: response.data.tipo,
            menor: response.data.menor,
            password: response.data.password || '',
            responsavel: response.data.responsavel || '',
            telefoneResponsavel: response.data.telefoneResponsavel || ''
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        // Fallback para dados do StateService
        const userData = this.stateService.userData;
        if (userData) {
          this.profileForm.patchValue({
            id: userData.id,
            nomeCompleto: userData.nomeCompleto,
            apelido: userData.apelido,
            email: userData.email,
            telefone: userData.telefone,
            dataDeNascimento: userData.dataDeNascimento,
            tipo: userData.tipo,
            menor: userData.menor,
            password: userData.password || '',
            responsavel: userData.responsavel || '',
            telefoneResponsavel: userData.telefoneResponsavel || ''
          });
        }
        this.loading = false;
      }
    });
  }

  onEditModeChange(): void {
    if (!this.isEditing) {
      // Cancelar edição - recarregar dados
      this.loadUserProfile();
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Cancelar edição - recarregar dados
      this.loadUserProfile();
    }
  }

  onSave(): void {
    if (this.profileForm.valid) {
      this.loading = true;

      // Preparar dados do usuário para enviar ao backend
      // Usar getRawValue() para incluir campos disabled
      const formData = this.profileForm.getRawValue();

      const updatedUser: UserModel = {
        id: formData.id,
        email: formData.email,
        password: formData.password,
        nomeCompleto: formData.nomeCompleto,
        apelido: formData.apelido,
        dataDeNascimento: formData.dataDeNascimento,
        tipo: formData.tipo,
        telefone: formData.telefone,
        menor: formData.menor,
        responsavel: formData.responsavel || '',
        telefoneResponsavel: formData.telefoneResponsavel || ''
      };


      this.userService.updateUserProfile(updatedUser).subscribe({
        next: (response) => {
          if (response.data) {

            // Atualizar dados no StateService
            this.updateStateServiceData();

            // Recarregar dados atualizados
            this.loadUserProfile();

            // Sair do modo de edição
            this.isEditing = false;
          }
          this.loading = false;

          this.snackBar.open(
            'Perfil atualizado com sucesso!',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
        },
        error: (error) => {
          console.error('Erro ao atualizar perfil:', error);
          this.loading = false;
          this.snackBar.open(
            'Erro ao atualizar perfil. Tente novamente mais tarde.',
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

  private updateStateServiceData(): void {
    const formData = this.profileForm.value;
    const currentUserData = this.stateService.userData;
    if (currentUserData) {
      this.stateService.userData = {
        ...currentUserData,
        nomeCompleto: formData.nomeCompleto,
        apelido: formData.apelido,
        email: formData.email,
        telefone: formData.telefone,
        dataDeNascimento: formData.dataDeNascimento
      };
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
