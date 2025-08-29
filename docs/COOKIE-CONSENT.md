# Sistema de Consentimento de Cookies

Este documento explica como funciona o sistema de consentimento de cookies implementado na aplicação Angular.

## Visão Geral

O sistema implementa um banner de consentimento que aparece na primeira visita do usuário, solicitando permissão para usar cookies. Dependendo da escolha do usuário, a aplicação pode ou não utilizar cookies para funcionalidades como autenticação e persistência de dados.

## Componentes Principais

### 1. CookieConsentService
**Local:** `src/app/services/cookie-consent/cookie-consent.service.ts`

Serviço responsável por gerenciar o consentimento de cookies:
- `getConsent()`: Verifica se o usuário já deu consentimento
- `setConsent(accepted: boolean)`: Define a escolha do usuário
- `canUseCookies()`: Verifica se é permitido usar cookies
- `shouldShowBanner()`: Determina se o banner deve ser exibido
- `resetConsent()`: Remove o consentimento (para testes/configurações)

### 2. CookieBannerComponent
**Local:** `src/app/shared/cookie-banner/cookie-banner.component.ts`

Componente que exibe o banner de consentimento:
- Interface amigável com opções de aceitar/rejeitar
- Seção expansível com detalhes sobre os cookies utilizados
- Design responsivo para diferentes tamanhos de tela
- Integração com Material Design

### 3. StateService (Modificado)
**Local:** `src/app/services/state/state.service.ts`

Serviço de estado modificado para respeitar o consentimento:
- Verifica permissão antes de definir/ler cookies
- Exibe avisos quando cookies não podem ser utilizados
- Métodos auxiliares para verificar restrições de login

## Tipos de Cookies

### Cookies Essenciais (sempre permitidos)
- `cookie_consent`: Armazena a escolha do usuário sobre cookies
- `cookie_consent_date`: Data da decisão sobre consentimento

### Cookies Funcionais (requerem consentimento)
- `auth_token`: Token de autenticação do usuário
- `user_data`: Dados criptografados do usuário logado

## Fluxo de Funcionamento

1. **Primeira Visita**
   - Banner é exibido automaticamente
   - Usuário escolhe aceitar ou rejeitar cookies
   - Escolha é salva em cookie essencial

2. **Consentimento Aceito**
   - Todos os cookies podem ser utilizados
   - Login e funcionalidades completas disponíveis
   - Banner não aparece mais

3. **Consentimento Rejeitado**
   - Apenas cookies essenciais são utilizados
   - Login é bloqueado com aviso ao usuário
   - Funcionalidades limitadas
   - Banner não aparece mais

4. **Configuração Manual**
   - Usuário pode resetar consentimento via menu
   - Banner reaparece para nova escolha

## Integração com Autenticação

### LoginComponent
O componente de login verifica o consentimento antes de permitir login:
```typescript
if (!this.cookieConsentService.canUseCookies()) {
  // Exibe aviso sobre necessidade de cookies
  return;
}
```

### StateService
Todas as operações de cookie verificam consentimento:
```typescript
if (!this.cookieConsentService.canUseCookies()) {
  console.warn('Cookies não permitidos');
  return;
}
```

## Configuração e Personalização

### Textos do Banner
Os textos podem ser modificados em:
- `cookie-banner.component.ts` (template)

### Estilos
Estilos podem ser customizados em:
- `cookie-banner.component.scss`
- `styles.scss` (estilos globais de snackbar)

### Lista de Cookies
Para adicionar novos cookies não-essenciais, edite:
```typescript
// Em cookie-consent.service.ts
const nonEssentialCookies = [
  'auth_token',
  'user_data',
  'novo_cookie_aqui' // Adicione aqui
];
```

## Conformidade com LGPD/GDPR

O sistema implementa:
- ✅ Consentimento explícito antes do uso
- ✅ Opção clara de recusa
- ✅ Informações sobre tipos de cookies
- ✅ Possibilidade de alterar consentimento
- ✅ Funcionalidade limitada sem consentimento
- ✅ Cookies essenciais claramente identificados

## Testes

### Testando o Banner
1. Abra o navegador em modo privado
2. Acesse a aplicação
3. Banner deve aparecer automaticamente

### Testando Rejeição
1. Clique em "Rejeitar" no banner
2. Tente fazer login
3. Deve aparecer aviso sobre cookies necessários

### Testando Reset
1. Com consentimento dado/rejeitado
2. Clique em "Configurar Cookies" no menu
3. Banner deve reaparecer

## Troubleshooting

### Banner não aparece
- Verifique se `CookieBannerComponent` está importado em `app.component.ts`
- Verifique console para erros de JavaScript

### Cookies não funcionam
- Verifique se `canUseCookies()` retorna `true`
- Verifique se o domínio suporta cookies
- Verifique configurações do navegador

### Erro de compilação
- Certifique-se de que todas as importações estão corretas
- Verifique se Material Design está configurado
- Execute `ng build` para verificar erros

## Próximos Passos

Possíveis melhorias futuras:
- Integração com Google Analytics (com consentimento)
- Cookies de preferências do usuário
- Analytics de consentimento
- Configurações granulares por tipo de cookie
- Integração com ferramentas de compliance
