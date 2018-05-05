class AppController {
  /* @ngInject */
  constructor($interval, $rootScope, $state, $http, OAuth, $window, Session, $location, AppAction) {
    this.$interval = $interval;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.$http = $http;
    this.OAuth = OAuth;
    this.$window = $window;
    this.$location = $location;
    this.Session = Session;
    this.AppAction = AppAction;
    this.user = this.Session.read('userinfo');
    this.company = this.Session.read('company');

    this.app = {
      name: 'MSGQue',
      version: '1.0.0',
      settings: {
        themeID: 1,
        navbarHeaderColor: 'bg-primary',
        navbarCollapseColor: 'bg-primary lter',
        asideColor: 'bg-primary bg-gd-dk',
        headerFixed: true,
        asideFixed: true,
        asideFolded: false,
        asideDock: false,
        container: false,
        offScreen: false, // flag for show of sidebar for mobile view
        mobileHeader: false, // flag to show header Nav and Search in mobile view
      },
    };
  }

  $onInit() {
    // keeps track of state change and hides sidebar view for mobile

    this.showNotepad = false;
    this.showDateTime();

    this.$rootScope.$on('$stateChangeStart', () => {
      this.app.settings.offScreen = false;
      this.app.settings.mobileHeader = false;
    });

    this.$rootScope.$on('sessionUpdated', (e, d) => {
      this.user = d;
    });

    if (this.$location.search().uid) {
      this.AppAction
        .loginUUID(this.$location.search().uid)
        .then(() => this.$state.go(
          this.$state.current.name,
          Object.assign(this.$state.params, { uid: undefined })));
    }
  }

  showDateTime() {
    this.$interval(() => {
      this.dayTime = new Date();
    },500);
  }

  logout() {
    return this.OAuth
      .revokeToken()
      .then(() => {
        this.Session.destroy();
        if (this.$state.current.auth) this.$state.go('home.dash');
        else this.$state.go('login');
        return this.$window.location.reload();
      });
  }
}

export default AppController;
