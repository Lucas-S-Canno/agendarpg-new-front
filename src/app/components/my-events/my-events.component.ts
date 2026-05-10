import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { EventModelV2 } from '../../models/event.model';
import { EventUpdateService } from '../../services/event/event-update.service';
import { EventApiService } from '../../services/event/event-api.service';
import { StateService } from '../../services/state/state.service';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.scss'
})
export class MyEventsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = true;
  readonly displayedColumns = ['nome', 'local', 'inicio', 'fim', 'acoes'];
  readonly dataSource = new MatTableDataSource<EventModelV2>([]);
  private subscription: Subscription = new Subscription();

  constructor(
    private readonly eventApiService: EventApiService,
    private readonly eventUpdateService: EventUpdateService,
    private readonly stateService: StateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyCreatedEvents();

    this.subscription.add(
      this.eventUpdateService.eventUpdated$.subscribe(() => {
        this.loadMyCreatedEvents();
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMyCreatedEvents(): void {
    this.loading = true;
    this.eventApiService.getEvents().subscribe({
      next: (response) => {
        const events = this.filterEventsByCreator(response.data ?? []);
        const sortedEvents = [...events].sort((a, b) => {
          return new Date(b.inicio).getTime() - new Date(a.inicio).getTime();
        });
        this.dataSource.data = sortedEvents;
        this.dataSource.paginator = this.paginator;
      },
      error: (error) => {
        console.error('Erro ao carregar eventos criados:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private filterEventsByCreator(events: EventModelV2[]): EventModelV2[] {
    const userId = this.stateService.userData?.id;
    if (!userId) {
      return [];
    }

    return events.filter((event) => this.extractCreatorId(event) === userId);
  }

  private extractCreatorId(event: EventModelV2): number | null {
    const eventAny = event as unknown as Record<string, unknown>;
    const creatorKeys = [
      'criadorId',
      'createdById',
      'usuarioCriadorId',
      'coordenadorId',
      'ownerId',
      'userId'
    ];

    for (const key of creatorKeys) {
      const value = eventAny[key];
      if (typeof value === 'number') {
        return value;
      }
    }

    const nestedCreator = eventAny['createdBy'] as Record<string, unknown> | undefined;
    if (nestedCreator && typeof nestedCreator['id'] === 'number') {
      return nestedCreator['id'] as number;
    }

    const nestedCriador = eventAny['criador'] as Record<string, unknown> | undefined;
    if (nestedCriador && typeof nestedCriador['id'] === 'number') {
      return nestedCriador['id'] as number;
    }

    return null;
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  editEvent(event: EventModelV2): void {
    this.router.navigate(['/novo-evento'], {
      queryParams: {
        id: event.id,
        nome: event.nome,
        local: event.local,
        inicio: event.inicio,
        fim: event.fim
      }
    });
  }
}
