import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { EventApiService } from '../../services/event/event-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    const updates$ = new Subject<string | void>();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: EventApiService, useValue: { getEvents: () => of({ statusCode: 200, data: [] }) } },
        { provide: EventUpdateService, useValue: { eventUpdated$: updates$.asObservable() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
