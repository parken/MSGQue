class NavigationController {
  /* @ngInject */
  constructor($state, Session, OTP, OAuth) {
    this.$state = $state;
    this.Session = Session;
    this.OTP = OTP;
    this.OAuth = OAuth;
  }

  $onInit() {
    this.user = this.Session.read('userinfo');

    // - admin
    this.menus = {
      1: [{name: 'Send SMS', state: 'home.sendSms', icon: 'fa fa-chat'}],
      2: [
        {name: 'SenderID Approval', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Actual Consumption', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Sales Consumption', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Transaction IN', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Transaction OUT', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Sales Consumption', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Add new User', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'My user credits', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'My users', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'User Reports', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'My Profile', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Web Settings -> Site Settings', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Web Settings -> Site Credits', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Group Add', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Group List', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Dynamic SMS', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Sent SMS', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Scheduled SMS', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Error Code', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'Templates', state: 'admin.users.list', icon: 'fa fa-user'},
        {name: 'HTTP API', state: 'admin.users.list', icon: 'fa fa-user'},
        // user level features
        {name: '----- User', state: 'home.sendSms', icon: 'fa fa-chat'},
        {name: 'Send SMS', state: 'home.sendSms', icon: 'fa fa-chat'},
      ],
    };

  }

}

export default NavigationController;
