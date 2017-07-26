import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './user.routes';
import UserAddComponent from './add/add.controller';
import UserProfileComponent from './profile/profile.controller';
import UsersListComponent from './list/list.controller';

export default angular
  .module('msgQueApp.user', [
    uiRouter,
  ])
  .component('userAdd', UserAddComponent)
  .component('userProfile', UserProfileComponent)
  .component('usersList', UsersListComponent)
  .config(routing)
  .name;
