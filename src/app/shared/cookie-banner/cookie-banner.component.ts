import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';
import { CookieConsentService } from '../../services/cookie-consent/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="cookie-banner-overlay" *ngIf="showBanner">
      <mat-card class="cookie-banner">
        <mat-card-content>
          <div class="cookie-content">
            <mat-icon class="cookie-icon">cookie</mat-icon>
            <div class="cookie-text">
              <h3>Uso de Cookies</h3>
              <p>
                Este site utiliza cookies para manter você logado e melhorar sua experiência.
                Os cookies são essenciais para o funcionamento da autenticação e navegação.
              </p>

              <div class="cookie-details" *ngIf="!showDetails">
                <button
                  mat-button
                  color="primary"
                  (click)="toggleDetails()"
                  class="details-button">
                  <mat-icon>expand_more</mat-icon>
                  Ver detalhes dos cookies
                </button>
              </div>

              <div class="cookie-details-expanded" *ngIf="showDetails">
                <button
                  mat-button
                  color="primary"
                  (click)="toggleDetails()"
                  class="details-button">
                  <mat-icon>expand_less</mat-icon>
                  Ocultar detalhes
                </button>

                <div class="cookie-info">
                  <h4>Cookies utilizados:</h4>
                  <ul class="cookie-list">
                    <li><strong>Token de Autenticação:</strong> Para manter você logado entre as sessões (cookie de sessão)</li>
                    <li><strong>Dados do Usuário:</strong> Para personalizar sua experiência e exibir informações relevantes</li>
                    <li><strong>Consentimento de Cookies:</strong> Para lembrar sua escolha sobre o uso de cookies</li>
                  </ul>

                  <h4>Por que precisamos de cookies?</h4>
                  <p class="cookie-explanation">
                    Sem cookies, não podemos manter você logado entre as páginas ou quando você retorna ao site.
                    Eles são fundamentais para a segurança e funcionalidade da aplicação.
                  </p>

                  <h4>Seus direitos:</h4>
                  <p class="cookie-rights">
                    Você pode rejeitar os cookies, mas isso limitará significativamente a funcionalidade do site.
                    Você pode alterar sua decisão a qualquer momento nas configurações do seu navegador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions class="cookie-actions">
          <button
            mat-stroked-button
            color="primary"
            (click)="onReject()"
            class="reject-button">
            <mat-icon>block</mat-icon>
            Rejeitar
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="onAccept()"
            class="accept-button">
            <mat-icon>check</mat-icon>
            Aceitar Cookies
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styleUrls: ['./cookie-banner.component.scss']
})
export class CookieBannerComponent implements OnInit, OnDestroy {
  showBanner = false;
  showDetails = false;
  private subscription?: Subscription;

  constructor(private cookieConsentService: CookieConsentService) {}

  ngOnInit(): void {
    // Verifica se deve mostrar o banner
    this.showBanner = this.cookieConsentService.shouldShowBanner();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onAccept(): void {
    this.cookieConsentService.setConsent(true);
    this.showBanner = false;
  }

  onReject(): void {
    this.cookieConsentService.setConsent(false);
    this.showBanner = false;

    // Avisa o usuário sobre as limitações
    this.showRejectionWarning();
  }

  private showRejectionWarning(): void {
    // Você pode implementar um toast ou dialog aqui
    alert('Cookies rejeitados. Algumas funcionalidades podem ser limitadas, como manter-se logado entre sessões.');
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
}
