# TO-DO
- Nome do narrrador no modal de evento
[x] endpoint dos dados basicos do narrador ( id, nome e email ), http://localhost:8080/api/user-app/user/narrator-name/{id}
[x] trocar dashboard para não mostrar o nome do narrador e mostrar somente após o usuário estar logado (LGPD)
[x] talvez adicionar o campo de apelido no cadastro de usuário
[] tratar na hora da criaçao do evento um botão switch se a pessoa quer mostrar o nome dela como narrador ou o apelido

- Alterar formato da data no modal de evento esta yyyy-mm-dd, alterar para dd/mm/yyyy

- Criar pagina de perfil do usuário
  [x] Criar componente
  [x] liberar editar alguns campos (validar quais poderão ser alterados)
  [x] Criar service e colocar endpoint para atualizar o perfil
  [] Criar lógica para alteração de senha (necessário backend)

- Criar modal para aceitação do uso de Cookies (talvez precise de algo no backend)
  [x] Implementado sistema completo de consentimento de cookies
  [x] Banner responsivo com opções de aceitar/rejeitar
  [x] Integração com autenticação
  [x] Configuração via menu do usuário
  [x] Documentação completa em docs/COOKIE-CONSENT.md

- Colocar toaster no topo da tela para mostrar sucesso ou falha no endpoint
  [x] Implementado com Material Snackbar no sistema de login e cookies

# AgendarpdNewFront

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
