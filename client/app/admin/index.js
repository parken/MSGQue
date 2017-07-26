import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './admin.routes';

import adminCtrl from './dashboard/dashboard.controller';
import adminTpl from './dashboard/dashboard.pug';

export default angular
  .module('msgQueApp.admin', [
    uiRouter,
  ])
  .config(routing)
  .component('adminDashboard', {
    template: adminTpl,
    controller: adminCtrl,
  })
  .name;
