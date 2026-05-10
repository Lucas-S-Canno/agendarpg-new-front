import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EventApiService } from '../../services/event/event-api.service';

@Component({
  selector: 'app-new-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './new-event.component.html',
  styleUrls: ['./new-event.component.scss']
})
export class NewEventComponent implements OnInit {
  eventForm!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly eventApiService: EventApiService
  ) {}

  ngOnInit(): void {
    this.eventForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      local: ['', [Validators.required, Validators.minLength(3)]],
      inicio: ['', Validators.required],
      fim: ['', Validators.required]
    }, { validators: [this.dateRangeValidator()] });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const formData = this.eventForm.value;
    const payload = {
      nome: formData.nome,
      local: formData.local,
      inicio: this.toLocalDateTime(formData.inicio),
      fim: this.toLocalDateTime(formData.fim)
    };

    this.eventApiService.createEvent(payload).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Erro ao criar evento:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
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

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }
}
