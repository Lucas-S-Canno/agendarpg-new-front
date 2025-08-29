import { EventService } from './../../services/event/event.service';
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { EventModel } from '../../models/event';
import { StateService } from '../../services/state/state.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { UserService } from '../../services/user/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.scss']
})
export class EventModalComponent implements OnInit {
  narratorNickname: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public event: EventModel,
    public dialogRef: MatDialogRef<EventModalComponent>,
    private stateService: StateService,
    private eventService: EventService,
    private eventUpdateService: EventUpdateService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn && this.event.narrador) {
      this.loadNarratorNickname();
    }
  }

  private loadNarratorNickname(): void {
    const narratorId = parseInt(this.event.narrador);
    this.userService.getNarratorName(narratorId).subscribe({
      next: (response) => {
        if (response.data) {
          this.narratorNickname = response.data.apelido;
        }
      },
      error: (error) => {
        console.error('Erro ao buscar apelido do narrador:', error);
        this.narratorNickname = 'Narrador';
      }
    });
  }

  get isLoggedIn(): boolean {
    return this.stateService.isLoggedIn;
  }

  get isUserRegistered(): boolean {
    if (!this.isLoggedIn) return false;
    if (!this.stateService.userData?.id) return false;
    if (!this.event.jogadores || this.event.jogadores.length === 0) return false;
    for (let i=0; i < this.event.jogadores.length; i++) {
      if (this.event.jogadores[i] == this.stateService.userData.id) {
        return true;
      }
    }
    return false;
  }

  get isUserNarrator(): boolean {
    if (!this.isLoggedIn || !this.stateService.userData?.id) return false;
    return this.event.narrador === this.stateService.userData.id.toString();
  }

  get canRegister(): boolean {
    return this.isLoggedIn && !this.isUserRegistered && !this.isUserNarrator && !this.isEventFull;
  }

  get canUnregister(): boolean {
    return this.isLoggedIn && this.isUserRegistered && !this.isUserNarrator;
  }

  get isEventFull(): boolean {
    return this.event.jogadores.length >= this.event.numeroDeVagas;
  }

  get buttonText(): string {
    if (!this.isLoggedIn) return 'Para se cadastrar nesse evento, é necessário estar logado';
    if (this.isUserNarrator) return 'Você é o narrador deste evento';
    if (this.isUserRegistered) return 'Sair do evento';
    if (this.isEventFull) return 'Evento lotado';
    return 'Cadastrar-se no evento';
  }

  get buttonColor(): string {
    if (this.isUserRegistered) return 'warn';
    if (this.canRegister) return 'primary';
    return 'warn';
  }

  onRegister(): void {
    if (this.canRegister) {
      let eventId = this.event.id?.toString();
      if (!eventId) {
        console.error('Evento ID não encontrado');
        return;
      }
      this.eventService.registerInEvent(eventId).subscribe({
        next: (response) => {
          this.snackBar.open(
            'Cadastro realizado com sucesso!',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
        },
        complete: () => {
          this.eventUpdateService.notifyEventUpdated(this.event.id?.toString());
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Erro ao cadastrar usuário no evento:', error);
          this.snackBar.open(
            'Erro ao cadastrar usuário no evento.',
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

  onUnregister(): void {
    if (this.canUnregister) {
      let eventId = this.event.id?.toString();
      if (!eventId) {
        console.error('Evento ID não encontrado');
        return;
      }
      this.eventService.unregisterFromEvent(eventId).subscribe({
        next: (response) => {
          this.snackBar.open(
            'Saiu do evento com sucesso!',
            'Fechar',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
        },
        complete: () => {
          this.eventUpdateService.notifyEventUpdated(this.event.id?.toString());
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Erro ao remover usuário do evento:', error);
          this.snackBar.open(
            'Erro ao remover usuário do evento.',
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

  onButtonClick(): void {
    if (this.canRegister) {
      this.onRegister();
    } else if (this.canUnregister) {
      this.onUnregister();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
