import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, map, startWith } from 'rxjs';
import { StateService } from '../../services/state/state.service';
import { Router } from '@angular/router';
import { EventService } from '../../services/event/event.service';
import { BR_DATE_FORMATS } from '../../utils/utils';

@Component({
  selector: 'app-new-event',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule
  ],
  templateUrl: './new-event.component.html',
  styleUrls: ['./new-event.component.scss']
})
export class NewEventComponent implements OnInit {
  eventForm!: FormGroup;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Lista de tags disponíveis (depois substituir por endpoint)
  availableTags: string[] = [
    'D&D 5E', 'Pathfinder', 'Call of Cthulhu', 'Vampire', 'Savage Worlds',
    'GURPS', 'RPG Nacional', 'Sistema Próprio', 'One Shot', 'Campanha',
    'Iniciante', 'Experiente', 'Terror', 'Fantasia', 'Ficção Científica'
  ];

  selectedTags: string[] = [];
  filteredTags!: Observable<string[]>;

  // Opções de horário
  timeOptions: string[] = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ];

  constructor(
    private fb: FormBuilder,
    private stateService: StateService,
    private router: Router,
    private eventService: EventService,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngOnInit(): void {
    this.dateAdapter.setLocale('pt-BR');  // ← Adicione esta linha
    this.initForm();
    this.setupTagsFilter();
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      sistema: ['', Validators.required],
      horario: ['', Validators.required],
      numeroDeVagas: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      data: ['', Validators.required],
      local: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(10)]],
      tagInput: [''] // Para o input de tags
    });
  }

  setupTagsFilter(): void {
    this.filteredTags = this.eventForm.get('tagInput')!.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ? this._filterTags(value) : this.availableTags.slice())
    );
  }

  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.availableTags.filter(tag =>
      tag.toLowerCase().includes(filterValue) && !this.selectedTags.includes(tag)
    );
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.selectedTags.includes(value)) {
      this.selectedTags.push(value);
      this.eventForm.get('tagInput')?.setValue('');
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  selectTag(tag: string): void {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.eventForm.get('tagInput')?.setValue('');
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.eventForm.valid && this.selectedTags.length > 0) {
      const formData = this.eventForm.value;

      const eventData = {
        titulo: formData.titulo,
        sistema: formData.sistema,
        horario: formData.horario,
        numeroDeVagas: formData.numeroDeVagas,
        narrador: this.stateService.userData?.id?.toString() || '1',
        data: this.formatDate(formData.data),
        local: formData.local,
        tags: this.selectedTags,
        descricao: formData.descricao,
        jogadores: []
      };


      this.eventService.createEvent(eventData).subscribe({
        next: (response) => {
          this.router.navigate(['/dashboard']);
        },
        complete: () => {
          // console.log('Requisição completa');
        },
        error: (error) => {
          console.error('Erro ao criar evento:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
