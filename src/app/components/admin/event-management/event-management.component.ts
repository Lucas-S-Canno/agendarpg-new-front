import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivityModel, CreateActivityPayload } from '../../../models/activity.model';
import { ActivityType } from '../../../models/activity-type.enum';
import { EventModelV2 } from '../../../models/event.model';
import { ActivityApiService } from '../../../services/event/activity-api.service';
import { EventApiService } from '../../../services/event/event-api.service';
import { StateService } from '../../../services/state/state.service';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './event-management.component.html',
  styleUrls: ['./event-management.component.scss']
})
export class EventManagementComponent implements OnInit {
  loading = true;

  events: EventModelV2[] = [];
  activities: ActivityModel[] = [];
  selectedEventId: number | null = null;

  readonly activityTypes = [ActivityType.RPG_MESA, ActivityType.WORKSHOP];
  readonly activityType = ActivityType;

  eventForm!: FormGroup;
  activityForm!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly eventApiService: EventApiService,
    private readonly activityApiService: ActivityApiService,
    private readonly stateService: StateService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadEvents();
  }

  get userRole(): string {
    return this.stateService.userData?.tipo || '';
  }

  get canManageEvents(): boolean {
    return this.userRole === 'ADM' || this.userRole === 'CRD';
  }

  get canManageActivities(): boolean {
    return this.userRole === 'ADM' || this.userRole === 'CRD' || this.userRole === 'NRD';
  }

  get hasManagementPermission(): boolean {
    return this.canManageEvents || this.canManageActivities;
  }

  get isRpgActivity(): boolean {
    return this.activityForm.get('tipo')?.value === ActivityType.RPG_MESA;
  }

  get isWorkshopActivity(): boolean {
    return this.activityForm.get('tipo')?.value === ActivityType.WORKSHOP;
  }

  initForms(): void {
    this.eventForm = this.fb.group({
      id: [null],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      local: ['', [Validators.required, Validators.minLength(3)]],
      inicio: ['', Validators.required],
      fim: ['', Validators.required]
    });

    this.activityForm = this.fb.group({
      id: [null],
      tipo: [ActivityType.RPG_MESA, Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required, Validators.minLength(5)]],
      inicio: ['', Validators.required],
      fim: ['', Validators.required],
      localComplemento: ['', [Validators.required, Validators.minLength(2)]],
      sistema: [''],
      numeroVagas: [null],
      tagsText: [''],
      narradorId: [null],
      tema: [''],
      palestranteId: [null]
    });
  }

  loadEvents(): void {
    this.loading = true;

    this.eventApiService.getEvents().subscribe({
      next: (response) => {
        this.events = response.data ?? [];

        if (this.events.length > 0 && !this.selectedEventId) {
          this.selectEvent(this.events[0].id || null);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar eventos:', error);
        this.showError('Erro ao carregar eventos.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  selectEvent(eventId: number | null): void {
    this.selectedEventId = eventId;

    if (!eventId) {
      this.activities = [];
      return;
    }

    this.loadActivities(eventId);
  }

  loadActivities(eventId: number): void {
    this.activityApiService.getByEvent(eventId).subscribe({
      next: (response) => {
        this.activities = response.data ?? [];
      },
      error: (error) => {
        console.error('Erro ao carregar atividades:', error);
        this.showError('Erro ao carregar atividades do evento.');
      }
    });
  }

  submitEvent(): void {
    if (!this.canManageEvents) {
      this.showError('Sem permissao para gerir eventos.');
      return;
    }

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const value = this.eventForm.value;
    const inicio = this.toApiDateTime(value.inicio);
    const fim = this.toApiDateTime(value.fim);

    if (!this.isEndAfterStart(inicio, fim)) {
      this.showError('A data/hora de fim deve ser maior que a de inicio.');
      return;
    }

    const payload = {
      nome: value.nome,
      local: value.local,
      inicio,
      fim
    };

    if (value.id) {
      this.eventApiService.updateEvent(value.id, payload).subscribe({
        next: () => {
          this.showSuccess('Evento atualizado com sucesso.');
          this.resetEventForm();
          this.loadEvents();
        },
        error: (error) => {
          console.error('Erro ao atualizar evento:', error);
          this.showError('Erro ao atualizar evento.');
        }
      });
      return;
    }

    this.eventApiService.createEvent(payload).subscribe({
      next: () => {
        this.showSuccess('Evento criado com sucesso.');
        this.resetEventForm();
        this.loadEvents();
      },
      error: (error) => {
        console.error('Erro ao criar evento:', error);
        this.showError('Erro ao criar evento.');
      }
    });
  }

  editEvent(event: EventModelV2): void {
    this.eventForm.patchValue({
      id: event.id || null,
      nome: event.nome,
      local: event.local,
      inicio: this.toInputDateTime(event.inicio),
      fim: this.toInputDateTime(event.fim)
    });
  }

  deleteEvent(eventId?: number): void {
    if (!this.canManageEvents || !eventId) {
      return;
    }

    this.eventApiService.deleteEvent(eventId).subscribe({
      next: () => {
        this.showSuccess('Evento removido com sucesso.');
        this.loadEvents();
        if (this.selectedEventId === eventId) {
          this.selectedEventId = null;
          this.activities = [];
        }
      },
      error: (error) => {
        console.error('Erro ao remover evento:', error);
        this.showError('Erro ao remover evento.');
      }
    });
  }

  resetEventForm(): void {
    this.eventForm.reset({
      id: null,
      nome: '',
      local: '',
      inicio: '',
      fim: ''
    });
  }

  submitActivity(): void {
    if (!this.canManageActivities) {
      this.showError('Sem permissao para gerir atividades.');
      return;
    }

    if (!this.selectedEventId) {
      this.showError('Selecione um evento para gerir atividades.');
      return;
    }

    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    const value = this.activityForm.value;
    const inicio = this.toApiDateTime(value.inicio);
    const fim = this.toApiDateTime(value.fim);

    if (!this.isEndAfterStart(inicio, fim)) {
      this.showError('A data/hora de fim da atividade deve ser maior que a de inicio.');
      return;
    }

    if (!this.isInsideEventWindow(inicio, fim, this.selectedEventId)) {
      this.showError('A atividade deve estar dentro da janela do evento.');
      return;
    }

    const payload = this.buildActivityPayload();
    if (!payload) {
      return;
    }

    if (value.id) {
      this.activityApiService.update(value.id, payload).subscribe({
        next: () => {
          this.showSuccess('Atividade atualizada com sucesso.');
          this.resetActivityForm();
          this.loadActivities(this.selectedEventId as number);
        },
        error: (error) => {
          console.error('Erro ao atualizar atividade:', error);
          this.showError('Erro ao atualizar atividade.');
        }
      });
      return;
    }

    this.activityApiService.create(this.selectedEventId, payload).subscribe({
      next: () => {
        this.showSuccess('Atividade criada com sucesso.');
        this.resetActivityForm();
        this.loadActivities(this.selectedEventId as number);
      },
      error: (error) => {
        console.error('Erro ao criar atividade:', error);
        this.showError('Erro ao criar atividade.');
      }
    });
  }

  editActivity(activity: ActivityModel): void {
    this.activityForm.patchValue({
      id: activity.id || null,
      tipo: activity.tipo,
      nome: activity.nome,
      descricao: activity.descricao,
      inicio: this.toInputDateTime(activity.inicio),
      fim: this.toInputDateTime(activity.fim),
      localComplemento: activity.localComplemento,
      sistema: activity.sistema || '',
      numeroVagas: activity.numeroVagas || null,
      tagsText: (activity.tags || []).join(', '),
      narradorId: activity.narradorId || null,
      tema: activity.tema || '',
      palestranteId: activity.palestranteId || null
    });
  }

  deleteActivity(activityId?: number): void {
    if (!activityId || !this.selectedEventId || !this.canManageActivities) {
      return;
    }

    this.activityApiService.delete(activityId).subscribe({
      next: () => {
        this.showSuccess('Atividade removida com sucesso.');
        this.loadActivities(this.selectedEventId as number);
      },
      error: (error) => {
        console.error('Erro ao remover atividade:', error);
        this.showError('Erro ao remover atividade.');
      }
    });
  }

  resetActivityForm(): void {
    this.activityForm.reset({
      id: null,
      tipo: ActivityType.RPG_MESA,
      nome: '',
      descricao: '',
      inicio: '',
      fim: '',
      localComplemento: '',
      sistema: '',
      numeroVagas: null,
      tagsText: '',
      narradorId: null,
      tema: '',
      palestranteId: null
    });
  }

  private buildActivityPayload(): CreateActivityPayload | null {
    const value = this.activityForm.value;
    const payload: CreateActivityPayload = {
      tipo: value.tipo,
      nome: value.nome,
      descricao: value.descricao,
      inicio: this.toApiDateTime(value.inicio),
      fim: this.toApiDateTime(value.fim),
      localComplemento: value.localComplemento
    };

    if (value.tipo === ActivityType.RPG_MESA) {
      const tags = `${value.tagsText || ''}`
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      if (!value.sistema || !value.numeroVagas || value.numeroVagas <= 0 || !value.narradorId || tags.length === 0) {
        this.showError('Para RPG_MESA informe sistema, vagas, narrador e tags.');
        return null;
      }

      payload.sistema = value.sistema;
      payload.numeroVagas = Number(value.numeroVagas);
      payload.narradorId = Number(value.narradorId);
      payload.tags = tags;
    }

    if (value.tipo === ActivityType.WORKSHOP) {
      if (!value.tema || !value.palestranteId) {
        this.showError('Para WORKSHOP informe tema e palestrante.');
        return null;
      }

      payload.tema = value.tema;
      payload.palestranteId = Number(value.palestranteId);
    }

    return payload;
  }

  private isInsideEventWindow(inicio: string, fim: string, eventId: number): boolean {
    const event = this.events.find(item => item.id === eventId);
    if (!event) {
      return false;
    }

    const eventStart = new Date(event.inicio).getTime();
    const eventEnd = new Date(event.fim).getTime();
    const activityStart = new Date(inicio).getTime();
    const activityEnd = new Date(fim).getTime();

    return activityStart >= eventStart && activityEnd <= eventEnd;
  }

  private isEndAfterStart(inicio: string, fim: string): boolean {
    return new Date(fim).getTime() > new Date(inicio).getTime();
  }

  private toInputDateTime(value: string): string {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toApiDateTime(value: string): string {
    const date = new Date(value);
    const pad = (n: number): string => `${n}`.padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3500,
      panelClass: ['snackbar-error']
    });
  }
}
