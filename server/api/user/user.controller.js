import request from 'request';

import config from '../../config/environment';
import logger from '../../components/logger';
import { sms, slack } from '../../components/notify';
import oAuthModel from '../../components/oauth/model';
import { getRouteType } from '../../conn/sqldb/helper';

import db from '../../conn/sqldb';


export function me(req, res, next) {
  return Promise.all([
    db.User
      .findById(req.user.id, {
        attributes: ['mobile', 'email', 'name', 'id', 'roleId', 'admin'],
        raw: 'true',
      }),
    db.Route.findAll(),
  ])
    .then(([u, upstreams]) => res.json(Object.assign(u, { upstreams })))
    .catch(next);
}


export function index(req, res, next) {
  return db.User
    .findAll()
    .then(data => res.json(data))
    .catch(next);
}

export function show(req, res, next) {
  switch (req.user.roleId) {
    case 1:
    case 2: {
      return db.User
        .find({
          where: { id: req.params.id },
          attributes: [
            'id',
            'name',
            'email',
            'mobile',
            'supportName',
            'supportMobile',
            'supportEmail',
            'loginUrl',
          ],
        })
        .then(data => res.json(data))
        .catch(next);
    }
    default: {
      return db.User
        .find({
          where: { id: req.params.id },
          attributes: ['id', 'name', 'email', 'mobile'],
        })
        .then(data => res.json(data))
        .catch(next);
    }
  }

}

export function showUuid(req, res, next) {
  return db.LoginIdentifier
    .find({
      where: { uuid: req.params.uuid },
      attributes: ['id'],
      include: [{
        model: db.User,
        attributes: ['id', 'mobile', 'otp'],
        required: true,
      }],
    })
    .then((loginIdentifier) => {
      if (!loginIdentifier) return res.status(404).json({ message: 'Invalid Request' });
      return res.json(loginIdentifier.User);
    })
    .catch(next);
}

export function create(req, res, next) {
  const user = req.body;
  if (`${user.mobile}`.length === 10) user.mobile += 910000000000;
  if (`${user.supportMobile}`.length === 10) user.supportMobile += 910000000000;
  user.groupId = 2;
  user.createdBy = req.user.id;
  return db.User
    .create(user)
    .then(data => res.json(data))
    .catch(next);
}

export function createCustomer(req, res, next) {
  const user = req.body;
  user.roleId = 5;
  user.createdBy = req.user.id;
  user.otp = Math.floor(Math.random() * 90000) + 10000;
  delete user.id;
  return db.User
    .find({ where: { email: user.email, createdBy: user.createdBy, roleId: user.roleId } })
    .then(data => (data
      ? Promise.resolve(data)
      : db.User.create(user)))
    .then(data => res.json(data))
    .catch(next);
}

export function signup(req, res, next) {
  const { id, name, password, otp, email } = req.body;
  db.User.find({
    attributes: ['id'],
    where: { id, otp },
  })
    .then((u) => {
      if (!u) return res.status(400).json({ error_description: 'Invalid OTP' });
      u
        .update({ otpStatus: 0, name, password, email })
        .catch(err => logger.error('user.ctrl/otpVerify', err));
      slack(`Signup: ${u.id}, ${u.name}, ${u.mobile}, ${u.email}`);
      return res.status(201).end();
    }).catch(next);
}

function getApp(code) {
  return db.AuthCode.find({ where: { auth_code: code }, include: [db.App] })
    .then(authCode => authCode.App.toJSON());
}

export function login(req, res, next) {
  const { code } = req.body;
  return (code
    ? getApp(code)
    : db.App.findById(1, { raw: true }))
    .then((app) => {
      const options = {
        url: `${config.OAUTH_SERVER}${config.OAUTH_ENDPOINT}`,
        auth: {
          user: app.clientId,
          pass: app.clientSecret,
        },
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        },
      };

      options.form = code
        ? { grant_type: 'authorization_code', redirect_uri: `${app.redirectUri}`, code }
        : { grant_type: 'password', username: req.body.username, password: req.body.password };

      request.post(options, (err, apires, body) => {
        if (err) return res.status(500).json({ err, body });
        return res.status(apires.statusCode).send(body);
      });
    });
}

export function refresh(req, res, next) {
  return db.App
    .find({
      include: [{
        model: db.RefreshToken,
        where: { refreshToken: req.body.refresh_token },
        required: true,
      }],
    })
    .then((app) => {
      if (!app) return res.status(400).json({ message: 'Invalid Token' });
      const options = {
        url: `${config.OAUTH_SERVER}${config.OAUTH_ENDPOINT}`,
        auth: {
          user: app.clientId,
          pass: app.clientSecret,
        },
        form: {
          grant_type: 'refresh_token',
          refresh_token: req.body.refreshToken,
        },
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        },
      };
      return request
        .post(options, (err, apires, body) => {
          if (err) return res.status(500).send(err);
          return res.status(apires.statusCode).send(body);
        });
    });
}

export function logout(req, res, next) {
  return oAuthModel
    .revokeToken(req.body.access_token)
    .then(up => res.status(200).json(up))
    .catch(next);
}

export function duplicate(req, res, next) {
  const mobile = `91${req.query.mobile}`;
  return db.User
    .count({ where: { mobile } })
    .then(data => res.json({ mobile: !!data }))
    .catch(next);
}

export function update(req, res, next) {
  const id = req.user.id || req.params.id;
  const user = req.body;
  delete user.id;
  if (req.user.id) {
    delete user.alternateMobile;
  }
  return db.User
    .update(user, {
      where: {
        id,
      },
    })
    .then(() => res.json({ id }))
    .catch(next);
}

// Check email and phone exists
export function checkExists(req, res, next) {
  return db.User
    .checkExists(db, req.query.email, req.query.mobile)
    .then(status => res.json(status))
    .catch(next);
}

export function otpLogin(req, res, next) {
  return db.User
    .findOrCreate({
      where: {
        mobile: req.body.username || req.body.mobile,
      },
      attributes: ['id', 'otpStatus', 'otp', 'mobile'],
    }).then(([user, newUser]) => {
      if (!user) {
        return res.status(400).json({
          message: 'User Details not matching with our records. Please contact support',
        });
      }

      const otp = user.otpStatus === 1 && user.otp
        ? user.otp
        : Math.floor(Math.random() * 90000) + 10000;

      const text = `${otp} is your OTP. Treat this as confidential. Sharing it with anyone gives` +
        'them full access to your account. We never call you to verify OTP.';
      if (user.mobile) sms({ to: user.mobile, text });
      db.User
        .update({ otp, otpStatus: 1 }, { where: { id: user.id } })
        .catch(err => logger.error('user.ctrl/otp', err));
      return res.json({ message: 'success', id: user.id, newUser });
    }).catch(next);
}

export function otpSend(req, res, next) {
  db.User.find({
    where: {
      $or: {
        email: req.body.username,
        mobile: req.body.username,
      },
    },
    attributes: ['id', 'otpStatus', 'otp', 'mobile'],
  }).then((user) => {
    if (!user) {
      return res.status(400).json({
        message: 'User Details not matching with our records. Please contact support',
      });
    }

    const otp = user.otpStatus === 1 && user.otp
      ? user.otp
      : Math.floor(Math.random() * 90000) + 10000;

    const text = `${otp} is your OTP. Treat this as confidential. Sharing it with anyone gives` +
      'them full access to your account. We never call you to verify OTP.';
    if (user.mobile) sms({ to: user.mobile, text });
    db.User
      .update({ otp, otpStatus: 1 }, { where: { id: user.id } })
      .catch(err => logger.error('user.ctrl/otp', err));
    return res.json({ message: 'success', id: user.id });
  }).catch(next);
}

export function otpVerify(req, res, next) {
  db.User.find({
    attributes: ['id'],
    where: {
      $or: [{ id: req.body.id }, { mobile: req.body.mobile }],
      otp: req.body.otp,
    },
  })
    .then((user) => {
      if (!user) return res.status(400).json({ error_description: 'Invalid OTP' });
      user
        .update({ otpStatus: 0 })
        .catch(err => logger.error('user.ctrl/otpVerify', err));
      return res.json({ message: 'success', id: user.id });
    }).catch(next);
}


// Creates a new User in the DB
export function passwordChange(req, res, next) {
  return db.User.find({
    where: {
      id: req.body.id,
      otp: req.body.otp,
    },
    attributes: ['id', 'mobile', 'email', 'name'],
  }).then((u) => {
    if (!u) {
      return res
        .status(400)
        .json({ error: 'Invalid password', error_description: 'Invalid current password' });
    }

    return u.update({ password: req.body.password })
      .then(() => {
        res.status(204).end();
        u.revokeTokens(db); // revoke all
        const { id, name, mobile, email } = u;
        return slack(`Password change: ${id}, ${name}, ${mobile}, ${email}`);
      });
  })
    .catch(next);
}

export function sendLogin(req, res, next) {
  return db.User
    .find({ where: { id: req.params.id } })
    .then((user) => {
      if (!user) return res.status(404).end();
      const otp = user.otpStatus === 1 && user.otp
        ? user.otp
        : Math.floor(Math.random() * 90000) + 10000;

      const text = `Your account has been created click on the link to login ${
        req.origin}/home?otp=${otp}&id=${user.mobile}`;

      if (user.mobile) sms({ to: user.mobile, text });
      db.User
        .update({ otp, otpStatus: 1 }, { where: { id: user.id } })
        .catch(err => logger.error('user.ctrl/otp', err));
      return res.json({ message: 'success', id: user.id });
    })
    .catch(next);
}

export function loginUid(req, res, next) {
  return res.status(500).json({});
}

export function addSellingRootUser(req, res, next) {
  const { userId, routeId, limit } = req.body;
  if (!userId || !routeId || !limit || req.user.roleId !== 1) {
    return res.status(404).json({ message: 'Invalid Request.' });
  }
  return db.Selling.create({ userId,
    routeId,
    limit,
    createdBy: req.user.id,
    updatedBy: req.user.id })
    .then(() => res.status(202).end())
    .catch(next);
}

export function addSelling(req, res, next) {
  const { userId, sendingUserId, routeId, limit, fromUserId } = req.body;
  if (!userId || !sendingUserId || !routeId || !limit) {
    return res.status(404).json({ message: 'Invalid Request.' });
  }
  if (req.user[`sellingBalance${getRouteType(routeId)}`] < limit) {
    return res.status(404).json({ message: 'Limit Exceeded.' });
  }
  return db.Selling.create({ userId,
    sendingUserId,
    routeId,
    limit,
    fromUserId: fromUserId || req.user.id,
    createdBy: req.user.id,
    updatedBy: req.user.id })
    .then(() => res.status(202).end())
    .catch(next);
}
