import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EventModelV2 } from '../../../models/event.model';
import { EventApiService } from '../../../services/event/event-api.service';
import { EventUpdateService } from '../../../services/event/event-update.service';

@Component({
  selector: 'app-event-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './event-edit-modal.component.html',
  styleUrl: './event-edit-modal.component.scss'
})
export class EventEditModalComponent implements OnInit {
  editForm!: FormGroup;
  saving = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly eventApiService: EventApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly snackBar: MatSnackBar,
    private readonly dialogRef: MatDialogRef<EventEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly event: EventModelV2
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  save(): void {
    if (this.editForm.invalid || !this.event.id) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.value;
    const payload = {
      nome: formValue.nome,
      local: formValue.local,
      inicio: this.toLocalDateTime(formValue.inicio),
      fim: this.toLocalDateTime(formValue.fim)
    };

    this.saving = true;
    this.eventApiService.updateEvent(this.event.id, payload).pipe(
      finalize(() => {
        this.saving = false;
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Evento atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.eventUpdateService.notifyEventUpdated(this.event.id?.toString());
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Nao foi possivel salvar as alteracoes do evento.', 'Fechar', {
          duration: 3500,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private initializeForm(): void {
    this.editForm = this.fb.group({
      nome: [this.event.nome, [Validators.required, Validators.minLength(3)]],
      local: [this.event.local, [Validators.required, Validators.minLength(3)]],
      inicio: [this.toDateTimeLocalValue(this.event.inicio), [Validators.required]],
      fim: [this.toDateTimeLocalValue(this.event.fim), [Validators.required]]
    }, { validators: [this.dateRangeValidator()] });
  }

  private dateRangeValidator(): ValidatorFn {
    return (group): ValidationErrors | null => {
      const inicio = group.get('inicio')?.value;
      const fim = group.get('fim')?.value;

      if (!inicio || !fim) {
        return null;
      }

      return new Date(fim) > new Date(inicio) ? null : { invalidDateRange: true };
    };
  }

  private toDateTimeLocalValue(value: string): string {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }
}
